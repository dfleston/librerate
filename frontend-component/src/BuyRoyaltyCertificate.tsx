import React, { useState, useEffect, useCallback } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { loadStripe } from '@stripe/stripe-js';

// ─── Types ────────────────────────────────────────────────────────────────────
interface OfferingTerms {
  minBuyAmountUSD: number;    // cents
  totalOfferedBps: number;    // basis points
  offeringValueUSD: number;   // cents
  minBuyDollars: number;
  totalOfferedPercent: number;
  offeringValueDollars: number;
}

interface SessionDetails {
  buyerName: string;
  email: string;
  amount: string;
  sharePercentage: string;
  walletAddress: string;
  bookTitle: string;
  status: string;
}

export interface BuyRoyaltyCertificateProps {
  /** Base URL of the backend, e.g. "http://localhost:4000" */
  backendUrl: string;
  stripePublishableKey: string;
  metadataURI?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const toPercent = (amountCents: number, terms: OfferingTerms): number => {
  if (!terms.offeringValueUSD) return 0;
  return (amountCents / terms.offeringValueUSD) * (terms.totalOfferedBps / 100);
};

const fmt = (n: number, decimals = 2) => n.toFixed(decimals);

// ─── SuccessView ──────────────────────────────────────────────────────────────
function SuccessView({
  details,
  onBack,
}: {
  details: SessionDetails;
  onBack: () => void;
}) {
  return (
    <div style={styles.wrapper}>
      <div style={successStyles.header}>
        <p style={successStyles.confirmedLabel}>PURCHASE CONFIRMED</p>
        <h2 style={successStyles.title}>Ownership Secured.</h2>
        <p style={successStyles.subtitle}>
          You now hold a stake in "{details.bookTitle}"
        </p>
      </div>

      <div style={successStyles.statGrid}>
        <div style={successStyles.statBox}>
          <span style={successStyles.statLabel}>Ownership Share</span>
          <span style={successStyles.statValue}>{details.sharePercentage}%</span>
        </div>
        <div style={successStyles.statBox}>
          <span style={successStyles.statLabel}>Amount Paid</span>
          <span style={successStyles.statValue}>${details.amount} USD</span>
        </div>
      </div>

      <div style={successStyles.infoRow}>
        <span style={successStyles.infoLabel}>Buyer</span>
        <span style={successStyles.infoValue}>{details.buyerName}</span>
      </div>

      <div style={successStyles.infoRow}>
        <span style={successStyles.infoLabel}>Wallet Address</span>
        <span style={successStyles.walletBox}>{details.walletAddress}</span>
      </div>

      <p style={successStyles.hint}>
        Your Royalty Certificate has been minted to your embedded wallet.
        USDC distributions will be deposited automatically.
      </p>

      <button onClick={onBack} style={styles.button}>
        BACK
      </button>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export function BuyRoyaltyCertificate({
  backendUrl,
  stripePublishableKey,
  metadataURI = 'ipfs://placeholder',
}: BuyRoyaltyCertificateProps) {
  const { login, authenticated, user, ready } = usePrivy();
  const { wallets } = useWallets();

  const [phase, setPhase] = useState<'buy' | 'success'>('buy');
  const [sessionDetails, setSessionDetails] = useState<SessionDetails | null>(null);

  const [terms, setTerms]       = useState<OfferingTerms | null>(null);
  const [termsError, setTermsError] = useState<string | null>(null);
  const [amount, setAmount]     = useState<number>(0);     // in cents
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  // ─── Detect session_id from URL (Stripe return) ────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    if (sessionId && backendUrl) {
      fetch(`${backendUrl}/api/session-details/${sessionId}`)
        .then(r => {
          if (!r.ok) throw new Error('Failed to fetch session details');
          return r.json();
        })
        .then((data: SessionDetails) => {
          setSessionDetails(data);
          setPhase('success');
          // Clean up URL
          const url = new URL(window.location.href);
          url.searchParams.delete('session_id');
          window.history.replaceState({}, '', url.toString());
        })
        .catch(err => {
          console.error('Error fetching session details:', err);
        });
    }
  }, [backendUrl]);

