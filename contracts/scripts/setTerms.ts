/**
 * setTerms.ts — CLI script to define the offering terms on-chain.
 *
 * Usage (from the /contracts directory):
 *   MIN_BUY=2000 TOTAL_BPS=2525 OFFERING_VALUE=700000 \
 *   npx hardhat run scripts/setTerms.ts --network amoy
 *
 * Variables (all in cents / basis points):
 *   MIN_BUY        Minimum purchase in cents       (e.g. 2000 = €20.00)
 *   TOTAL_BPS      Total royalty % in basis points  (e.g. 2525 = 25.25%)
 *   OFFERING_VALUE Total raise target in cents      (e.g. 700000 = €7,000)
 */

import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// ─── ABI ──────────────────────────────────────────────────────────────────────
const ABI = [
  "function setOfferingTerms(uint256 minBuyAmountUSD, uint256 totalOfferedBps, uint256 offeringValueUSD) external",
  "function getOfferingTerms() external view returns (uint256, uint256, uint256, uint8)",
];

// ─── State labels ─────────────────────────────────────────────────────────────
const STATE_LABELS: Record<number, string> = {
  0: "⚪  Not Started",
  1: "🟢  Open",
  2: "🔴  Closed",
};

// ─── Arg parser ───────────────────────────────────────────────────────────────
function parseArgs(): { minBuy: number; totalBps: number; value: number } {
  const minBuyStr = process.env.MIN_BUY;
  const totalBpsStr = process.env.TOTAL_BPS;
  const valueStr = process.env.OFFERING_VALUE;

  if (!minBuyStr || !totalBpsStr || !valueStr) {
    console.error(`
❌  Missing required environment variables.

Usage:
  MIN_BUY=2000 TOTAL_BPS=2525 OFFERING_VALUE=700000 \\
  npx hardhat run scripts/setTerms.ts --network amoy
`);
    process.exit(1);
  }

  return {
    minBuy: parseInt(minBuyStr, 10),
    totalBps: parseInt(totalBpsStr, 10),
    value: parseInt(valueStr, 10),
  };
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const { minBuy, totalBps, value } = parseArgs();

  if (isNaN(minBuy) || minBuy <= 0) throw new Error("MIN_BUY must be a positive integer (cents)");
  if (isNaN(totalBps) || totalBps <= 0 || totalBps > 10000) throw new Error("TOTAL_BPS must be between 1 and 10000");
  if (isNaN(value) || value <= 0) throw new Error("OFFERING_VALUE must be a positive integer (cents)");
  if (minBuy > value) throw new Error("MIN_BUY cannot exceed OFFERING_VALUE");

  const contractAddress = process.env.CONTRACT_ADDRESS;
  if (!contractAddress) throw new Error("CONTRACT_ADDRESS not set in .env");

  const [signer] = await ethers.getSigners();
  console.log(`\n🔑  Signer:   ${signer.address}`);
  console.log(`📄  Contract: ${contractAddress}\n`);

  console.log("─────────────────────────────────────────────");
  console.log("  Offering Terms to Set");
  console.log("─────────────────────────────────────────────");
  console.log(`  Min Buy Amount : $${(minBuy / 100).toFixed(2)} (${minBuy} cents)`);
  console.log(`  Total Offered  : ${(totalBps / 100).toFixed(2)}% (${totalBps} bps)`);
  console.log(`  Offering Value : $${(value / 100).toFixed(2)} (${value} cents)`);
  console.log(`  Implied rate   : ${((totalBps / value) * 100).toFixed(4)}% per $1`);
  console.log("─────────────────────────────────────────────\n");

  const contract = new ethers.Contract(contractAddress, ABI, signer);

  console.log("📡  Sending transaction...");
  const tx = await contract.setOfferingTerms(minBuy, totalBps, value);
  console.log(`⏳  Tx submitted: ${tx.hash}`);
  await tx.wait();

  console.log(`\n✅  Offering terms set successfully!`);
  console.log(`🔗  https://amoy.polygonscan.com/tx/${tx.hash}\n`);

  // ─── Read back and confirm ─────────────────────────────────────────────────
  const [onChainMin, onChainBps, onChainValue, onChainState]:
    [bigint, bigint, bigint, bigint] = await contract.getOfferingTerms();

  console.log("─────────────────────────────────────────────");
  console.log("  On-Chain Confirmation");
  console.log("─────────────────────────────────────────────");
  console.log(`  State          : ${STATE_LABELS[Number(onChainState)] ?? Number(onChainState)}`);
  console.log(`  Min Buy Amount : $${(Number(onChainMin) / 100).toFixed(2)}`);
  console.log(`  Total Offered  : ${(Number(onChainBps) / 100).toFixed(2)}%`);
  console.log(`  Offering Value : $${(Number(onChainValue) / 100).toFixed(2)}`);
  console.log("─────────────────────────────────────────────\n");
}

main().catch((err) => {
  console.error("❌ Error:", err.message || err);
  process.exitCode = 1;
});