# Privy - Royalty Certificate MVP

A Proof of Concept (PoC) platform for purchasing **Royalty Certificates** (NFTs representing revenue-share agreements) via fiat and receiving automated on-chain USDC payouts.

The platform eliminates Web3 friction by providing a seamless Web2 experience, utilizing embedded wallets and fiat payment rails while leveraging blockchain for transparent ownership and automated distributions.

## 🚀 Key Features

- **Invisible Web3 Onboarding**: Uses [Privy](https://www.privy.io/) to generate embedded wallets automatically via email or Google login.
- **Fiat-to-NFT Flow**: Integrated [Stripe](https://stripe.com/) Checkout for purchasing certificates with credit cards.
- **Automated Minting**: Backend listeners trigger on-chain minting to the user's invisible wallet immediately after payment confirmation.
- **Proportional Payouts**: Smart contract logic that distributes USDC royalties to certificate holders automatically.
- **Institutional Bridge**: Kraken Embed strategy for bridging off-chain fiat royalties (e.g., from Amazon KDP) to on-chain USDC.

## 🏗️ Architecture

- **Frontend**: Next.js/React site utilizing the Privy SDK for authentication and Stripe for payments.
- **Backend**: Node.js/Express server handling Stripe webhooks and interacting with the smart contract via `ethers.js`.
- **Smart Contracts**: Solidity-based contracts (deployed on Polygon Amoy) managing the certificate ledger and payout logic.
- **Fiat Bridge**: Kraken API integration for automated fiat-to-USDC conversion and routing.

## 📂 Project Structure

```text
.
├── backend/                # Express server & Stripe webhook handlers
├── contracts/              # Hardhat-based Solidity smart contracts
├── frontend-component/     # Reusable React "Buy" component
├── preview-site/           # Vite-based demonstration site
└── techbrief.md           # Technical architecture and design goals
```

## ⚙️ Setup & Installation

### Prerequisites

- Node.js (v18+)
- Stripe Account (Developer mode)
- Privy App ID & Secret
- Polygon Amoy Testnet RPC & Funds

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env # Configure your keys
npm run dev
```

### 2. Frontend Setup

```bash
cd preview-site
npm install
npm run dev
```

### 3. Smart Contract Deployment

```bash
cd contracts
npm install
npx hardhat run scripts/deploy.ts --network amoy
```

## 📄 Documentation

For more detailed technical specifications, refer to:
- [Technical Brief](file:///Users/leston/code/Privy/techbrief.md)
- [Detailed Proposal](file:///Users/leston/code/Privy/detailedProposal.md)
- [Privy Integration Guide](file:///Users/leston/code/Privy/privy.md)

## 🛡️ License

Private / Internal PoC
