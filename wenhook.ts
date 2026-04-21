import express from 'express';
import Stripe from 'stripe';
import { ethers } from 'ethers';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const contract = new ethers.Contract(
  process.env.CONTRACT_ADDRESS!,
  royaltyCertificateABI,
  signer // your admin signer for minting on Amoy
);

router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        // Only process one-time payments (your use case)
        if (session.mode !== 'payment') break;

        const buyerEmail = session.customer_email;
        const buyerWallet = session.metadata?.buyerWallet;
        const shareBps = parseInt(session.metadata?.shareBps || '0');
        const metadataURI = session.metadata?.metadataURI;

        if (!buyerWallet || !shareBps || !metadataURI) {
          console.error('Missing metadata in session:', session.id);
          break;
        }

        // Mint on Polygon Amoy
        console.log(`Minting certificate to ${buyerWallet} for session ${session.id}`);
        const tx = await contract.mintCertificate(
          buyerWallet,
          metadataURI,
          shareBps
        );
        await tx.wait();

        // Optional: Save to your database (buyer, tokenId, sessionId, etc.)
        // await db.purchase.create({...});

        console.log(`✅ Successfully minted for session ${session.id}`);
        break;
      }

      case 'checkout.session.async_payment_succeeded': {
        // Handle rare async payments the same way
        const session = event.data.object as Stripe.Checkout.Session;
        // Reuse the same minting logic as above (you can extract to a function)
        console.log(`Async payment succeeded for session ${session.id}`);
        // ... call mint logic
        break;
      }

      case 'checkout.session.expired':
        console.log(`Checkout session expired: ${event.data.object.id}`);
        // Optional: cleanup or mark as abandoned
        break;

      case 'checkout.session.async_payment_failed':
      case 'payment_intent.payment_failed':
        console.warn(`Payment failed for event: ${event.type}`, event.data.object);
        // Optional: notify user or admin
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error(`Error processing event ${event.type}:`, error);
    // Important: Return 200 anyway so Stripe doesn't keep retrying forever
    // (You can implement idempotency with a processed_events table if needed)
    res.status(200).send('OK');
  }
});

export default router;