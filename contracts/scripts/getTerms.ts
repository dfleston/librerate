/**
 * getTerms.ts — Read current offering terms from the deployed contract.
 *
 * Usage (from the /contracts directory):
 *   npx hardhat run scripts/getTerms.ts --network amoy
 */

import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// ─── ABI ──────────────────────────────────────────────────────────────────────
// getOfferingTerms now returns 4 values — the 4th is the OfferingState enum
// (uint8: 0 = NotStarted, 1 = Open, 2 = Closed)
const ABI = [
  "function getOfferingTerms() external view returns (uint256 minBuy, uint256 offeredBps, uint256 offerValue, uint8 state)",
  "function totalShares() external view returns (uint256)",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const STATE_LABELS: Record<number, string> = {
  0: "⚪  Not Started",
  1: "🟢  Open — minting is active",
  2: "🔴  Closed — no further minting",
};

async function main() {
  const contractAddress = process.env.CONTRACT_ADDRESS;
  if (!contractAddress) throw new Error("CONTRACT_ADDRESS not set in .env");

  const [reader] = await ethers.getSigners();

  console.log(`\n🔑  Reader:   ${reader.address}`);
  console.log(`📄  Contract: ${contractAddress}\n`);

  const contract = new ethers.Contract(contractAddress, ABI, reader);

  // ─── Read state ─────────────────────────────────────────────────────────────
  const [minBuy, offeredBps, offerValue, state]: [bigint, bigint, bigint, bigint] =
    await contract.getOfferingTerms();

  const totalShares: bigint = await contract.totalShares();

  const minBuyNum = Number(minBuy);
  const bpsNum = Number(offeredBps);
  const offerValNum = Number(offerValue);
  const totalShrNum = Number(totalShares);
  const stateNum = Number(state);

  const notSet = minBuyNum === 0 && bpsNum === 0 && offerValNum === 0;

  // ─── Output ──────────────────────────────────────────────────────────────────
  console.log("═════════════════════════════════════════════");
  console.log("  Royalty Offering — Current Terms");
  console.log("═════════════════════════════════════════════");

  if (notSet) {
    console.log("  ⚠️  No terms set yet. Run setTerms.ts first.");
    console.log(`  Offering State  : ${STATE_LABELS[stateNum] ?? stateNum}`);
  } else {
    const remaining = bpsNum - totalShrNum;
    const pctSold = bpsNum > 0 ? ((totalShrNum / bpsNum) * 100).toFixed(1) : "0.0";
    const raisedCents = bpsNum > 0
      ? Math.round((totalShrNum / bpsNum) * offerValNum)
      : 0;

    console.log(`  Offering State  : ${STATE_LABELS[stateNum] ?? stateNum}`);
    console.log("─────────────────────────────────────────────");
    console.log(`  Min Buy Amount  : $${(minBuyNum / 100).toFixed(2)} (${minBuyNum} cents)`);
    console.log(`  Total Offered   : ${(bpsNum / 100).toFixed(2)}% (${bpsNum} bps)`);
    console.log(`  Offering Value  : $${(offerValNum / 100).toFixed(2)}`);
    console.log(`  Implied Rate    : ${((bpsNum / offerValNum) * 100).toFixed(6)}% per $1`);
    console.log(`  Example ($100)  : ${((10_000 / offerValNum) * bpsNum / 100).toFixed(4)}% share`);
    console.log("─────────────────────────────────────────────");
    console.log(`  Shares Issued   : ${(totalShrNum / 100).toFixed(2)}% (${totalShrNum} bps)`);
    console.log(`  Shares Remaining: ${(remaining / 100).toFixed(2)}% (${remaining} bps)`);
    console.log(`  % Subscribed    : ${pctSold}%`);
    console.log(`  Est. Raised     : $${(raisedCents / 100).toFixed(2)}`);
  }

  console.log("═════════════════════════════════════════════\n");
}

main().catch((err) => {
  console.error("❌ Error:", err.message || err);
  process.exitCode = 1;
});