const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "MATIC");

  const arbiter = deployer.address;
  const GigShieldEscrow = await ethers.getContractFactory("GigShieldEscrow");

  const [, client, freelancer] = await ethers.getSigners();
  const contract = await GigShieldEscrow.deploy(
    client.address,
    freelancer.address,
    arbiter,
    "Website Redesign Project",
    "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
    3,
    100
  );

  await contract.waitForDeployment();
  const address = await contract.getAddress();

  console.log("\n GigShieldEscrow deployed to:", address);
  console.log("   Client:     ", client.address);
  console.log("   Freelancer: ", freelancer.address);
  console.log("   Arbiter:    ", arbiter);
  console.log("   Milestones: 3");
  console.log("   Platform fee: 1%");

  //  Auto-update .env.local (must be inside main so `address` is in scope)
  const envPath = ".env.local";
  let env = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
  env = env.replace(/NEXT_PUBLIC_CONTRACT_ADDRESS=.*/g, "").trim();
  env += `\nNEXT_PUBLIC_CONTRACT_ADDRESS=${address}`;
  fs.writeFileSync(envPath, env.trim() + "\n");
  console.log(`\n .env.local updated: NEXT_PUBLIC_CONTRACT_ADDRESS=${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
