import { WalletModuleFactory, WalletBehaviourFactory, BrowserWallet } from "@near-wallet-selector/core";
import { HotSDK } from "@hot-dao/hot-sdk-js";

export interface HotWalletParams {
  iconUrl?: string;
}

export function setupHotWallet({
  iconUrl = "./hot-wallet-icon.png",
}: HotWalletParams = {}): WalletModuleFactory {
  return async () => {
    const hotSDK = new HotSDK();
    
    return {
      id: "hot-wallet",
      type: "injected",
      metadata: {
        name: "HOT Wallet",
        description: "HOT Wallet Integration",
        iconUrl,
        downloadUrl: "https://hot.io",
        deprecated: false,
        available: true,
      },
      init: (): WalletBehaviourFactory => {
        return async () => {
          const wallet: BrowserWallet = {
            id: "hot-wallet",
            type: "injected",
            metadata: {
              name: "HOT Wallet",
              description: "HOT Wallet Integration",
              iconUrl,
              downloadUrl: "https://hot.io",
              deprecated: false,
              available: true,
            },
            signIn: async () => {
              try {
                await hotSDK.connect();
                const accounts = await hotSDK.getAccounts();
                return accounts.map((accountId: string) => ({ accountId }));
              } catch (error) {
                throw new Error("Failed to sign in with HOT Wallet");
              }
            },
            signOut: async () => {
              await hotSDK.disconnect();
            },
            getAccounts: async () => {
              const accounts = await hotSDK.getAccounts();
              return accounts.map((accountId: string) => ({ accountId }));
            },
            // Implement other required methods as needed
            signMessage: async () => {
              throw new Error("Method not implemented.");
            },
            verifyOwner: async () => {
              throw new Error("Method not implemented.");
            },
          };
          return wallet;
        };
      },
    };
  };
}