import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { type Chain } from 'viem';

export const monadTestnet = {
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: { name: 'Monad', symbol: 'MON', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://testnet-rpc.monad.xyz/'] },
  },
  blockExplorers: {
    default: { name: 'Monad Explorer', url: 'https://testnet.monadexplorer.com' },
  },
  testnet: true,
} as const satisfies Chain;

export const config = getDefaultConfig({
  appName: 'AURA_OS',
  projectId: 'YOUR_PROJECT_ID', // Replaced with a dummy project ID for test environments
  chains: [monadTestnet],
});
