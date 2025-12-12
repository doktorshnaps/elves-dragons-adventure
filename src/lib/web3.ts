/**
 * Web3 Connector using @hot-labs/near-connect
 * 
 * Инициализация NEAR коннектора для подключения кошельков
 */

import { NearConnector } from "@hot-labs/near-connect";
import { makeAutoObservable, runInAction } from "mobx";

// Типы для аккаунтов
export interface NearAccount {
  accountId: string;
  publicKey?: string;
}

// Store для управления состоянием кошелька
class WalletStore {
  isConnected = false;
  isConnecting = false;
  accountId: string | null = null;
  accounts: NearAccount[] = [];
  error: string | null = null;

  private connector: NearConnector | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  async init() {
    if (this.connector) return;

    try {
      this.connector = new NearConnector({
        network: "mainnet",
      });

      // Обработка событий авторизации
      this.connector.on("wallet:signIn", async (event) => {
        runInAction(() => {
          this.isConnected = true;
          this.isConnecting = false;
          this.accounts = event.accounts as NearAccount[];
          this.accountId = event.accounts[0]?.accountId ?? null;
          this.error = null;
        });
        console.log("[Web3] Wallet connected:", event.accounts[0]?.accountId);
      });

      this.connector.on("wallet:signOut", async () => {
        runInAction(() => {
          this.isConnected = false;
          this.accountId = null;
          this.accounts = [];
        });
        console.log("[Web3] Wallet disconnected");
      });

      // Проверяем, есть ли уже подключенный кошелек
      const wallet = await this.connector.wallet();
      if (wallet) {
        const accounts = await wallet.getAccounts();
        if (accounts.length > 0) {
          runInAction(() => {
            this.isConnected = true;
            this.accounts = accounts as NearAccount[];
            this.accountId = accounts[0]?.accountId ?? null;
          });
        }
      }

      console.log("[Web3] Connector initialized");
    } catch (e) {
      console.error("[Web3] Init error:", e);
      runInAction(() => {
        this.error = e instanceof Error ? e.message : "Failed to init connector";
      });
    }
  }

  async connect() {
    if (!this.connector) {
      await this.init();
    }

    try {
      runInAction(() => {
        this.isConnecting = true;
        this.error = null;
      });

      // Подключаемся через selectWallet и connect
      const walletId = await this.connector?.selectWallet();
      if (walletId) {
        await this.connector?.connect(walletId);
      }
      
      runInAction(() => {
        this.isConnecting = false;
      });
    } catch (e) {
      console.error("[Web3] Connect error:", e);
      runInAction(() => {
        this.isConnecting = false;
        this.error = e instanceof Error ? e.message : "Failed to connect";
      });
    }
  }

  async disconnect() {
    if (!this.connector) return;

    try {
      const wallet = await this.connector.wallet();
      if (wallet) {
        await wallet.signOut();
      }

      runInAction(() => {
        this.isConnected = false;
        this.accountId = null;
        this.accounts = [];
      });
    } catch (e) {
      console.error("[Web3] Disconnect error:", e);
    }
  }

  async signMessage(message: string, nonce: string, recipient: string) {
    if (!this.connector) throw new Error("Connector not initialized");

    const wallet = await this.connector.wallet();
    if (!wallet) throw new Error("No wallet connected");

    return wallet.signMessage({
      message,
      nonce: Buffer.from(nonce),
      recipient,
    });
  }

  getConnector() {
    return this.connector;
  }
}

// Singleton instance
export const walletStore = new WalletStore();

// Утилиты для получения адреса
export function getWalletAddress(): string | null {
  return walletStore.accountId;
}

export function isWalletConnected(): boolean {
  return walletStore.isConnected;
}
