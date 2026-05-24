import { ethers } from "ethers";
import fs from "fs";

async function main() {
  const provider = new ethers.JsonRpcProvider("https://testnet-rpc.monad.xyz/");
  const wallet = new ethers.Wallet("0xee2341557e19f20348689a0a754ea1d12da6f26a42d823d52afcc5d5154bd948", provider);
  
  const balance = await provider.getBalance(wallet.address);
  console.log("Balance:", ethers.formatEther(balance), "MON");
  if (balance === 0n) {
    console.log("WAITING FOR FUNDS...");
    return;
  }

  const artifact = JSON.parse(fs.readFileSync("./artifacts/contracts/AuraNetwork.sol/AuraNetwork.json", "utf8"));
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
  
  console.log("Deploying contract...");
  const contract = await factory.deploy();
  await contract.waitForDeployment();
  
  console.log("Contract deployed to:", await contract.getAddress());
}

main().catch(console.error);
