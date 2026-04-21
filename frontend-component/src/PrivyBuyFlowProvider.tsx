import React from 'react';
import { PrivyProvider } from '@privy-io/react-auth';

// Standard Polygon Amoy testnet ID
const polygonAmoy = {
  id: 80002,
  name: 'Polygon Amoy Testnet',
  network: 'polygon-amoy',
  nativeCurrency: {
    decimals: 18,
    name: 'MATIC',
    symbol: 'MATIC',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc-amoy.polygon.technology/'],
    },
    public: {
      http: ['https://rpc-amoy.polygon.technology/'],
    },
  },
  blockExplorers: {
    default: { name: 'PolygonScan', url: 'https://amoy.polygonscan.com' },
  },
};

export interface PrivyBuyFlowProviderProps {
  appId: string;
  children: React.ReactNode;
}

export function PrivyBuyFlowProvider({ appId, children }: PrivyBuyFlowProviderProps) {
  return (
    <PrivyProvider
      appId={appId}
      config={{
        loginMethods: ['email'],
        appearance: {
          theme: 'dark',
          accentColor: '#c4a96a',
          logo: 'https://your-logo-url',
        },
        embeddedWallets: {
          createOnLogin: 'all-users', // Ensure wallet is automatically generated
          noPromptOnSignature: true
        },
        defaultChain: polygonAmoy,
        supportedChains: [polygonAmoy]
      }}
    >
      {children}
    </PrivyProvider>
  );
}
