// src/utils/selector.ts
import { setupWalletSelector } from "@near-wallet-selector/core";
import { setupHotWallet } from "@near-wallet-selector/hot-wallet";

interface InitSelectorParams {
  miniApp?: boolean;
  telegramInitData?: string;
}

export async function initSelector({ 
  miniApp = false, 
  telegramInitData = "" 
}: InitSelectorParams) {
  return await setupWalletSelector({
    network: "mainnet",
    modules: [
      setupHotWallet({
        miniApp,
        telegramInitData,
      } as any),
    ],
  });
}
