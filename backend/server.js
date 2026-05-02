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

dotenv.config(); // Looks for .env in the current directory

const app = express();
const port = process.env.PORT || 4000;
const public_url = process.env.NEXT_PUBLIC_BACKEND_URL;

// ─── Initialize Services ──────────────────────────────────────────────────────
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2026-03-25.dahlia',
});

const privy = new PrivyClient(
  process.env.PRIVY_APP_ID,
  process.env.PRIVY_APP_SECRET
);

const resend = new Resend(process.env.RESEND_API);
const EMAIL_FROM = process.env.EMAIL_FROM || 'onboarding@resend.dev';

const provider = new ethers.JsonRpcProvider(process.env.AMOY_RPC_URL);
const isValidKey = process.env.PRIVATE_KEY && process.env.PRIVATE_KEY.length >= 64;
const signer = isValidKey
  ? new ethers.Wallet(process.env.PRIVATE_KEY.startsWith('0x') ? process.env.PRIVATE_KEY : `0x${process.env.PRIVATE_KEY}`, provider)
  : ethers.Wallet.createRandom().connect(provider);

const royaltyCertificateABI = [
  "event CertificateMinted(address indexed to, uint256 tokenId, uint256 shareBps)",
  "function mintCertificate(address to, string memory tokenURI, uint256 shareBasisPoints) external returns (uint256)",
  "function getOfferingTerms() external view returns (uint256 minBuy, uint256 offeredBps, uint256 offerValue)",
  "function setOfferingTerms(uint256 minBuyAmountUSD, uint256 totalOfferedBps, uint256 offeringValueUSD) external",
  "function shares(uint256 tokenId) view returns (uint256)",
  "function usdc() view returns (address)",
  "function balanceOf(address owner) view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
  "function totalShares() view returns (uint256)",
];

const ERC20_ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
];

const isValidContract = process.env.CONTRACT_ADDRESS && process.env.CONTRACT_ADDRESS.length === 42;
const contractAddress = isValidContract ? process.env.CONTRACT_ADDRESS : "0x0000000000000000000000000000000000000000";
const contract = new ethers.Contract(contractAddress, royaltyCertificateABI, signer);

// ─── Webhook Handler (MUST BE FIRST ROUTE) ───────────────────────────────────
app.use('/webhook', express.raw({ type: '*/*' }));

app.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  console.log("--------------------------------------------------");
  console.log("📨 WEBHOOK ATTEMPT RECEIVED");
  console.log(`🔑 Using Secret: ${webhookSecret?.slice(0, 10)}...${webhookSecret?.slice(-5)}`);
  console.log(`📊 Body Type: ${Buffer.isBuffer(req.body) ? 'Buffer' : typeof req.body}`);
  
  if (!sig || !Buffer.isBuffer(req.body)) {
    console.error("❌ REJECTED: Missing signature or body is not a Buffer");
    return res.status(400).send("Invalid request format");
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    console.log(`✅ VERIFIED: ${event.type}`);
  } catch (err) {
    console.error(`❌ VERIFICATION FAILED: ${err.message}`);
    console.log(`💡 Your .env secret starts with: ${webhookSecret?.slice(0, 10)}...`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      console.log(`🔔 Minting for Session: ${session.id}`);

      const buyerWallet = session.metadata?.buyerWallet;
      const shareBps = parseInt(session.metadata?.shareBps || '0');
      const metadataURI = session.metadata?.metadataURI;

      if (!buyerWallet || !shareBps) {
        console.error('❌ Metadata missing');
        return res.status(200).send('OK');
      }

      const tx = await contract.mintCertificate(buyerWallet, metadataURI, shareBps);
      console.log(`⏳ Tx: ${tx.hash}`);
      await tx.wait();
      console.log(`✅ MINTED!`);
      
      try {
        const recipientEmail = session.customer_details?.email;
        if (recipientEmail) {
          console.log(`📧 Sending confirmation email to ${recipientEmail}...`);
          const emailHtml = await render(
            React.createElement(RoyaltyCertificateEmail, {
              buyerName: session.customer_details?.name || 'Valued Partner',
              orderId: session.id.slice(-8).toUpperCase(),
              purchaseDate: new Date().toLocaleDateString(),
              bookTitle: "La Promesa Devuelta",
              amountPaid: (session.amount_total / 100).toFixed(2),
              sharePercentage: (shareBps / 100).toString(),
              tokenId: "...", 
              walletAddress: buyerWallet,
            })
          );
          await resend.emails.send({
            from: EMAIL_FROM,
            to: [recipientEmail],
            subject: 'Your Royalty Certificate Purchase is Confirmed',
            html: emailHtml,
          });
          console.log('✅ Email sent');
        }
      } catch (e) { console.error('❌ Email error:', e.message); }
    }
    res.status(200).send('OK');
  } catch (err) {
    console.error(`❌ Webhook error:`, err.message);
    res.status(200).send('OK');
  }
});

