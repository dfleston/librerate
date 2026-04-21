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

const ABI = [
  "function getOfferingTerms() external view returns (uint256, uint256, uint256)",
  "function minBuyAmountUSD() external view returns (uint256)",
  "function totalOfferedBps() external view returns (uint256)",
  "function offeringValueUSD() external view returns (uint256)",
  "function totalShares() external view returns (uint256)",
];

async function main() {
  const contractAddress = process.env.CONTRACT_ADDRESS;
  if (!contractAddress) throw new Error("CONTRACT_ADDRESS not set in .env");

  const [reader] = await ethers.getSigners();

  console.log(`\n🔑  Reader:   ${reader.address}`);
  console.log(`📄  Contract: ${contractAddress}\n`);

  const contract = new ethers.Contract(contractAddress, ABI, reader);

  const [minBuy, offeredBps, offerValue]: [bigint, bigint, bigint] =
    await contract.getOfferingTerms();

  const totalShares: bigint = await contract.totalShares();

  const minBuyNum    = Number(minBuy);
  const bpsNum       = Number(offeredBps);
  const offerValNum  = Number(offerValue);
  const totalShrNum  = Number(totalShares);

  const notSet = minBuyNum === 0 && bpsNum === 0 && offerValNum === 0;

  console.log("═════════════════════════════════════════════");
  console.log("  Royalty Offering — Current Terms");
  console.log("═════════════════════════════════════════════");

  if (notSet) {
    console.log("  ⚠️  No terms set yet. Run setTerms.ts first.");
  } else {
    console.log(`  Min Buy Amount  : $${(minBuyNum / 100).toFixed(2)} (${minBuyNum} cents)`);
    console.log(`  Total Offered   : ${(bpsNum / 100).toFixed(2)}% (${bpsNum} bps)`);
    console.log(`  Offering Value  : $${(offerValNum / 100).toFixed(2)}`);
    console.log(`  Implied Rate    : ${((bpsNum / offerValNum) * 100).toFixed(6)}% per $1 invested`);
    console.log(`  Example ($100)  : ${((100_00 / offerValNum) * bpsNum / 100).toFixed(4)}% share`);
    console.log("─────────────────────────────────────────────");
    console.log(`  Total Shares Issued : ${(totalShrNum / 100).toFixed(2)}% (${totalShrNum} bps)`);
    console.log(`  Remaining Capacity  : ${((bpsNum - totalShrNum) / 100).toFixed(2)}%`);
  }

  console.log("═════════════════════════════════════════════\n");
}

main().catch((err) => {
  console.error("❌ Error:", err.message || err);
  process.exitCode = 1;
});
