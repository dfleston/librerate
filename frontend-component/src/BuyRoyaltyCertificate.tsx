import React, { useState } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { loadStripe } from '@stripe/stripe-js';

export interface BuyRoyaltyCertificateProps {
  stripePublishableKey: string;
  backendCreateCheckoutUrl: string;
  priceAmountInCents: number;
  shareBps: number;
  metadataURI?: string;
  buttonText?: string;
}

export function BuyRoyaltyCertificate({
  stripePublishableKey,
  backendCreateCheckoutUrl,
  priceAmountInCents = 1000, // $10.00 default
  shareBps = 100, // 1% default
  metadataURI = 'ipfs://placeholder',
  buttonText = 'Buy Royalty Certificate',
}: BuyRoyaltyCertificateProps) {
  const { login, authenticated, user, ready } = usePrivy();
  const { wallets } = useWallets();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeCheckout = async () => {
    const embeddedWallet = wallets.find(w => w.walletClientType === 'privy');
    if (!embeddedWallet) return;

    setLoading(true);

    try {
      const response = await fetch(backendCreateCheckoutUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user?.email?.address,
          amount: priceAmountInCents,
          buyerWallet: embeddedWallet.address,
          shareBps,
          metadataURI,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { sessionId } = await response.json();
      const stripePromise = loadStripe(stripePublishableKey);
      const stripe = await stripePromise;
      if (stripe) {
        await stripe.redirectToCheckout({ sessionId });
      }
    } catch (err: any) {
      console.error("Buy flow error:", err);
      setError(err.message || 'An unexpected error occurred');
      setLoading(false);
    }
  };

  // Auto-trigger checkout once authenticated and wallet is ready
  React.useEffect(() => {
    const isPending = localStorage.getItem('royalty_pending_checkout') === 'true';
    console.log('[BuyButton] Check Auth State:', { authenticated, walletCount: wallets.length, isPending, loading, ready });
    
    if (authenticated && wallets.length > 0 && isPending && !loading) {
      console.log('[BuyButton] 🚀 PRE-CONDITION MET: Auto-triggering Stripe checkout...');
      localStorage.removeItem('royalty_pending_checkout');
      executeCheckout();
    }
  }, [authenticated, wallets, loading, ready]);

  const handleBuy = async () => {
    console.log('[BuyButton] handleBuy clicked. Authenticated:', authenticated);
    setError(null);

    if (!authenticated) {
      console.log('[BuyButton] Not authenticated. Setting pending flag and triggering login...');
      localStorage.setItem('royalty_pending_checkout', 'true');
      login();
      return;
    }

    executeCheckout();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <button
        onClick={handleBuy}
        disabled={loading}
        style={{
          backgroundColor: loading ? "#8a7355" : "#c4a96a",
          color: "#0d0d0d",
          padding: "14px 36px",
          fontFamily: "'Helvetica Neue', Arial, sans-serif",
          fontWeight: 700,
          fontSize: "10px",
          letterSpacing: "0.25em",
          textTransform: "uppercase" as const,
          border: "none",
          borderRadius: "0",
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.6 : 1,
          transition: "background-color 0.3s, opacity 0.3s",
          width: "100%",
        }}
        onMouseOver={(e) => {
          if (!loading) e.currentTarget.style.backgroundColor = "#d4b97a";
        }}
        onMouseOut={(e) => {
          if (!loading) e.currentTarget.style.backgroundColor = "#c4a96a";
        }}
      >
        {loading 
          ? "Processing..." 
          : authenticated 
            ? "Acquire Royalty Share Right" 
            : "Create your Digital Wallet"}
      </button>

      {error && (
        <span
          style={{
            fontFamily: "'Helvetica Neue', Arial, sans-serif",
            fontSize: "11px",
            letterSpacing: "0.05em",
            color: "#c0392b",
            marginTop: "4px",
          }}
        >
          {error}
        </span>
      )}

      <p
        style={{
          fontFamily: "'Helvetica Neue', Arial, sans-serif",
          fontSize: "9px",
          fontWeight: 700,
          letterSpacing: "0.2em",
          textTransform: "uppercase" as const,
          color: "#6a5f50",
          textAlign: "center" as const,
          margin: "4px 0 0",
        }}
      >
        Fiat checkout. Wallet generated automatically.
      </p>
    </div>
  );
}
