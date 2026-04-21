import express from 'express';
import Stripe from 'stripe';
import { ethers } from 'ethers';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { PrivyClient } from '@privy-io/server-auth';
import { Resend } from 'resend';
import { render } from '@react-email/render';
import RoyaltyCertificateEmail from './emails/RoyaltyCertificateEmail.jsx';
import React from 'react';

dotenv.config({ path: '../.env' });

const app = express();
const port = process.env.PORT || 4000;

app.use(helmet());
app.use(cors());

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

// Initialize Privy Server API
const privy = new PrivyClient(
  process.env.PRIVY_APP_ID,
  process.env.PRIVY_APP_SECRET
);

// Initialize Resend
const resend = new Resend(process.env.RESEND_API);
const EMAIL_FROM = process.env.EMAIL_FROM || 'onboarding@resend.dev';

// We need the raw body for the Stripe webhook verification.
app.use('/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

// Initialize Contract (requires env variables)
const provider = new ethers.JsonRpcProvider(process.env.AMOY_RPC_URL);
// Using a mock wallet or placeholder if key is undefined or invalid
const isValidKey = process.env.PRIVATE_KEY && process.env.PRIVATE_KEY.length === 66 && process.env.PRIVATE_KEY.startsWith('0x');
const signer = isValidKey 
  ? new ethers.Wallet(process.env.PRIVATE_KEY, provider)
  : ethers.Wallet.createRandom().connect(provider);

// ABI snippet for minting
const royaltyCertificateABI = [
  "function mintCertificate(address to, string memory tokenURI, uint256 shareBasisPoints) external returns (uint256)"
];

const isValidContract = process.env.CONTRACT_ADDRESS && process.env.CONTRACT_ADDRESS.length === 42 && process.env.CONTRACT_ADDRESS.startsWith('0x');
const contractAddress = isValidContract ? process.env.CONTRACT_ADDRESS : "0x0000000000000000000000000000000000000000";
const contract = new ethers.Contract(contractAddress, royaltyCertificateABI, signer);

app.post('/api/create-checkout', async (req, res) => {
  try {
    const { amount, shareBps, metadataURI, buyerWallet, email } = req.body;

    if (!buyerWallet) {
        return res.status(400).json({ error: 'Missing buyer embedded wallet address' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: email, // Optional auto-fill
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Royalty Certificate',
              description: `Ownership Share: ${shareBps / 100}%`,
            },
            unit_amount: amount, // in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/cancel`,
      metadata: {
        buyerWallet: buyerWallet,
        shareBps: shareBps.toString(),
        metadataURI: metadataURI || 'ipfs://placeholder',
      },
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;

      if (session.payment_status !== 'paid') {
          console.log(`Payment not complete for session ${session.id}`);
          return res.status(200).send('OK');
      }

      const buyerWallet = session.metadata?.buyerWallet;
      const shareBps = parseInt(session.metadata?.shareBps || '0');
      const metadataURI = session.metadata?.metadataURI;

      if (!buyerWallet || !shareBps) {
        console.error('Missing required metadata in session:', session.id);
        return res.status(200).send('OK - Missing metadata');
      }

      console.log(`Minting certificate to ${buyerWallet} for session ${session.id}...`);
      
      try {
          const tx = await contract.mintCertificate(
            buyerWallet,
            metadataURI,
            shareBps
          );
          await tx.wait();
          console.log(`✅ Successfully minted for session ${session.id}, Tx: ${tx.hash}`);
      } catch (mintError) {
          console.error(`❌ Minting failed for ${session.id}:`, mintError);
          // Still send email if appropriate, or handle error
      }
      console.log(`✅ Mock Mint Success! Wallet: ${buyerWallet}`);

      // 4. Send Confirmation Email via Resend
      try {
        const recipientEmail = session.customer_details?.email; 
        if (!recipientEmail) throw new Error('No recipient email found');
        
        console.log(`📧 Sending confirmation email to ${recipientEmail}...`);
        
        const emailHtml = await render(
          React.createElement(RoyaltyCertificateEmail, {
            buyerName: session.customer_details?.name || 'Valued Partner',
            orderId: session.id.slice(-8).toUpperCase(),
            purchaseDate: new Date().toLocaleDateString(),
            bookTitle: "The Silken Thread", 
            amountPaid: (session.amount_total / 100).toFixed(2),
            sharePercentage: (shareBps / 100).toString(),
            tokenId: "1001",
            walletAddress: buyerWallet,
          })
        );

        const { data, error } = await resend.emails.send({
          from: EMAIL_FROM,
          to: [recipientEmail],
          subject: 'Thank You – Your Royalty Certificate Purchase is Confirmed',
          html: emailHtml,
        });

        if (error) {
          console.error('❌ Resend Error:', error);
        } else {
          console.log('✅ Email sent successfully:', data.id);
        }
      } catch (emailError) {
        console.error('❌ Failed to send email:', emailError);
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error(`Error processing event ${event.type}:`, error);
    // Important: Return 200 anyway so Stripe doesn't keep retrying forever
    res.status(200).send('OK');
  }
});

app.get('/api/session-details/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    res.json({
      buyerName: session.customer_details?.name || 'Valued Partner',
      email: session.customer_details?.email,
      amount: (session.amount_total / 100).toFixed(2),
      sharePercentage: (parseInt(session.metadata?.shareBps || '100') / 100).toString(),
      walletAddress: session.metadata?.buyerWallet || '0x...',
      bookTitle: "The Silken Thread",
      status: session.payment_status,
    });
  } catch (error) {
    console.error('Error fetching session details:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`🚀 Royalty Backend server listening on port ${port}`);
});
