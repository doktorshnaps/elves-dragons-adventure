import { configureChains, createConfig } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import { createWeb3Modal } from '@web3modal/react';

const projectId = 'YOUR_WALLETCONNECT_PROJECT_ID';

const { chains, publicClient } = configureChains(
  [mainnet],
  [publicProvider()]
);

export const config = createConfig({
  autoConnect: true,
  publicClient,
});

export const web3modal = createWeb3Modal({
  wagmiConfig: config,
  projectId,
  chains,
});