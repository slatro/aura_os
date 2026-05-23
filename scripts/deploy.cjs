const hre = require("hardhat");

async function main() {
  console.log("Deploying AuraNetwork to Monad Testnet...");
  
  const AuraNetwork = await hre.ethers.getContractFactory("AuraNetwork");
  const contract = await AuraNetwork.deploy();

  await contract.waitForDeployment();
  const address = await contract.getAddress();

  console.log(`✅ AuraNetwork successfully deployed to: ${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
