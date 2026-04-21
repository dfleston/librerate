import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { BuyRoyaltyCertificate } from 'royalty-buy-button';
import SuccessPage from './SuccessPage';

function LandingPage({ stripeKey }: { stripeKey: string }) {
  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <p style={labelStyle}>EARN AS THE WORK GROWS</p>
        <h1 style={titleStyle}>Royalty Certificate</h1>
        <p style={subtitleStyle}>Become a revenue partner in seconds. Stand behind a work you believe in.</p>
        
        <div style={buyContainerStyle}>
          {stripeKey ? (
            <BuyRoyaltyCertificate 
              stripePublishableKey={stripeKey}
              backendCreateCheckoutUrl="http://localhost:4000/api/create-checkout"
              priceAmountInCents={1000}
              shareBps={500}
              buttonText="ACQUIRE REGISTRY"
            />
          ) : (
            <div style={{ color: '#c4a96a', fontSize: '10px', letterSpacing: '0.2em' }}>
              INITIALIZING SECURE GATEWAY...
            </div>
          )}
        </div>

        <p style={footerHintStyle}>
          SECURE CHECKOUT — POLYGON AMOY NETWORK
        </p>
      </div>

      <style>{`
        body {
          margin: 0;
          background-color: #0d0d0d;
          font-family: Georgia, 'Times New Roman', serif;
        }
      `}</style>
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100vh',
  backgroundColor: '#0d0d0d',
};

const cardStyle: React.CSSProperties = {
  padding: '64px 48px',
  backgroundColor: '#111010',
  border: '1px solid #2a2520',
  textAlign: 'center',
  maxWidth: '480px',
  width: '100%',
};

const labelStyle: React.CSSProperties = {
  fontFamily: "'Helvetica Neue', Arial, sans-serif",
  fontSize: '9px',
  fontWeight: 700,
  letterSpacing: '0.35em',
  textTransform: 'uppercase',
  color: '#8a7355',
  marginBottom: '24px',
};

const titleStyle: React.CSSProperties = {
  fontSize: '36px',
  fontWeight: '600',
  color: '#e8e0d0',
  margin: '0 0 12px 0',
};

const subtitleStyle: React.CSSProperties = {
  color: '#a09080',
  fontSize: '16px',
  lineHeight: '1.6',
  marginBottom: '40px',
  fontStyle: 'italic',
};

const buyContainerStyle: React.CSSProperties = {
  marginBottom: '32px',
};

const footerHintStyle: React.CSSProperties = {
  fontFamily: "'Helvetica Neue', Arial, sans-serif",
  fontSize: '9px',
  fontWeight: 700,
  letterSpacing: '0.2em',
  color: '#3a3028',
  margin: 0,
};

function App() {
  const [stripeKey, setStripeKey] = useState('');

  useEffect(() => {
    // We inject the Stripe test key
    setStripeKey(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_51TOPpwDZSYB1TfMhT9rDRuWlwJ1OFdteZJL3xvK0gVxJqn1tAuTZ09DVbaA7u09WxrraUqx6ssKPgKDEH2Ai58m8003EGehgQQ');
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage stripeKey={stripeKey} />} />
        <Route path="/success" element={<SuccessPage />} />
      </Routes>
    </Router>
  );
}

export default App;