// ─── Middleware for other routes ─────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://lapromesadevuelta.com',
  'https://www.lapromesadevuelta.com',
];

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.options('*', cors());
app.use(express.json());

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


// ─── GET /api/tier-status ────────────────────────────────────────────────────
app.get('/api/tier-status', async (req, res) => {
  try {
    const totalShares = await contract.totalShares();
    const terms = await fetchOfferingTerms();
    
    res.json({
      totalSharesBps: Number(totalShares),
      totalOfferedBps: terms.totalOfferedBps,
      // Total percentage of the offering sold
      progressPercent: terms.totalOfferedBps > 0 
        ? (Number(totalShares) / terms.totalOfferedBps) * 100 
        : 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── POST /api/session-details/:sessionId ───────────────────────────────────────
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
// ─── POST /api/test-mint ─────────────────────────────────────────────────────
app.post('/api/test-mint', async (req, res) => {
  try {
    const { address, shareBps } = req.body;
    const tx = await contract.mintCertificate(address, "ipfs://test", shareBps || 10);
    await tx.wait();
    res.json({ success: true, hash: tx.hash });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/user-certificates/:address ─────────────────────────────────────
app.get("/api/user-certificates/:address", async (req, res) => {
  try {
    const { address } = req.params;
    if (!ethers.isAddress(address)) {
      return res.status(400).json({ error: "Invalid address" });
    }

    console.log(`🔎 Directly querying state for: ${address}`);

    // 1. Get how many tokens they own
    const balance = await contract.balanceOf(address);
    const count = Number(balance);

    const certificates = [];
    let totalBps = 0;

    // 2. Iterate through their tokens using Enumerable methods
    // This doesn't use eth_getLogs, so no block range limits!
    for (let i = 0; i < count; i++) {
      try {
        const tokenId = await contract.tokenOfOwnerByIndex(address, i);
        const bps = await contract.shares(tokenId);
        
        certificates.push({ 
          tokenId: tokenId.toString(), 
          shareBps: Number(bps) 
        });
        totalBps += Number(bps);
      } catch (err) {
        console.error(`Error reading token at index ${i}:`, err.message);
      }
    }

    // 3. USDC balance
    let usdcBalance = "0.00";
    try {
      const usdcAddress = await contract.usdc();
      const usdcContract = new ethers.Contract(usdcAddress, ERC20_ABI, provider);
      const bal = await usdcContract.balanceOf(address);
      const decimals = await usdcContract.decimals();
      usdcBalance = parseFloat(ethers.formatUnits(bal, decimals)).toFixed(2);
    } catch (err) {
      console.warn("Could not fetch USDC balance:", err.message);
    }

    res.json({
      certificates,
      totalBps,
      usdcBalance,
    });
  } catch (err) {
    console.error("user-certificates error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`🚀 Royalty Backend server listening on port ${port}`);
  console.log(`Accesible públicamente en: ${public_url}`);
});
