import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const ABI = [
    "function openOffering() external",
    "function offeringState() view returns (uint8)",
];

async function main() {
    const contractAddress = process.env.CONTRACT_ADDRESS;
    if (!contractAddress) throw new Error("CONTRACT_ADDRESS not set in .env");

    const [signer] = await ethers.getSigners();
    const contract = new ethers.Contract(contractAddress, ABI, signer);

    const state = await contract.offeringState();
    if (state !== 0n) {
        console.log("⚠️  Offering already opened or closed. State:", state.toString());
        return;
    }

    const tx = await contract.openOffering();
    console.log("⏳  Opening offering, tx:", tx.hash);
    await tx.wait();
    console.log("✅  Offering is now open. Minting is enabled.");
    console.log(`🔗  https://amoy.polygonscan.com/tx/${tx.hash}`);
}

main().catch((err) => {
    console.error("❌ Error:", err.message || err);
    process.exitCode = 1;
});