  // ─── Fetch offering terms on mount ──────────────────────────────────────────
  useEffect(() => {
    if (!backendUrl) return;
    fetch(`${backendUrl}/api/offering-terms`)
      .then(r => r.json())
      .then((data: OfferingTerms) => {
        setTerms(data);
        setAmount(data.minBuyAmountUSD); // default to minimum
      })
      .catch(() => setTermsError('Could not load offering terms. Please try again.'));
  }, [backendUrl]);

  // ─── Checkout logic ─────────────────────────────────────────────────────────
  const executeCheckout = useCallback(async (amountCents: number) => {
    const embeddedWallet = wallets.find(w => w.walletClientType === 'privy');
    if (!embeddedWallet) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${backendUrl}/api/create-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user?.email?.address,
          amount: amountCents,
          buyerWallet: embeddedWallet.address,
          metadataURI,
          returnUrl: window.location.href.split('?')[0], // current page without query params
        }),
      });

      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.error || 'Failed to create checkout session');
      }

      const { sessionId, url } = await response.json();
      if (url) {
        window.location.href = url;
      } else {
        const stripe = await loadStripe(stripePublishableKey);
        if (stripe) {
          await stripe.redirectToCheckout({ sessionId });
        }
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      setLoading(false);
    }
  }, [wallets, user, backendUrl, stripePublishableKey, metadataURI]);

  // ─── Auto-trigger after login ────────────────────────────────────────────────
  useEffect(() => {
    const pending = localStorage.getItem('royalty_pending_amount');
    if (authenticated && wallets.length > 0 && pending && !loading) {
      localStorage.removeItem('royalty_pending_amount');
      executeCheckout(parseInt(pending, 10));
    }
  }, [authenticated, wallets, loading, executeCheckout]);

  // ─── Buy handler ─────────────────────────────────────────────────────────────
  const handleBuy = () => {
    setError(null);
    if (!authenticated) {
      localStorage.setItem('royalty_pending_amount', amount.toString());
      login();
      return;
    }
    executeCheckout(amount);
  };

  // ─── SUCCESS VIEW ───────────────────────────────────────────────────────────
  if (phase === 'success' && sessionDetails) {
    return (
      <SuccessView
        details={sessionDetails}
        onBack={() => {
          setPhase('buy');
          setSessionDetails(null);
        }}
      />
    );
  }

  // ─── Derived state ───────────────────────────────────────────────────────────
  const userPercent  = terms ? toPercent(amount, terms) : 0;
  const amountDollars = amount / 100;
  const sliderMin    = terms?.minBuyAmountUSD ?? 100;
  const sliderMax    = terms?.offeringValueUSD ?? 100_000;

  const buttonLabel = loading
    ? 'Processing...'
    : authenticated
      ? 'Acquire Royalty Share'
      : 'Create Your Digital Wallet';

  // ─── BUY VIEW ───────────────────────────────────────────────────────────────
  return (
    <div style={styles.wrapper}>

      {/* Terms loading / error */}
      {termsError && <p style={styles.termsError}>{termsError}</p>}

      {terms && (
        <>
          {/* Offering info strip */}
          <div style={styles.infoStrip}>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Offered</span>
              <span style={styles.infoValue}>{fmt(terms.totalOfferedPercent)}%</span>
            </div>
            <div style={styles.infoDivider} />
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Total Value</span>
              <span style={styles.infoValue}>${fmt(terms.offeringValueDollars, 0)}</span>
            </div>
            <div style={styles.infoDivider} />
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Min. Buy</span>
              <span style={styles.infoValue}>${fmt(terms.minBuyDollars, 0)}</span>
            </div>
          </div>

          {/* Amount input */}
          <div style={styles.inputGroup}>
            <label style={styles.inputLabel}>Investment Amount (USD)</label>
            <div style={styles.inputRow}>
              <span style={styles.currencySign}>$</span>
              <input
                id="amount-input"
                type="number"
                min={terms.minBuyDollars}
                max={terms.offeringValueDollars}
                step="1"
                value={amountDollars}
                onChange={e => {
                  const v = Math.round(parseFloat(e.target.value) * 100) || sliderMin;
                  setAmount(Math.max(sliderMin, Math.min(sliderMax, v)));
                }}
                style={styles.input}
              />
            </div>
          </div>

          {/* Slider */}
          <div style={styles.sliderGroup}>
            <input
              id="amount-slider"
              type="range"
              min={sliderMin}
              max={sliderMax}
              step={100} // $1 increments
              value={amount}
              onChange={e => setAmount(parseInt(e.target.value, 10))}
              style={styles.slider}
            />
            <div style={styles.sliderLabels}>
              <span>${fmt(terms.minBuyDollars, 0)}</span>
              <span>${fmt(terms.offeringValueDollars, 0)}</span>
            </div>
          </div>

          {/* Live share preview */}
          <div style={styles.sharePreview}>
            <span style={styles.shareLabel}>You receive</span>
            <span style={styles.shareValue}>{fmt(userPercent, 4)}%</span>
            <span style={styles.shareLabel}>of royalties</span>
          </div>
        </>
      )}

      {/* Buy button */}
      <button
        id="buy-royalty-btn"
        onClick={handleBuy}
        disabled={loading || !!termsError || !terms}
        style={{
          ...styles.button,
          backgroundColor: (loading || !!termsError || !terms) ? '#5a4f3f' : '#c4a96a',
          cursor: (loading || !!termsError || !terms) ? 'not-allowed' : 'pointer',
          opacity: (loading || !!termsError || !terms) ? 0.6 : 1,
        }}
        onMouseOver={e => {
          if (!loading && terms) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#d4b97a';
        }}
        onMouseOut={e => {
          if (!loading && terms) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#c4a96a';
        }}
      >
        {buttonLabel}
      </button>

      {error && <p style={styles.errorMsg}>{error}</p>}

      <p style={styles.footerNote}>Fiat checkout · Wallet generated automatically · Polygon Amoy</p>

      {/* Slider track styling */}
      <style>{`
        #amount-slider {
          -webkit-appearance: none;
          appearance: none;
          height: 2px;
          background: linear-gradient(
            to right,
            #c4a96a ${terms ? ((amount - sliderMin) / (sliderMax - sliderMin)) * 100 : 0}%,
            #2a2520 ${terms ? ((amount - sliderMin) / (sliderMax - sliderMin)) * 100 : 0}%
          );
          outline: none;
          border-radius: 0;
        }
        #amount-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          background: #c4a96a;
          border-radius: 0;
          cursor: pointer;
        }
        #amount-slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          background: #c4a96a;
          border: none;
          border-radius: 0;
          cursor: pointer;
        }
        #amount-input::-webkit-inner-spin-button,
        #amount-input::-webkit-outer-spin-button {
          -webkit-appearance: none;
        }
      `}</style>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const font = "'Helvetica Neue', Arial, sans-serif";

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    width: '100%',
  },
  infoStrip: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 16px',
    backgroundColor: '#0a0908',
    border: '1px solid #2a2520',
  },
  infoItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    flex: 1,
  },
  infoLabel: {
    fontFamily: font,
    fontSize: '8px',
    fontWeight: 700,
    letterSpacing: '0.2em',
    textTransform: 'uppercase' as const,
    color: '#6a5f50',
  },
  infoValue: {
    fontFamily: font,
    fontSize: '16px',
    fontWeight: 700,
    color: '#c4a96a',
  },
  infoDivider: {
    width: '1px',
    height: '32px',
    backgroundColor: '#2a2520',
    margin: '0 8px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  inputLabel: {
    fontFamily: font,
    fontSize: '8px',
    fontWeight: 700,
    letterSpacing: '0.25em',
    textTransform: 'uppercase' as const,
    color: '#8a7355',
  },
  inputRow: {
    display: 'flex',
    alignItems: 'center',
    border: '1px solid #2a2520',
    backgroundColor: '#0a0908',
  },
  currencySign: {
    fontFamily: font,
    fontSize: '14px',
    color: '#6a5f50',
    padding: '0 12px',
    fontWeight: 700,
  },
  input: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    outline: 'none',
    fontFamily: font,
    fontSize: '18px',
    fontWeight: 700,
    color: '#e8e0d0',
    padding: '12px 12px 12px 0',
  },
  sliderGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  slider: {
    width: '100%',
    cursor: 'pointer',
  },
  sliderLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    fontFamily: font,
    fontSize: '8px',
    letterSpacing: '0.1em',
    color: '#4a4038',
  },
  sharePreview: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: '8px',
    padding: '16px',
    backgroundColor: '#0a0908',
    border: '1px solid #2a2520',
  },
  shareLabel: {
    fontFamily: font,
    fontSize: '9px',
    fontWeight: 700,
    letterSpacing: '0.2em',
    textTransform: 'uppercase' as const,
    color: '#6a5f50',
  },
  shareValue: {
    fontFamily: font,
    fontSize: '24px',
    fontWeight: 700,
    color: '#c4a96a',
    lineHeight: 1,
  },
  button: {
    color: '#0d0d0d',
    padding: '16px 36px',
    fontFamily: font,
    fontWeight: 700,
    fontSize: '10px',
    letterSpacing: '0.25em',
    textTransform: 'uppercase' as const,
    border: 'none',
    borderRadius: '0',
    transition: 'background-color 0.3s, opacity 0.3s',
    width: '100%',
    backgroundColor: '#c4a96a',
    cursor: 'pointer',
  },
  errorMsg: {
    fontFamily: font,
    fontSize: '11px',
    letterSpacing: '0.05em',
    color: '#c0392b',
    margin: '0',
    textAlign: 'center' as const,
  },
  termsError: {
    fontFamily: font,
    fontSize: '11px',
    letterSpacing: '0.05em',
    color: '#c0392b',
    margin: '0',
    textAlign: 'center' as const,
  },
  footerNote: {
    fontFamily: font,
    fontSize: '8px',
    fontWeight: 700,
    letterSpacing: '0.2em',
    textTransform: 'uppercase' as const,
    color: '#3a3028',
    textAlign: 'center' as const,
    margin: '0',
  },
};

