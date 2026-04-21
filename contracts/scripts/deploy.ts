import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  if (!deployer) {
    throw new Error("No deployer account found. Ensure your PRIVATE_KEY is correctly set in the .env file in the root directory.");
  }
  console.log("Deploying contracts with the account:", deployer.address);

  // Amoy testnet USDC mock or real address
  // Use a mock address if just testing minting, or a known testnet ERC20.
  const usdcAddress = "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582"; 

  const RoyaltyCertificate = await ethers.getContractFactory("RoyaltyCertificate");
  const contract = await RoyaltyCertificate.deploy(usdcAddress);

  await contract.waitForDeployment();
  console.log("RoyaltyCertificate deployed to:", await contract.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
