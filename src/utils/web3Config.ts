import { createConfig, http } from 'wagmi'
import { mainnet } from 'wagmi/chains'
import { createWeb3Modal } from '@web3modal/wagmi'

const projectId = 'YOUR_WALLETCONNECT_PROJECT_ID'

const metadata = {
  name: 'Web3Modal Game',
  description: 'Web3Modal Example',
  url: 'https://web3modal.com', 
  icons: ['https://avatars.githubusercontent.com/u/37784886']
}

export const config = createConfig({
  chains: [mainnet],
  transports: {
    [mainnet.id]: http()
  }
})

export const web3modal = createWeb3Modal({
  wagmiConfig: config,
  projectId,
  chains: [mainnet],
  themeMode: 'dark'
})