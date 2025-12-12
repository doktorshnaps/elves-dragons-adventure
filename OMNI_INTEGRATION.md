# OMNI Integration Guide

## Overview

This project integrates `@hot-labs/kit` for multi-chain wallet connectivity via OMNI.
OMNI provides seamless wallet connection across multiple blockchains with NEAR Intents support.

## Supported Chains

- **NEAR** - Native NEAR Protocol support
- **EVM** - Ethereum, BSC, Polygon, Arbitrum, etc.
- **Solana** - Phantom, Solflare wallets
- **TON** - Telegram Open Network
- **Stellar** - Stellar Network
- **Cosmos** - Cosmos Hub and IBC chains

## Installation

The package is already installed. If you need to reinstall:

```bash
npm install @hot-labs/kit
```

## Quick Start

### 1. Initialize the Connector

```typescript
import { initOmniConnector } from '@/lib/web3';

// Initialize with default settings (NEAR + EVM)
await initOmniConnector();

// Or with custom configuration
await initOmniConnector({
  enabledChains: ['near', 'evm', 'solana'],
  walletConnect: {
    projectId: 'your-project-id',
    metadata: {
      name: 'Your App',
      description: 'App description',
      url: window.location.origin,
      icons: ['/favicon.ico'],
    },
  },
});
```

### 2. Connect Wallet

```typescript
import { connectOmniWallet, onWalletConnect } from '@/lib/web3';

// Subscribe to connection events
onWalletConnect((wallet) => {
  console.log('Connected:', wallet.address);
});

// Connect to specific chain
await connectOmniWallet('near');
// or
await connectOmniWallet('evm');
```

### 3. Use the WalletButton Component

```tsx
import { WalletButton } from '@/components/WalletButton';

function MyComponent() {
  return <WalletButton variant="outline" size="default" />;
}
```

## API Reference

### Core Functions

| Function | Description |
|----------|-------------|
| `initOmniConnector(config?)` | Initialize the OMNI connector |
| `getOmniConnector()` | Get the singleton connector instance |
| `connectOmniWallet(chain?)` | Connect wallet for specified chain |
| `getConnectedWallets()` | Get array of connected wallets |
| `getPrimaryWallet()` | Get prioritized primary wallet |
| `getNearWallet()` | Get connected NEAR wallet |
| `disconnectWallet(wallet)` | Disconnect specific wallet |
| `onWalletConnect(callback)` | Subscribe to connect events |
| `onWalletDisconnect(callback)` | Subscribe to disconnect events |

### OmniWallet Properties

```typescript
interface OmniWallet {
  address: string;           // Wallet address
  publicKey?: string;        // Public key (if available)
  omniAddress: string;       // Unified OMNI address
  type: WalletType;          // Chain type
  
  // Methods
  disconnect(): Promise<void>;
  transfer(args): Promise<string>;
  fetchBalance(chain, address): Promise<bigint>;
  fetchBalances(chain?): Promise<Record<string, bigint>>;
}
```

## Examples

See the `/src/examples/` directory for complete working examples:

1. **OmniBasicUsage.tsx** - Basic wallet connection
2. **OmniWithContext.tsx** - React context integration
3. **OmniBalances.tsx** - Fetching token balances
4. **OmniTransfer.tsx** - Token transfers

## Integration with Existing WalletConnectContext

The current game uses `WalletConnectContext` with `@near-wallet-selector`. To integrate OMNI:

### Option A: Replace completely
Replace `WalletConnectProvider` with OMNI-based provider.

### Option B: Parallel usage
Keep existing NEAR wallet-selector for game, add OMNI for cross-chain features.

### Option C: Gradual migration
1. Initialize OMNI alongside existing wallet-selector
2. Use OMNI for new features (cross-chain swaps, bridges)
3. Migrate game authentication to OMNI when ready

## Vite Configuration

Ensure your `vite.config.ts` includes node polyfills:

```typescript
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  plugins: [
    nodePolyfills(),
    // ... other plugins
  ],
});
```

## Security Considerations

1. **Never expose private keys** - All signing happens in user wallets
2. **Validate addresses** - Always validate recipient addresses before transfers
3. **Check balances** - Verify sufficient balance before operations
4. **Handle errors** - Wrap all wallet operations in try-catch

## Troubleshooting

### "Connector not initialized"
Call `initOmniConnector()` before using other functions.

### Wallet not connecting
- Check browser console for errors
- Ensure wallet extension is installed
- Verify network configuration

### Balance showing 0
- Check if wallet is on correct network
- Token might not be in whitelist
- Call `fetchBalances()` to refresh

## Resources

- [HOT Labs Documentation](https://hot.tg)
- [NEAR Wallet Selector](https://github.com/near/wallet-selector)
- [WalletConnect](https://walletconnect.com)
