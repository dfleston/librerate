import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';

interface SessionDetails {
  buyerName: string;
  email: string;
  amount: string;
  sharePercentage: string;
  walletAddress: string;
  bookTitle: string;
  status: string;
}

export default function SuccessPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [details, setDetails] = useState<SessionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionId) {
      fetch(`http://localhost:4000/api/session-details/${sessionId}`)
        .then((res) => {
          if (!res.ok) throw new Error('Failed to fetch details');
          return res.json();
        })
        .then((data) => setDetails(data))
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [sessionId]);

  if (loading) {
    return (
      <div style={containerStyle}>
        <div className="spinner"></div>
        <p style={{ ...paragraphStyle, marginTop: '20px', color: '#c4a96a' }}>VERIFYING CERTIFICATE...</p>
      </div>
    );
  }

  if (error || !details) {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <h2 style={{ ...h2Style, color: '#c0392b' }}>ERROR</h2>
          <p style={paragraphStyle}>{error || 'Session not found'}</p>
          <Link to="/" style={buttonStyle}>RETURN HOME</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={headerStyle}>
          <p style={labelStyle}>PURCHASE CONFIRMED</p>
          <h1 style={h1Style}>Ownership Secured.</h1>
          <p style={subtitleStyle}>You now hold a stake in "{details.bookTitle}"</p>
        </div>

        <div style={detailsContainerStyle}>
          <div style={statGridStyle}>
            <div style={statBoxStyle}>
              <span style={statLabelStyle}>Ownership Share</span>
              <span style={statValueStyle}>{details.sharePercentage}%</span>
            </div>
            <div style={statBoxStyle}>
              <span style={statLabelStyle}>Amount Paid</span>
              <span style={statValueStyle}>${details.amount} USD</span>
            </div>
          </div>

          <div style={infoRowStyle}>
            <span style={infoLabelStyle}>Buyer</span>
            <span style={infoValueStyle}>{details.buyerName}</span>
          </div>

          <div style={infoRowStyle}>
            <span style={infoLabelStyle}>Wallet Address</span>
            <span style={walletBoxStyle}>{details.walletAddress}</span>
          </div>
          
          <p style={hintStyle}>
            Your Royalty Certificate has been minted to your embedded wallet. 
            USDC distributions will be deposited automatically.
          </p>
        </div>

        <div style={actionContainerStyle}>
          <a 
            href="https://dashboard.privy.io" 
            target="_blank" 
            rel="noopener noreferrer"
            style={buttonStyle}
          >
            ACCESS YOUR DASHBOARD
          </a>
          <Link to="/" style={secondaryButtonStyle}>BACK TO LANDING</Link>
        </div>
      </div>
      
      <style>{`
        .spinner {
          width: 32px;
          height: 32px;
          border: 1px solid #2a2520;
          border-top-color: #c4a96a;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  backgroundColor: '#0d0d0d',
  padding: '24px',
  fontFamily: "Georgia, 'Times New Roman', serif",
  color: '#a09080',
};

const cardStyle: React.CSSProperties = {
  backgroundColor: '#111010',
  border: '1px solid #2a2520',
  padding: '48px',
  width: '100%',
  maxWidth: '560px',
  position: 'relative',
  zIndex: 10,
};

const headerStyle: React.CSSProperties = {
  textAlign: 'center',
  marginBottom: '40px',
  borderBottom: '1px solid #2a2520',
  paddingBottom: '32px',
};

const labelStyle: React.CSSProperties = {
  fontFamily: "'Helvetica Neue', Arial, sans-serif",
  fontSize: '10px',
  fontWeight: 700,
  letterSpacing: '0.35em',
  textTransform: 'uppercase',
  color: '#c4a96a',
  margin: '0 0 16px 0',
};

const h1Style: React.CSSProperties = {
  fontSize: '32px',
  fontWeight: '600',
  color: '#e8e0d0',
  margin: '0 0 8px 0',
  lineHeight: '1.2',
};

const h2Style: React.CSSProperties = {
  fontFamily: "'Helvetica Neue', Arial, sans-serif",
  fontSize: '14px',
  fontWeight: 700,
  letterSpacing: '0.15em',
  textTransform: 'uppercase',
  color: '#c4a96a',
  margin: '0 0 16px 0',
};

const subtitleStyle: React.CSSProperties = {
  color: '#6a5f50',
  fontSize: '16px',
  fontStyle: 'italic',
  margin: 0,
};

const paragraphStyle: React.CSSProperties = {
  fontSize: '16px',
  lineHeight: '1.7',
  margin: '0 0 16px 0',
};

const detailsContainerStyle: React.CSSProperties = {
  marginBottom: '40px',
};

const statGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '24px',
  marginBottom: '32px',
};

const statBoxStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
};

const statLabelStyle: React.CSSProperties = {
  fontFamily: "'Helvetica Neue', Arial, sans-serif",
  fontSize: '9px',
  fontWeight: 700,
  letterSpacing: '0.25em',
  textTransform: 'uppercase',
  color: '#6a5f50',
  marginBottom: '8px',
};

const statValueStyle: React.CSSProperties = {
  fontSize: '24px',
  fontWeight: '600',
  color: '#d4c9b5',
};

const infoRowStyle: React.CSSProperties = {
  marginBottom: '24px',
};

const infoLabelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: "'Helvetica Neue', Arial, sans-serif",
  fontSize: '9px',
  fontWeight: 700,
  letterSpacing: '0.25em',
  textTransform: 'uppercase',
  color: '#6a5f50',
  marginBottom: '8px',
};

const infoValueStyle: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: '400',
  color: '#e8e0d0',
};

const walletBoxStyle: React.CSSProperties = {
  display: 'block',
  backgroundColor: '#161412',
  borderLeft: '3px solid #c4a96a',
  padding: '16px 20px',
  fontFamily: 'monospace',
  fontSize: '13px',
  wordBreak: 'break-all',
  color: '#c4a96a',
};

const hintStyle: React.CSSProperties = {
  fontSize: '13px',
  color: '#6a5f50',
  marginTop: '32px',
  lineHeight: '1.6',
  fontStyle: 'italic',
};

const actionContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
};

const buttonStyle: React.CSSProperties = {
  display: 'block',
  backgroundColor: '#c4a96a',
  color: '#0d0d0d',
  padding: '14px 36px',
  fontFamily: "'Helvetica Neue', Arial, sans-serif",
  fontWeight: 700,
  fontSize: '10px',
  letterSpacing: '0.25em',
  textTransform: 'uppercase',
  textDecoration: 'none',
  textAlign: 'center',
  transition: 'background-color 0.3s',
};

const secondaryButtonStyle: React.CSSProperties = {
  display: 'block',
  backgroundColor: 'transparent',
  color: '#6a5f50',
  padding: '14px 36px',
  fontFamily: "'Helvetica Neue', Arial, sans-serif",
  fontWeight: 700,
  fontSize: '10px',
  letterSpacing: '0.25em',
  textTransform: 'uppercase',
  textDecoration: 'none',
  textAlign: 'center',
  border: '1px solid #2a2520',
  transition: 'border-color 0.3s, color 0.3s',
};
