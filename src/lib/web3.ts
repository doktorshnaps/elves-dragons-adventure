/**
 * OMNI Web3 Integration
 * 
 * Multi-chain connector using @hot-labs/kit for NEAR Intents support.
 * Supports: NEAR, EVM, Solana, TON, Stellar, Cosmos
 */

import { HotConnector, OmniWallet } from "@hot-labs/kit";
import near from "@hot-labs/kit/near";
import evm from "@hot-labs/kit/evm";

// Singleton instance
let connectorInstance: HotConnector | null = null;

export interface OmniConnectorConfig {
  apiKey?: string;
  walletConnect?: {
    projectId?: string;
    metadata?: {
      name: string;
      description: string;
      url: string;
      icons: string[];
    };
  };
  // Which chains to enable
  enabledChains?: ('near' | 'evm' | 'solana' | 'ton' | 'stellar' | 'cosmos')[];
}

/**
 * Initialize OMNI connector with specified chains
 * Uses singleton pattern to prevent multiple instances
 */
export async function initOmniConnector(config?: OmniConnectorConfig): Promise<HotConnector> {
  if (connectorInstance) {
    return connectorInstance;
  }

  const enabledChains = config?.enabledChains || ['near', 'evm'];
  const connectors: ((wibe3: HotConnector) => Promise<any>)[] = [];

  // Dynamically import only needed chains
  for (const chain of enabledChains) {
    switch (chain) {
      case 'near':
        connectors.push(near());
        break;
      case 'evm':
        connectors.push(evm());
        break;
      case 'solana':
        const solana = (await import("@hot-labs/kit/solana")).default;
        connectors.push(solana());
        break;
      case 'ton':
        const ton = (await import("@hot-labs/kit/ton")).default;
        connectors.push(ton());
        break;
      case 'stellar':
        const stellar = (await import("@hot-labs/kit/stellar")).default;
        connectors.push(stellar());
        break;
      case 'cosmos':
        const cosmos = (await import("@hot-labs/kit/cosmos")).default;
        connectors.push(cosmos());
        break;
    }
  }

  connectorInstance = new HotConnector({
    apiKey: config?.apiKey || '',
    connectors,
    walletConnect: config?.walletConnect || {
      projectId: "1292473190ce7eb75c9de67e15aaad99",
      metadata: {
        name: "Elleonor AI",
        description: "Fantasy RPG Game with NEAR blockchain",
        url: window.location.origin,
        icons: ["/favicon.ico"],
      },
    },
  });

  return connectorInstance;
}

/**
 * Get existing connector instance
 */
export function getOmniConnector(): HotConnector | null {
  return connectorInstance;
}

/**
 * Reset connector (for testing or re-initialization)
 */
export function resetOmniConnector(): void {
  connectorInstance = null;
}

/**
 * Connect wallet via OMNI
 */
export async function connectOmniWallet(type?: 'near' | 'evm' | 'solana' | 'ton' | 'stellar' | 'cosmos'): Promise<void> {
  const connector = getOmniConnector();
  if (!connector) {
    throw new Error('OMNI connector not initialized. Call initOmniConnector first.');
  }
  
  await connector.connect(type as any);
}

/**
 * Get connected NEAR wallet
 */
export function getNearWallet(): OmniWallet | null {
  const connector = getOmniConnector();
  return connector?.near || null;
}

/**
 * Get all connected wallets
 */
export function getConnectedWallets(): OmniWallet[] {
  const connector = getOmniConnector();
  return connector?.wallets || [];
}

/**
 * Get primary wallet (prioritized)
 */
export function getPrimaryWallet(): OmniWallet | undefined {
  const connector = getOmniConnector();
  return connector?.priorityWallet;
}

/**
 * Disconnect specific wallet
 */
export async function disconnectWallet(wallet: OmniWallet): Promise<void> {
  await wallet.disconnect();
}

/**
 * Subscribe to wallet connection events
 */
export function onWalletConnect(callback: (wallet: OmniWallet) => void): () => void {
  const connector = getOmniConnector();
  if (!connector) {
    console.warn('OMNI connector not initialized');
    return () => {};
  }
  
  return connector.onConnect(({ wallet }) => callback(wallet));
}

/**
 * Subscribe to wallet disconnection events
 */
export function onWalletDisconnect(callback: (wallet: OmniWallet) => void): () => void {
  const connector = getOmniConnector();
  if (!connector) {
    console.warn('OMNI connector not initialized');
    return () => {};
  }
  
  return connector.onDisconnect(({ wallet }) => callback(wallet));
}

// Export types
export type { OmniWallet, HotConnector };
