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
const public_url = process.env.NEXT_PUBLIC_BACKEND_URL;

// ─── CORS Configuration (single source of truth) ──────────────────────────────
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://lapromesadevuelta.com',
  'https://www.lapromesadevuelta.com',
  'https://promesadevuelta.com',
  'https://www.promesadevuelta.com',
];

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Explicit OPTIONS handler for preflight
app.options('*', cors());

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

// ─── Contract Setup ────────────────────────────────────────────────────────────
const provider = new ethers.JsonRpcProvider(process.env.AMOY_RPC_URL);
const isValidKey = process.env.PRIVATE_KEY && process.env.PRIVATE_KEY.length >= 64;
const signer = isValidKey
  ? new ethers.Wallet(process.env.PRIVATE_KEY.startsWith('0x') ? process.env.PRIVATE_KEY : `0x${process.env.PRIVATE_KEY}`, provider)
  : ethers.Wallet.createRandom().connect(provider);

const royaltyCertificateABI = [
  "function mintCertificate(address to, string memory tokenURI, uint256 shareBasisPoints) external returns (uint256)",
  "function getOfferingTerms() external view returns (uint256 minBuy, uint256 offeredBps, uint256 offerValue)",
  "function setOfferingTerms(uint256 minBuyAmountUSD, uint256 totalOfferedBps, uint256 offeringValueUSD) external",
];

const isValidContract = process.env.CONTRACT_ADDRESS && process.env.CONTRACT_ADDRESS.length === 42;
const contractAddress = isValidContract ? process.env.CONTRACT_ADDRESS : "0x0000000000000000000000000000000000000000";
const contract = new ethers.Contract(contractAddress, royaltyCertificateABI, signer);

// ─── Offering Terms Cache ──────────────────────────────────────────────────────
let termsCache = null;
let termsCachedAt = 0;
const CACHE_TTL_MS = 60_000; // 60 seconds

async function fetchOfferingTerms() {
  const now = Date.now();
  if (termsCache && (now - termsCachedAt) < CACHE_TTL_MS) {
    return termsCache;
  }

  const [minBuy, offeredBps, offerValue] = await contract.getOfferingTerms();

  termsCache = {
    minBuyAmountUSD: Number(minBuy),       // cents
    totalOfferedBps: Number(offeredBps),   // basis points
    offeringValueUSD: Number(offerValue),  // cents
    // Human-readable helpers
    minBuyDollars: Number(minBuy) / 100,
    totalOfferedPercent: Number(offeredBps) / 100,
    offeringValueDollars: Number(offerValue) / 100,
  };
  termsCachedAt = now;
  return termsCache;
}

// ─── GET /api/offering-terms ───────────────────────────────────────────────────
app.get('/api/offering-terms', async (req, res) => {
  console.log("📥 Petición recibida en /api/offering-terms");

  // Creamos una promesa que falla a los 5 segundos
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Timeout de conexión con blockchain')), 5000)
  );

  try {
    // Corremos la función del contrato vs el timeout
    const terms = await Promise.race([fetchOfferingTerms(), timeout]);
    console.log("✅ Datos obtenidos del contrato");
    res.json(terms);
  } catch (error) {
    console.error('❌ Error en offering-terms:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ─── POST /api/create-checkout ─────────────────────────────────────────────────
app.post('/api/create-checkout', async (req, res) => {
  try {
    const { amount, metadataURI, buyerWallet, email, returnUrl } = req.body;
    // NOTE: shareBps is no longer accepted from the client — it's calculated here
    //       from the on-chain terms to prevent manipulation.

    if (!buyerWallet) {
      return res.status(400).json({ error: 'Missing buyer embedded wallet address' });
    }
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Missing or invalid amount' });
    }

    // Fetch offering terms from chain (or cache)
    const terms = await fetchOfferingTerms();

    if (terms.offeringValueUSD === 0) {
      return res.status(400).json({ error: 'Offering terms have not been set on-chain yet.' });
    }

    // Validate minimum purchase
    if (amount < terms.minBuyAmountUSD) {
      return res.status(400).json({
        error: `Minimum purchase is $${terms.minBuyDollars.toFixed(2)}. You sent ${amount} cents.`,
      });
    }

    // Calculate shareBps server-side from on-chain terms
    // shareBps = (amount / offeringValueUSD) × totalOfferedBps
    const shareBps = Math.round((amount / terms.offeringValueUSD) * terms.totalOfferedBps);
    // Use returnUrl sent by frontend (exact page the user was on), fallback to referer, then env
    const baseUrl = returnUrl || req.headers.referer || process.env.FRONTEND_URL || 'http://localhost:3000';
    let cleanOriginUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    
    // Safely extract and preserve any hash fragment for anchor links
    let hash = '';
    const hashIndex = cleanOriginUrl.indexOf('#');
    if (hashIndex !== -1) {
      hash = cleanOriginUrl.substring(hashIndex);
      cleanOriginUrl = cleanOriginUrl.substring(0, hashIndex);
    }

    console.log(`[checkout] amount=${amount}¢, shareBps=${shareBps} (from on-chain terms)`);
    console.log(`[checkout] cleanOriginUrl=${cleanOriginUrl}, hash=${hash}`);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Royalty Certificate',
              description: `Ownership Share: ${(shareBps / 100).toFixed(4)}% of royalties`,
            },
            unit_amount: amount, // in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${cleanOriginUrl}?session_id={CHECKOUT_SESSION_ID}${hash}`,
      cancel_url: `${cleanOriginUrl}/cancel${hash}`,
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

// ─── POST /webhook ─────────────────────────────────────────────────────────────
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
        const tx = await contract.mintCertificate(buyerWallet, metadataURI, shareBps);
        await tx.wait();
        console.log(`✅ Successfully minted for session ${session.id}, Tx: ${tx.hash}`);
      } catch (mintError) {
        console.error(`❌ Minting failed for ${session.id}:`, mintError);
      }

      // Send Confirmation Email
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
    res.status(200).send('OK');
  }
});

// ─── GET /api/session-details/:sessionId ───────────────────────────────────────
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
  console.log(`Accesible públicamente en: ${public_url}`);
});
