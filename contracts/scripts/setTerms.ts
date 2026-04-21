/**
 * setTerms.ts — CLI script to define the offering terms on-chain.
 *
 * Usage (from the /contracts directory):
 *
 *   npx hardhat run scripts/setTerms.ts --network amoy -- --min-buy 5000 --total-bps 1000 --value 500000
 *
 * Arguments (all in cents / basis points):
 *   --min-buy   <cents>   Minimum purchase amount in USD cents (e.g. 5000 = $50.00)
 *   --total-bps <bps>     Total royalty % on offer in basis points (e.g. 1000 = 10.00%)
 *   --value     <cents>   Total USD value of the full offering in cents (e.g. 500000 = $5,000.00)
 *
 * Example:
 *   Offer 10% of royalties, valued at $5,000, with a minimum buy-in of $50:
 *   npx hardhat run scripts/setTerms.ts --network amoy -- --min-buy 5000 --total-bps 1000 --value 500000
 */

import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// ─── Minimal ABI ──────────────────────────────────────────────────────────────
const ABI = [
  "function setOfferingTerms(uint256 minBuyAmountUSD, uint256 totalOfferedBps, uint256 offeringValueUSD) external",
  "function getOfferingTerms() external view returns (uint256, uint256, uint256)",
];

// ─── Arg Parser (Environment Variables) ───────────────────────────────────────
function parseArgs(): { minBuy: number; totalBps: number; value: number } {
  const minBuyStr   = process.env.MIN_BUY;
  const totalBpsStr  = process.env.TOTAL_BPS;
  const valueStr     = process.env.OFFERING_VALUE;

  if (!minBuyStr || !totalBpsStr || !valueStr) {
    console.error(`
❌  Missing required environment variables.

Usage:
  MIN_BUY=5000 TOTAL_BPS=1000 OFFERING_VALUE=500000 npx hardhat run scripts/setTerms.ts --network amoy

Variables (all in cents / basis points):
  MIN_BUY        Minimum purchase in cents (e.g. 5000 = $50.00)
  TOTAL_BPS      Total royalty % offered in basis points (e.g. 1000 = 10.00%)
  OFFERING_VALUE Total USD value of the full offering (e.g. 500000 = $5,000.00)
`);
    process.exit(1);
  }

  return {
    minBuy:   parseInt(minBuyStr,   10),
    totalBps: parseInt(totalBpsStr, 10),
    value:    parseInt(valueStr,    10),
  };
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const { minBuy, totalBps, value } = parseArgs();

  // Validate locally before hitting the network
  if (isNaN(minBuy) || minBuy <= 0)           throw new Error("--min-buy must be a positive integer (cents)");
  if (isNaN(totalBps) || totalBps <= 0 || totalBps > 10000) throw new Error("--total-bps must be between 1 and 10000");
  if (isNaN(value) || value <= 0)             throw new Error("--value must be a positive integer (cents)");
  if (minBuy > value)                          throw new Error("--min-buy cannot exceed --value");

  const contractAddress = process.env.CONTRACT_ADDRESS;
  if (!contractAddress) throw new Error("CONTRACT_ADDRESS not set in .env");

  const [signer] = await ethers.getSigners();
  console.log(`\n🔑  Signer: ${signer.address}`);
  console.log(`📄  Contract: ${contractAddress}\n`);

  // Print intended terms
  console.log("─────────────────────────────────────────────");
  console.log("  Offering Terms to Set");
  console.log("─────────────────────────────────────────────");
  console.log(`  Min Buy Amount : $${(minBuy / 100).toFixed(2)} (${minBuy} cents)`);
  console.log(`  Total Offered  : ${(totalBps / 100).toFixed(2)}% (${totalBps} bps)`);
  console.log(`  Offering Value : $${(value / 100).toFixed(2)} (${value} cents)`);
  console.log(`  Implied rate   : ${((totalBps / 100) / (value / 100) * 100).toFixed(4)}% per $1`);
  console.log("─────────────────────────────────────────────\n");

  const contract = new ethers.Contract(contractAddress, ABI, signer);

  console.log("📡  Sending transaction...");
  const tx = await contract.setOfferingTerms(minBuy, totalBps, value);
  console.log(`⏳  Tx submitted: ${tx.hash}`);
  await tx.wait();

  console.log(`\n✅  Offering terms set successfully!`);
  console.log(`🔗  https://amoy.polygonscan.com/tx/${tx.hash}\n`);

  // Verify by reading back
  const [onChainMin, onChainBps, onChainValue]: [bigint, bigint, bigint] =
    await contract.getOfferingTerms();

  console.log("─────────────────────────────────────────────");
  console.log("  On-Chain Confirmation");
  console.log("─────────────────────────────────────────────");
  console.log(`  Min Buy Amount : $${(Number(onChainMin) / 100).toFixed(2)}`);
  console.log(`  Total Offered  : ${(Number(onChainBps) / 100).toFixed(2)}%`);
  console.log(`  Offering Value : $${(Number(onChainValue) / 100).toFixed(2)}`);
  console.log("─────────────────────────────────────────────\n");
}

main().catch((err) => {
  console.error("❌ Error:", err.message || err);
  process.exitCode = 1;
});
