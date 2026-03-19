const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "MATIC");

  // For local/demo: deployer acts as arbiter
  const arbiter = deployer.address;

  const GigShieldEscrow = await ethers.getContractFactory("GigShieldEscrow");

  // Deploy a sample contract between two demo accounts
  const [, client, freelancer] = await ethers.getSigners();

  const contract = await GigShieldEscrow.deploy(
    client.address,
    freelancer.address,
    arbiter,
    "Website Redesign Project",
    "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi", // sample IPFS CID
    3,     // 3 milestones
    100    // 1% platform fee (100 basis points)
  );

  await contract.waitForDeployment();
  const address = await contract.getAddress();

  console.log("\n✅ GigShieldEscrow deployed to:", address);
  console.log("   Client:     ", client.address);
  console.log("   Freelancer: ", freelancer.address);
  console.log("   Arbiter:    ", arbiter);
  console.log("   Milestones: 3");
  console.log("   Platform fee: 1%");
  console.log("\nSave this address in your frontend .env.local:");
  console.log(`NEXT_PUBLIC_CONTRACT_ADDRESS=${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
