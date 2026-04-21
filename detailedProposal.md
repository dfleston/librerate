Here's a clear, up-to-date list of **SDKs and libraries** you need for your Node.js backend + React frontend setup, starting on **Polygon Amoy** testnet.

### 1. Backend (Node.js / Express)

**Core dependencies** (run these commands):

```bash
npm install express stripe dotenv cors helmet
npm install ethers@^6.13.0   # or viem (recommended for modern setups)
npm install @privy-io/server-auth   # NEW: Privy Server SDK (best for getting wallet addresses securely)
```

**Development & Deployment tools:**

```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox ts-node typescript @types/node
npm install --save-dev @openzeppelin/contracts   # for the smart contract
```

**Recommended full package.json dependencies snippet:**

```json
{
  "dependencies": {
    "express": "^4.19.0",
    "stripe": "^17.0.0",           // Official Stripe Node SDK
    "dotenv": "^16.4.0",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "ethers": "^6.13.0",           // Solid choice for contract interaction
    "@privy-io/server-auth": "^1.0.0"   // For server-side Privy operations (get user + embedded wallet)
  },
  "devDependencies": {
    "hardhat": "^2.22.0",
    "@nomicfoundation/hardhat-toolbox": "^5.0.0",
    "typescript": "^5.5.0",
    "@types/express": "^4.17.21"
  }
}
```

#### Why these?

- **@privy-io/server-auth** — Best way in 2026 to link email → Privy user → embedded wallet address on the backend (after Stripe webhook).
- **ethers v6** — Mature, widely used for calling `mintCertificate()` from your server.
- **viem** (alternative to ethers) — More modern, lighter, and aligns perfectly with Privy’s frontend (which uses viem under the hood).
- **stripe** — For creating Checkout Sessions and verifying webhooks.

**RPC for Amoy (Polygon testnet):**
Use one of these reliable free/public endpoints in your `.env`:

- `https://rpc-amoy.polygon.technology/` (official)
- Or better: Alchemy / QuickNode / Chainstack Amoy endpoint (recommended for reliability)

**USDC on Amoy testnet:**
Use: `0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582` (testnet USDC — get test tokens from faucets).

### 2. Frontend (React)

```bash
npm install @privy-io/react-auth
npm install @stripe/stripe-js @stripe/react-stripe-js
npm install viem   # Strongly recommended (matches Privy)
```

In your `PrivyProvider`:

```tsx
import { polygonAmoy } from 'viem/chains';   // ← Important for Amoy

<PrivyProvider
  appId="your-privy-app-id-here"
  config={{
    loginMethods: ['email', 'google'],
    embeddedWallets: {
      ethereum: {
        createOnLogin: 'all-users',   // This auto-creates the wallet invisibly
      },
    },
    supportedChains: [polygonAmoy],
    defaultChain: polygonAmoy,
  }}
>
```

### 3. Smart Contract Development & Deployment

Use **Hardhat** (still the most popular in 2026 for EVM).

Additional Hardhat packages (optional but useful):

```bash
npm install --save-dev hardhat-gas-reporter @nomicfoundation/hardhat-verify
```

**Hardhat config** (`hardhat.config.ts`):

```ts
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  networks: {
    amoy: {
      url: process.env.AMOY_RPC_URL || "https://rpc-amoy.polygon.technology/",
      accounts: [process.env.PRIVATE_KEY!],   // Your deployer/admin wallet
      chainId: 80002,
    },
  },
  etherscan: {
    apiKey: {
      polygonAmoy: process.env.POLYGONSCAN_API_KEY || "",
    },
  },
};

export default config;
```

### 4. Environment Variables (`.env`)

```env
# Privy
PRIVY_APP_ID=your-privy-app-id
PRIVY_APP_SECRET=your-privy-server-secret   # Needed for @privy-io/server-auth

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Blockchain
AMOY_RPC_URL=https://rpc-amoy.polygon.technology/
PRIVATE_KEY=0xYourAdminPrivateKeyForMinting   # Secure this!

# Contract (after deployment)
CONTRACT_ADDRESS=0x...

# Others
PORT=4000
```

### Quick Start Recommendations

1. **First**: Set up Privy dashboard → enable embedded wallets for Ethereum + Polygon Amoy.
2. **Second**: Create Hardhat project → copy the `RoyaltyCertificate` contract I gave you earlier → deploy to Amoy.
3. **Third**: Build the Express backend with:
   - `/api/create-checkout` (Stripe Session + pass buyer wallet in metadata)
   - `/webhook` (verify + call `mintCertificate` using ethers + Privy server SDK to resolve email → wallet)

Would you like me to give you:

