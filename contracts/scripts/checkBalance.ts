import { ethers } from "hardhat";

async function main() {
  // This will use the account configured in hardhat.config.ts for the selected network
  const [signer] = await ethers.getSigners();
  
  if (!signer) {
    throw new Error("No accounts found. Please check your .env file and hardhat.config.ts");
  }

  const address = await signer.getAddress();
  const balance = await ethers.provider.getBalance(address);

  console.log("\n=========================================");
  console.log(`Account:  ${address}`);
  console.log(`Balance:  ${ethers.formatEther(balance)} native tokens`);
  console.log("=========================================\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
