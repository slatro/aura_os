import { createConfig } from '@privy-io/wagmi';
import { http } from 'wagmi';
import { monadTestnet as viemMonadTestnet } from 'viem/chains';

export const monadTestnet = viemMonadTestnet;

export const config = createConfig({
  chains: [monadTestnet],
  transports: {
    [monadTestnet.id]: http(),
  },
});