- The complete updated **Hardhat project structure** + deployment script for Amoy?
- The full **Express backend** with Privy server SDK integration for the webhook?
- Or the improved **React Buy button** component using `viem` + `polygonAmoy`?

Just tell me which part you want to build **next**, and I'll give you the full ready-to-copy code.

Here's my take on your architecture: it's **excellent** and very much in line with modern consumer Web3 onboarding (what Privy + Stripe + embedded wallets were built for). The "one-step illusion" is the killer UX — users just see "Buy Royalty Certificate for $10" → email/Google login → card payment → done. No seed phrases, no MetaMask, no "connect wallet" friction.

The moat you mentioned (proprietary legal routing for royalties + fiat collection + on-chain USDC distribution) is solid. The tech side is straightforward but requires careful handling of:

- **Privy embedded wallet** creation (automatic on login or manual).
- **Stripe Checkout** (redirect or embedded) + reliable webhook fulfillment.
- **Backend minting** from the server (using the buyer's embedded wallet address).
- **Polygon** deployment (Amoy testnet first, then mainnet).
- **USDC payouts** later (separate claim/distribute function).

**Important notes before code:**
- Privy now has strong integration with Stripe (Stripe even acquired Privy in 2025, so the ecosystem is tight).
- For true "invisible" wallets, enable **automatic embedded wallet creation on login** in your Privy dashboard (EVM chain: Polygon).
- The backend needs to securely map email → Privy user ID → wallet address.
- Minting should be done server-side with a privileged signer (or via Privy's server-side capabilities if available) to avoid exposing keys. For PoC, you can use a simple admin wallet or integrate Privy’s server SDK.
- Use OpenZeppelin for the NFT (ERC-721) to keep it secure and upgradeable if needed.
- Royalties here are revenue-share (not the standard ERC-2981 NFT royalties). You'll track shares off-chain or via a mapping, then have a separate `distributeUSDC()` function that pulls USDC from a treasury and pushes to holders.

### 1. Smart Contract Skeleton (Solidity for Polygon)

Deploy this on **Polygon Amoy testnet** first (USDC: `0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582`).

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract RoyaltyCertificate is ERC721, ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    // Mapping from tokenId to revenue share percentage (e.g., 500 = 5.00%)
    mapping(uint256 => uint256) public shares; // basis points, 10000 = 100%

    // Total shares issued (for proportional distribution)
    uint256 public totalShares;

    // USDC token on Polygon
    IERC20 public usdc; // Set in constructor

    event CertificateMinted(address indexed to, uint256 tokenId, uint256 shareBps);
    event USDCDistributed(uint256 totalDistributed);

    constructor(address _usdcAddress) 
        ERC721("BookRoyaltyCertificate", "ROYALTY") 
        Ownable(msg.sender) 
    {
        usdc = IERC20(_usdcAddress);
    }

    // Mint a new Royalty Certificate (called from backend after Stripe success)
    function mintCertificate(
        address to, 
        string memory tokenURI, 
        uint256 shareBasisPoints
    ) external onlyOwner returns (uint256) {
        require(shareBasisPoints > 0 && shareBasisPoints <= 10000, "Invalid share");

        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();

        _safeMint(to, newTokenId);
        _setTokenURI(newTokenId, tokenURI);

        shares[newTokenId] = shareBasisPoints;
        totalShares += shareBasisPoints;

        emit CertificateMinted(to, newTokenId, shareBasisPoints);
        return newTokenId;
    }

    // Distribute USDC proportionally to all holders (called periodically by owner or automation)
    function distributeUSDC(uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be > 0");
        require(usdc.balanceOf(address(this)) >= amount, "Insufficient USDC");

        uint256 tokenCount = _tokenIds.current();
        for (uint256 i = 1; i <= tokenCount; i++) {
            if (ownerOf(i) != address(0)) { // valid token
                uint256 payout = (amount * shares[i]) / totalShares;
                if (payout > 0) {
                    usdc.transfer(ownerOf(i), payout);
                }
            }
        }

        emit USDCDistributed(amount);
    }

    // Standard overrides
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
```

**Next steps for contract:**
- Add a `claim()` function if you want pull-based instead of push.
- For production, consider a treasury contract or role-based access.
- Deploy with Hardhat/Foundry. Use Polygon RPC (e.g., via Alchemy or QuickNode).
- Store metadata on IPFS (tokenURI).

### 2. React Component Skeleton (Buy Button + Flow)

Use **@privy-io/react-auth** and **@stripe/stripe-js**.

First, install:
```bash
npm install @privy-io/react-auth @stripe/stripe-js @stripe/react-stripe-js
```

**PrivyProvider setup** (in your root, e.g., `_app.tsx` or `main.tsx`):

```tsx
import { PrivyProvider } from '@privy-io/react-auth';

<PrivyProvider
  appId="your-privy-app-id"
  config={{
    loginMethods: ['email', 'google'],
    embeddedWallets: {
      solana: { createOnLogin: 'off' }, // only EVM for Polygon
      ethereum: { createOnLogin: 'all-users' }, // or 'off' and create manually
    },
    supportedChains: [polygon, polygonAmoy], // from viem/chains or wagmi
  }}
>
  {children}
</PrivyProvider>
```

**Buy Royalty Certificate Component** (`BuyCertificate.tsx`):

```tsx
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { loadStripe } from '@stripe/stripe-js';
import { useState } from 'react';

const stripePromise = loadStripe('pk_test_...'); // your Stripe publishable key

export default function BuyCertificate({ price = 10, shareBps = 100, metadataURI = 'ipfs://...' }) {
  const { login, authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  const [loading, setLoading] = useState(false);

  const handleBuy = async () => {
    setLoading(true);

    if (!authenticated) {
      // This triggers Privy modal → email/Google → auto-creates embedded wallet
      await login();
      // After login, wallet should be ready (or poll for it)
    }

    // Get the embedded wallet address
    const embeddedWallet = wallets.find(w => w.walletClientType === 'privy');
    if (!embeddedWallet) {
      alert("Wallet not ready. Try again.");
      setLoading(false);
      return;
    }

    // Create Stripe Checkout Session via your backend
    const response = await fetch('/api/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: user?.email?.address,
        amount: price * 100, // cents
        buyerWallet: embeddedWallet.address,
        shareBps,
        metadataURI,
        // Add any other metadata (book ID, etc.)
      }),
    });

    const { sessionId } = await response.json();

    // Redirect to Stripe Checkout
    const stripe = await stripePromise;
    if (stripe) {
      await stripe.redirectToCheckout({ sessionId });
    }

    setLoading(false);
  };

  return (
    <button onClick={handleBuy} disabled={loading} className="buy-btn">
      {loading ? 'Processing...' : `Buy Royalty Certificate - $${price}`}
    </button>
  );
}
```

### 3. Backend (Node.js/Express) – Webhook + Mint

Create `/api/create-checkout` and `/webhook`.

Use `stripe` and a library to interact with your contract (ethers.js or viem + Privy server if needed).

**Example webhook handler** (`/api/webhook`):

```js
import Stripe from 'stripe';
import { ethers } from 'ethers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const provider = new ethers.JsonRpcProvider('https://polygon-amoy.g.alchemy.com/v2/...');
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider); // admin signer for minting
const contract = new ethers.Contract(contractAddress, abi, signer);

