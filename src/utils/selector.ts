// src/utils/selector.ts
import { setupWalletSelector } from "@near-wallet-selector/core";
import { setupHereWallet } from "@near-wallet-selector/here-wallet";
import { setupHotWallet } from "@near-wallet-selector/hot-wallet";
import { setupMyNearWallet } from "@near-wallet-selector/my-near-wallet";
import { setupMeteorWallet } from "@near-wallet-selector/meteor-wallet";
import { setupNightly } from "@near-wallet-selector/nightly";

interface InitSelectorParams {
  miniApp?: boolean;
  telegramInitData?: string;
}

export async function initSelector({ 
  miniApp = false, 
  telegramInitData = "" 
}: InitSelectorParams) {
  const modules = miniApp 
    ? [
        // HERE Wallet оптимизирован для Telegram Mini Apps
        setupHereWallet(),
        setupHotWallet(),
      ]
    : [
        setupHereWallet(),
        setupHotWallet(),
        setupMyNearWallet(),
        setupMeteorWallet(),
        setupNightly(),
      ];

  return await setupWalletSelector({
    network: "mainnet",
    modules,
  });
}
