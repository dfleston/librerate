import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.js';

import { PrivyBuyFlowProvider } from 'royalty-buy-button';

const PRIVY_APP_ID = import.meta.env.VITE_PRIVY_APP_ID || 'cmo7meu4f00ik0cjsl1hni7pa';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PrivyBuyFlowProvider appId={PRIVY_APP_ID}>
      <App />
    </PrivyBuyFlowProvider>
  </React.StrictMode>
);