app.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    const buyerEmail = session.customer_email;
    const buyerWallet = session.metadata.buyerWallet; // passed from frontend
    const shareBps = parseInt(session.metadata.shareBps);
    const tokenURI = session.metadata.metadataURI;

    // Mint on-chain
    try {
      const tx = await contract.mintCertificate(buyerWallet, tokenURI, shareBps);
      await tx.wait();
      console.log(`Minted token to ${buyerWallet}`);
      // Optionally update your DB with tokenId
    } catch (err) {
      console.error('Mint failed:', err);
      // You may want to refund or handle failure
    }
  }

  res.status(200).send('OK');
});
```

**For `create-checkout` endpoint**: Use Stripe's Checkout Sessions API, pass metadata including `buyerWallet`.

### Recommendations & Gotchas
- **Testing order**: Privy dashboard → test login + wallet creation → Stripe test mode → local webhook (use `stripe listen`) → Polygon Amoy deployment.
- **Security**: Never expose private keys client-side. Mint from backend only.
- **User experience**: After payment success, redirect to a "success" page that shows their certificate (query blockchain by address).
- **Future payouts**: Build a dashboard where holders see accrued USDC and can claim, or automate periodic `distributeUSDC()`.
- **Legal moat**: The smart contract is just the on-chain part — your real value is in the off-chain royalty collection agreements and fiat routing.

This is a **solid skeleton**. I can help you expand any part:
- Full Hardhat deployment script
- More complete backend with DB (Prisma/Mongo for tracking purchases)
- Claim page for USDC
- Error handling / retry logic
- IPFS metadata generation

What do you want to build next? The full React page, the complete backend routes, contract deployment config, or something else? Also, are you targeting Polygon mainnet or starting on Amoy? Let me know your tech stack preferences (Next.js? Vite? Express?).

I'm ready to iterate on the code with you.