// ─── Success View Styles ──────────────────────────────────────────────────────
const successStyles: Record<string, React.CSSProperties> = {
  header: {
    textAlign: 'center',
    marginBottom: '32px',
    borderBottom: '1px solid #2a2520',
    paddingBottom: '24px',
  },
  confirmedLabel: {
    fontFamily: font,
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.35em',
    textTransform: 'uppercase',
    color: '#c4a96a',
    margin: '0 0 12px 0',
  },
  title: {
    fontSize: '28px',
    fontWeight: 600,
    color: '#e8e0d0',
    margin: '0 0 8px 0',
    lineHeight: 1.2,
    fontFamily: "Georgia, 'Times New Roman', serif",
  },
  subtitle: {
    fontFamily: "Georgia, 'Times New Roman', serif",
    color: '#6a5f50',
    fontSize: '14px',
    fontStyle: 'italic',
    margin: 0,
  },
  statGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
    marginBottom: '24px',
  },
  statBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  statLabel: {
    fontFamily: font,
    fontSize: '9px',
    fontWeight: 700,
    letterSpacing: '0.25em',
    textTransform: 'uppercase',
    color: '#6a5f50',
  },
  statValue: {
    fontSize: '22px',
    fontWeight: 600,
    color: '#d4c9b5',
    fontFamily: "Georgia, 'Times New Roman', serif",
  },
  infoRow: {
    marginBottom: '20px',
  },
  infoLabel: {
    display: 'block',
    fontFamily: font,
    fontSize: '9px',
    fontWeight: 700,
    letterSpacing: '0.25em',
    textTransform: 'uppercase',
    color: '#6a5f50',
    marginBottom: '6px',
  },
  infoValue: {
    fontSize: '15px',
    fontWeight: 400,
    color: '#e8e0d0',
    fontFamily: "Georgia, 'Times New Roman', serif",
  },
  walletBox: {
    display: 'block',
    backgroundColor: '#161412',
    borderLeft: '3px solid #c4a96a',
    padding: '14px 18px',
    fontFamily: 'monospace',
    fontSize: '12px',
    wordBreak: 'break-all',
    color: '#c4a96a',
  },
  hint: {
    fontFamily: "Georgia, 'Times New Roman', serif",
    fontSize: '13px',
    color: '#6a5f50',
    marginTop: '24px',
    marginBottom: '24px',
    lineHeight: 1.6,
    fontStyle: 'italic',
  },
};
