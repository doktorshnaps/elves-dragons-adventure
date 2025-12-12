# OMNI Integration Guide

Руководство по интеграции NEAR кошельков через @hot-labs/near-connect.

## Содержание

1. [Подключение кошелька](#1-подключение-кошелька)
2. [Перевод токенов](#2-перевод-токенов)
3. [Минт NFT](#3-минт-nft)
4. [Отправка NFT по клику](#4-отправка-nft-по-клику)
5. [Backend отправка NFT](#5-backend-отправка-nft)

---

## 1. Подключение кошелька

### Инициализация коннектора (src/lib/web3.ts)

```typescript
import { NearConnector } from "@hot-labs/near-connect";
import { makeAutoObservable, runInAction } from "mobx";

export interface NearAccount {
  accountId: string;
  publicKey?: string;
}

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
        network: "mainnet", // или "testnet"
      });

      // Обработка событий авторизации
      this.connector.on("wallet:signIn", async (event) => {
        runInAction(() => {
          this.isConnected = true;
          this.isConnecting = false;
          this.accounts = event.accounts as NearAccount[];
          this.accountId = event.accounts[0]?.accountId ?? null;
        });
      });

      this.connector.on("wallet:signOut", async () => {
        runInAction(() => {
          this.isConnected = false;
          this.accountId = null;
          this.accounts = [];
        });
      });

      // Проверяем существующее подключение
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
    } catch (e) {
      runInAction(() => {
        this.error = e instanceof Error ? e.message : "Failed to init";
      });
    }
  }

  async connect() {
    if (!this.connector) await this.init();
    
    try {
      runInAction(() => {
        this.isConnecting = true;
        this.error = null;
      });

      const walletId = await this.connector?.selectWallet();
      if (walletId) {
        await this.connector?.connect(walletId);
      }
    } catch (e) {
      runInAction(() => {
        this.isConnecting = false;
        this.error = e instanceof Error ? e.message : "Failed to connect";
      });
    }
  }

  async disconnect() {
    const wallet = await this.connector?.wallet();
    if (wallet) {
      await wallet.signOut();
    }
    runInAction(() => {
      this.isConnected = false;
      this.accountId = null;
      this.accounts = [];
    });
  }

  getConnector() {
    return this.connector;
  }
}

export const walletStore = new WalletStore();
```

### Компонент WalletButton (src/components/WalletButton.tsx)

```tsx
import { observer } from "mobx-react-lite";
import { useEffect } from "react";
import { walletStore } from "@/lib/web3";
import { Button } from "@/components/ui/button";
import { Wallet, LogOut, Loader2 } from "lucide-react";

export const WalletButton = observer(function WalletButton() {
  useEffect(() => {
    walletStore.init();
  }, []);

  const handleClick = () => {
    if (walletStore.isConnected) {
      walletStore.disconnect();
    } else {
      walletStore.connect();
    }
  };

  const formatAddress = (address: string): string => {
    if (address.length <= 16) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (walletStore.isConnecting) {
    return (
      <Button disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Подключение...
      </Button>
    );
  }

  if (walletStore.isConnected && walletStore.accountId) {
    return (
      <Button onClick={handleClick}>
        <LogOut className="mr-2 h-4 w-4" />
        {formatAddress(walletStore.accountId)}
      </Button>
    );
  }

  return (
    <Button onClick={handleClick}>
      <Wallet className="mr-2 h-4 w-4" />
      Подключить кошелёк
    </Button>
  );
});
```

### Использование

```tsx
import { WalletButton } from "@/components/WalletButton";

function Header() {
  return (
    <header>
      <WalletButton />
    </header>
  );
}
```

---

## 2. Перевод токенов

### Использование requestToken + wallet.intents.transfer

```typescript
import { walletStore } from "@/lib/web3";

interface TransferParams {
  receiverId: string;      // Получатель
  amount: string;          // Сумма в yoctoNEAR (1 NEAR = 10^24 yoctoNEAR)
  tokenId?: string;        // ID токена (для FT), undefined для NEAR
}

async function transferTokens({ receiverId, amount, tokenId }: TransferParams) {
  const connector = walletStore.getConnector();
  if (!connector) {
    throw new Error("Connector not initialized");
  }

  const wallet = await connector.wallet();
  if (!wallet) {
    throw new Error("No wallet connected");
  }

  try {
    // Для нативного NEAR
    if (!tokenId) {
      const result = await wallet.intents.transfer({
        receiver_id: receiverId,
        amount: amount,
      });
      
      console.log("Transfer result:", result);
      return result;
    }

    // Для FT токенов (через ft_transfer)
    const result = await wallet.intents.transfer({
      receiver_id: receiverId,
      amount: amount,
      token_id: tokenId, // например "wrap.near" для wNEAR
    });

    return result;
  } catch (error) {
    console.error("Transfer failed:", error);
    throw error;
  }
}

// Примеры использования:

// Перевод 1 NEAR
await transferTokens({
  receiverId: "recipient.near",
  amount: "1000000000000000000000000", // 1 NEAR
});

// Перевод 100 FT токенов
await transferTokens({
  receiverId: "recipient.near",
  amount: "100000000", // зависит от decimals токена
  tokenId: "token.near",
});
```

### React Hook для переводов

```typescript
// src/hooks/useTokenTransfer.ts
import { useState, useCallback } from "react";
import { walletStore } from "@/lib/web3";
import { toast } from "sonner";

export function useTokenTransfer() {
  const [isTransferring, setIsTransferring] = useState(false);

  const transfer = useCallback(async (
    receiverId: string,
    amount: string,
    tokenId?: string
  ) => {
    if (!walletStore.isConnected) {
      toast.error("Кошелёк не подключён");
      return null;
    }

    setIsTransferring(true);

    try {
      const connector = walletStore.getConnector();
      const wallet = await connector?.wallet();
      
      if (!wallet) throw new Error("No wallet");

      const result = await wallet.intents.transfer({
        receiver_id: receiverId,
        amount: amount,
        ...(tokenId && { token_id: tokenId }),
      });

      toast.success("Перевод выполнен!");
      return result;
    } catch (error) {
      toast.error("Ошибка перевода");
      console.error(error);
      return null;
    } finally {
      setIsTransferring(false);
    }
  }, []);

  return { transfer, isTransferring };
}
```

---

## 3. Минт NFT

### Использование requestToken + wallet.intents.authCall

```typescript
import { walletStore } from "@/lib/web3";

interface MintNFTParams {
  contractId: string;         // NFT контракт
  tokenId: string;            // Уникальный ID токена
  receiverId: string;         // Получатель NFT
  metadata: {
    title: string;
    description?: string;
    media?: string;           // IPFS/HTTP URL изображения
    media_hash?: string;
    copies?: number;
    extra?: string;           // Дополнительные данные (JSON)
  };
  deposit?: string;           // Депозит для storage (обычно 0.1 NEAR)
}

async function mintNFT({
  contractId,
  tokenId,
  receiverId,
  metadata,
  deposit = "100000000000000000000000", // 0.1 NEAR
}: MintNFTParams) {
  const connector = walletStore.getConnector();
  if (!connector) throw new Error("Connector not initialized");

  const wallet = await connector.wallet();
  if (!wallet) throw new Error("No wallet connected");

  try {
    // Используем authCall для вызова контракта с авторизацией
    const result = await wallet.intents.authCall({
      contract_id: contractId,
      method_name: "nft_mint",
      args: {
        token_id: tokenId,
        receiver_id: receiverId,
        token_metadata: metadata,
      },
      deposit: deposit,
      gas: "300000000000000", // 300 TGas
    });

    console.log("Mint result:", result);
    return result;
  } catch (error) {
    console.error("Mint failed:", error);
    throw error;
  }
}

// Пример использования:
await mintNFT({
  contractId: "nft.example.near",
  tokenId: `token-${Date.now()}`,
  receiverId: walletStore.accountId!,
  metadata: {
    title: "My NFT",
    description: "Awesome NFT",
    media: "https://ipfs.io/ipfs/QmXxx...",
  },
});
```

### React Hook для минта

```typescript
// src/hooks/useNFTMint.ts
import { useState, useCallback } from "react";
import { walletStore } from "@/lib/web3";
import { toast } from "sonner";

interface NFTMetadata {
  title: string;
  description?: string;
  media?: string;
  extra?: string;
}

export function useNFTMint(contractId: string) {
  const [isMinting, setIsMinting] = useState(false);

  const mint = useCallback(async (
    tokenId: string,
    metadata: NFTMetadata,
    receiverId?: string
  ) => {
    if (!walletStore.isConnected || !walletStore.accountId) {
      toast.error("Кошелёк не подключён");
      return null;
    }

    setIsMinting(true);

    try {
      const connector = walletStore.getConnector();
      const wallet = await connector?.wallet();
      
      if (!wallet) throw new Error("No wallet");

      const result = await wallet.intents.authCall({
        contract_id: contractId,
        method_name: "nft_mint",
        args: {
          token_id: tokenId,
          receiver_id: receiverId || walletStore.accountId,
          token_metadata: metadata,
        },
        deposit: "100000000000000000000000", // 0.1 NEAR
        gas: "300000000000000",
      });

      toast.success("NFT создан!");
      return result;
    } catch (error) {
      toast.error("Ошибка минта NFT");
      console.error(error);
      return null;
    } finally {
      setIsMinting(false);
    }
  }, [contractId]);

  return { mint, isMinting };
}
```

---

## 4. Отправка NFT по клику

### Компонент отправки NFT

```tsx
// src/components/NFTTransferButton.tsx
import { useState } from "react";
import { observer } from "mobx-react-lite";
import { walletStore } from "@/lib/web3";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface NFTTransferButtonProps {
  contractId: string;
  tokenId: string;
  onSuccess?: () => void;
}

export const NFTTransferButton = observer(function NFTTransferButton({
  contractId,
  tokenId,
  onSuccess,
}: NFTTransferButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [receiverId, setReceiverId] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);

  const handleTransfer = async () => {
    if (!receiverId.trim()) {
      toast.error("Введите адрес получателя");
      return;
    }

    if (!walletStore.isConnected) {
      toast.error("Кошелёк не подключён");
      return;
    }

    setIsTransferring(true);

    try {
      const connector = walletStore.getConnector();
      const wallet = await connector?.wallet();

      if (!wallet) throw new Error("No wallet");

      // nft_transfer для отправки NFT
      const result = await wallet.intents.authCall({
        contract_id: contractId,
        method_name: "nft_transfer",
        args: {
          receiver_id: receiverId.trim(),
          token_id: tokenId,
          approval_id: null,
          memo: null,
        },
        deposit: "1", // 1 yoctoNEAR для transfer
        gas: "100000000000000", // 100 TGas
      });

      console.log("NFT Transfer result:", result);
      toast.success(`NFT отправлен на ${receiverId}`);
      setIsOpen(false);
      setReceiverId("");
      onSuccess?.();
    } catch (error) {
      console.error("NFT Transfer failed:", error);
      toast.error("Ошибка отправки NFT");
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Send className="mr-2 h-4 w-4" />
          Отправить
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Отправить NFT</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground">
              Token ID: {tokenId}
            </label>
          </div>
          <Input
            placeholder="recipient.near"
            value={receiverId}
            onChange={(e) => setReceiverId(e.target.value)}
            disabled={isTransferring}
          />
          <Button 
            onClick={handleTransfer} 
            disabled={isTransferring || !receiverId.trim()}
            className="w-full"
          >
            {isTransferring ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Отправка...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Отправить NFT
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
});

// Использование:
// <NFTTransferButton 
//   contractId="nft.example.near" 
//   tokenId="token-123" 
//   onSuccess={() => refetchNFTs()} 
// />
```

### Hook для отправки NFT

```typescript
// src/hooks/useNFTTransfer.ts
import { useState, useCallback } from "react";
import { walletStore } from "@/lib/web3";
import { toast } from "sonner";

export function useNFTTransfer() {
  const [isTransferring, setIsTransferring] = useState(false);

  const transferNFT = useCallback(async (
    contractId: string,
    tokenId: string,
    receiverId: string
  ) => {
    if (!walletStore.isConnected) {
      toast.error("Кошелёк не подключён");
      return null;
    }

    setIsTransferring(true);

    try {
      const connector = walletStore.getConnector();
      const wallet = await connector?.wallet();

      if (!wallet) throw new Error("No wallet");

      const result = await wallet.intents.authCall({
        contract_id: contractId,
        method_name: "nft_transfer",
        args: {
          receiver_id: receiverId,
          token_id: tokenId,
          approval_id: null,
          memo: null,
        },
        deposit: "1",
        gas: "100000000000000",
      });

      toast.success("NFT отправлен!");
      return result;
    } catch (error) {
      toast.error("Ошибка отправки NFT");
      console.error(error);
      return null;
    } finally {
      setIsTransferring(false);
    }
  }, []);

  return { transferNFT, isTransferring };
}
```

---

## 5. Backend отправка NFT (с seed/nonce)

### Supabase Edge Function для серверной отправки

```typescript
// supabase/functions/send-nft/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { connect, keyStores, KeyPair, transactions, utils } from "npm:near-api-js@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendNFTRequest {
  contractId: string;
  tokenId: string;
  receiverId: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { contractId, tokenId, receiverId }: SendNFTRequest = await req.json();

    // Получаем приватный ключ из секретов
    const privateKey = Deno.env.get("NEAR_PRIVATE_KEY");
    const accountId = Deno.env.get("NEAR_ACCOUNT_ID");

    if (!privateKey || !accountId) {
      throw new Error("Missing NEAR credentials");
    }

    // Настраиваем подключение
    const keyStore = new keyStores.InMemoryKeyStore();
    const keyPair = KeyPair.fromString(privateKey);
    await keyStore.setKey("mainnet", accountId, keyPair);

    const nearConfig = {
      networkId: "mainnet",
      keyStore,
      nodeUrl: "https://rpc.mainnet.near.org",
      walletUrl: "https://wallet.near.org",
      helperUrl: "https://helper.mainnet.near.org",
    };

    const near = await connect(nearConfig);
    const account = await near.account(accountId);

    // Формируем и отправляем транзакцию
    const result = await account.functionCall({
      contractId: contractId,
      methodName: "nft_transfer",
      args: {
        receiver_id: receiverId,
        token_id: tokenId,
        approval_id: null,
        memo: `Server transfer at ${Date.now()}`,
      },
      gas: BigInt("100000000000000"), // 100 TGas
      attachedDeposit: BigInt("1"), // 1 yoctoNEAR
    });

    console.log("NFT Transfer result:", result);

    return new Response(
      JSON.stringify({
        success: true,
        transactionHash: result.transaction.hash,
        tokenId,
        receiverId,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Send NFT error:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
```

### Использование с seed phrase

```typescript
// Альтернативный вариант с seed phrase
import { parseSeedPhrase } from "npm:near-seed-phrase@0.2.0";

// В Edge Function:
const seedPhrase = Deno.env.get("NEAR_SEED_PHRASE");
const { secretKey } = parseSeedPhrase(seedPhrase);
const keyPair = KeyPair.fromString(secretKey);
```

### Клиентский вызов Edge Function

```typescript
// src/services/nftService.ts
import { supabase } from "@/integrations/supabase/client";

interface ServerNFTTransferParams {
  contractId: string;
  tokenId: string;
  receiverId: string;
}

export async function serverSendNFT({
  contractId,
  tokenId,
  receiverId,
}: ServerNFTTransferParams) {
  const { data, error } = await supabase.functions.invoke("send-nft", {
    body: {
      contractId,
      tokenId,
      receiverId,
    },
  });

  if (error) {
    console.error("Server NFT transfer error:", error);
    throw error;
  }

  return data;
}

// Использование:
const result = await serverSendNFT({
  contractId: "nft.example.near",
  tokenId: "token-123",
  receiverId: "winner.near",
});

console.log("Transaction:", result.transactionHash);
```

### Безопасность Backend отправки

```typescript
// Добавьте проверки в Edge Function:

// 1. Проверка авторизации
const authHeader = req.headers.get("Authorization");
if (!authHeader) {
  return new Response(JSON.stringify({ error: "Unauthorized" }), { 
    status: 401, 
    headers: corsHeaders 
  });
}

// 2. Rate limiting (через таблицу в Supabase)
const { data: rateLimit } = await supabase
  .from("nft_transfer_limits")
  .select("*")
  .eq("wallet_address", receiverId)
  .gte("created_at", new Date(Date.now() - 3600000).toISOString());

if (rateLimit && rateLimit.length >= 5) {
  return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
    status: 429,
    headers: corsHeaders,
  });
}

// 3. Проверка владения NFT перед отправкой
const nftOwner = await viewNFTOwner(contractId, tokenId);
if (nftOwner !== accountId) {
  return new Response(JSON.stringify({ error: "Not NFT owner" }), {
    status: 403,
    headers: corsHeaders,
  });
}
```

---

## Необходимые секреты

Добавьте через Supabase Dashboard → Settings → Edge Functions → Secrets:

| Секрет | Описание |
|--------|----------|
| `NEAR_PRIVATE_KEY` | Приватный ключ в формате `ed25519:xxx...` |
| `NEAR_ACCOUNT_ID` | ID аккаунта (`server.near`) |
| `NEAR_SEED_PHRASE` | (опционально) Seed phrase из 12 слов |

---

## Зависимости

```json
{
  "@hot-labs/near-connect": "^0.4.2",
  "mobx": "^6.15.0",
  "mobx-react-lite": "^4.1.1",
  "near-api-js": "^6.3.0"
}
```

---

## Troubleshooting

### Ошибка "Connector not initialized"
Убедитесь, что `walletStore.init()` вызывается при загрузке приложения.

### Ошибка "No wallet connected"
Пользователь должен подключить кошелёк перед выполнением транзакций.

### Ошибка usb/native modules
Не используйте `@hot-labs/kit` напрямую - он требует нативных модулей. 
Используйте `@hot-labs/near-connect` для web-приложений.

### Gas exceeded
Увеличьте лимит газа для сложных операций (максимум 300 TGas).
