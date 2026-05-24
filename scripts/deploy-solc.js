import fs from 'fs';
import solc from 'solc';
import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  console.log("Reading AuraNetwork.sol...");
  const contractSrc = fs.readFileSync('contracts/AuraNetwork.sol', 'utf8');
  
  var input = {
    language: 'Solidity',
    sources: {
      'AuraNetwork.sol': {
        content: contractSrc
      }
    },
    settings: {
      outputSelection: {
        '*': {
          '*': ['*']
        }
      }
    }
  };

  console.log("Compiling with solc...");
  const output = JSON.parse(solc.compile(JSON.stringify(input)));
  
  if (output.errors) {
    output.errors.forEach(err => console.error(err.formattedMessage));
    const hasErrors = output.errors.some(err => err.severity === 'error');
    if (hasErrors) process.exit(1);
  }

  const contract = output.contracts['AuraNetwork.sol']['AuraNetwork'];
  const abi = contract.abi;
  const bytecode = contract.evm.bytecode.object;

  console.log("Contract compiled successfully!");
  
  // Save ABI to src folder for frontend integration
  fs.mkdirSync('src/config', { recursive: true });
  fs.writeFileSync('src/config/AuraNetworkABI.json', JSON.stringify(abi, null, 2));
  console.log("ABI saved to src/config/AuraNetworkABI.json");

  console.log("Connecting to Monad Testnet...");
  const provider = new ethers.JsonRpcProvider('https://testnet-rpc.monad.xyz/');
  const wallet = new ethers.Wallet("0xee2341557e19f20348689a0a754ea1d12da6f26a42d823d52afcc5d5154bd948", provider);

  console.log("Deploying from address:", wallet.address);
  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  
  console.log("Sending deployment transaction...");
  const deployedContract = await factory.deploy();
  await deployedContract.waitForDeployment();

  const address = await deployedContract.getAddress();
  console.log("✅ AuraNetwork successfully deployed to:", address);
  
  // Save the contract address to an env file for the frontend
  fs.writeFileSync('.env.local', `VITE_CONTRACT_ADDRESS=${address}\n`);
}

main().catch(console.error);
