import { ethers } from "ethers";
import fs from "fs";
import path from "path";

const wallet = ethers.Wallet.createRandom();

const envPath = path.resolve(process.cwd(), '.env');
fs.writeFileSync(envPath, `PRIVATE_KEY=${wallet.privateKey}\n`);

console.log("====================================================");
console.log("🚀 NEW DEPLOYER WALLET GENERATED!");
console.log("Address:", wallet.address);
console.log("Private Key saved to .env");
console.log("====================================================");
console.log("Please send Monad Testnet (MON) to this address.");
console.log("You can use the faucet at: https://testnet.monad.xyz/");
console.log("====================================================");
