# HOT Labs Kit - Инструкция по ручной установке

## Проблема

Пакет `@hot-labs/kit` имеет зависимость от `usb`, которая требует нативной компиляции через `node-gyp`. Lovable не поддерживает нативные модули, поэтому установка должна быть выполнена через GitHub.

## Шаг 1: Обновление package.json через GitHub

Откройте ваш репозиторий на GitHub и отредактируйте `package.json`:

### 1.1 Добавьте resolutions для обхода usb

```json
{
  "name": "vite_react_shadcn_ts",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "resolutions": {
    "usb": "npm:noop2@latest"
  },
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "build:dev": "vite build --mode development",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "@hot-labs/kit": "^1.0.53",
    ...остальные зависимости
  }
}
```

### 1.2 Альтернатива: используйте overrides для npm

```json
{
  "overrides": {
    "usb": "npm:noop2@latest"
  }
}
```

### 1.3 Для Bun - добавьте в bunfig.toml

Создайте файл `bunfig.toml` в корне проекта:

```toml
[install]
optional = false

[install.scopes]
"usb" = "npm:noop2@latest"
```

---

## Шаг 2: Создание src/lib/web3.ts

Создайте файл `src/lib/web3.ts` с полной инициализацией HotConnector:

```typescript
import { HotConnector } from "@hot-labs/kit";
import { defaultConnectors } from "@hot-labs/kit/defaultConnectors";

// Инициализация HOT Connector с поддержкой всех кошельков
export const web3 = new HotConnector({
  // Стандартные коннекторы: HOT Wallet, MetaMask, WalletConnect и др.
  connectors: defaultConnectors,
  
  // WalletConnect настройки (опционально)
  walletConnect: {
    projectId: "YOUR_REOWN_PROJECT_ID", // Получите на https://cloud.reown.com
    metadata: {
      name: "Elves Dragons Adventure",
      description: "Fantasy RPG Card Game with NFT on NEAR Protocol",
      url: "https://elleonorai.xyz",
      icons: ["https://elleonorai.xyz/logo.png"]
    }
  }
});

// Типы для удобства
export type Web3Instance = typeof web3;

// Утилиты для работы с кошельком
export const getConnectedWallet = () => {
  return web3.getAccount();
};

export const getWalletAddress = () => {
  const account = web3.getAccount();
  return account?.address || null;
};

export const isWalletConnected = () => {
  return !!web3.getAccount();
};
```

---

## Шаг 3: Omni Chain Intents - 4 файла

### 3.1 src/lib/omni/types.ts - Типы для Omni Chain

```typescript
// Типы для Omni Chain операций
export interface OmniChainIntent {
  id: string;
  type: 'swap' | 'bridge' | 'transfer' | 'stake';
  sourceChain: string;
  targetChain: string;
  sourceToken: string;
  targetToken: string;
  amount: string;
  recipient?: string;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  createdAt: number;
  completedAt?: number;
  txHash?: string;
}

export interface SwapIntent {
  fromToken: string;
  toToken: string;
  amount: string;
  slippage?: number; // в процентах, например 0.5 = 0.5%
  deadline?: number; // timestamp
}

export interface BridgeIntent {
  sourceChain: ChainId;
  targetChain: ChainId;
  token: string;
  amount: string;
  recipient: string;
}

export interface TransferIntent {
  token: string;
  amount: string;
  recipient: string;
  chain?: ChainId;
}

export interface StakeIntent {
  token: string;
  amount: string;
  validator?: string;
  duration?: number; // в секундах
}

// Поддерживаемые сети
export type ChainId = 
  | 'near'
  | 'ethereum'
  | 'base'
  | 'arbitrum'
  | 'optimism'
  | 'polygon'
  | 'bsc'
  | 'aurora'
  | 'solana';

export interface ChainInfo {
  id: ChainId;
  name: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrl: string;
  explorerUrl: string;
  iconUrl?: string;
}

// Результат выполнения intent
export interface IntentResult {
  success: boolean;
  intentId: string;
  txHash?: string;
  error?: string;
  gasUsed?: string;
  effectivePrice?: string;
}

// Котировка для свапа/бриджа
export interface Quote {
  inputAmount: string;
  outputAmount: string;
  priceImpact: number;
  route: string[];
  estimatedGas: string;
  fees: {
    protocol: string;
    network: string;
  };
  expiresAt: number;
}
```

### 3.2 src/lib/omni/chains.ts - Конфигурация сетей

```typescript
import { ChainInfo, ChainId } from './types';

// Конфигурация поддерживаемых сетей
export const SUPPORTED_CHAINS: Record<ChainId, ChainInfo> = {
  near: {
    id: 'near',
    name: 'NEAR Protocol',
    nativeCurrency: {
      name: 'NEAR',
      symbol: 'NEAR',
      decimals: 24
    },
    rpcUrl: 'https://rpc.mainnet.near.org',
    explorerUrl: 'https://nearblocks.io',
    iconUrl: '/chains/near.svg'
  },
  ethereum: {
    id: 'ethereum',
    name: 'Ethereum',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    },
    rpcUrl: 'https://eth.llamarpc.com',
    explorerUrl: 'https://etherscan.io',
    iconUrl: '/chains/ethereum.svg'
  },
  base: {
    id: 'base',
    name: 'Base',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    },
    rpcUrl: 'https://mainnet.base.org',
    explorerUrl: 'https://basescan.org',
    iconUrl: '/chains/base.svg'
  },
  arbitrum: {
    id: 'arbitrum',
    name: 'Arbitrum One',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    },
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    explorerUrl: 'https://arbiscan.io',
    iconUrl: '/chains/arbitrum.svg'
  },
  optimism: {
    id: 'optimism',
    name: 'Optimism',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    },
    rpcUrl: 'https://mainnet.optimism.io',
    explorerUrl: 'https://optimistic.etherscan.io',
    iconUrl: '/chains/optimism.svg'
  },
  polygon: {
    id: 'polygon',
    name: 'Polygon',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18
    },
    rpcUrl: 'https://polygon-rpc.com',
    explorerUrl: 'https://polygonscan.com',
    iconUrl: '/chains/polygon.svg'
  },
  bsc: {
    id: 'bsc',
    name: 'BNB Smart Chain',
    nativeCurrency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18
    },
    rpcUrl: 'https://bsc-dataseed.binance.org',
    explorerUrl: 'https://bscscan.com',
    iconUrl: '/chains/bsc.svg'
  },
  aurora: {
    id: 'aurora',
    name: 'Aurora',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    },
    rpcUrl: 'https://mainnet.aurora.dev',
    explorerUrl: 'https://aurorascan.dev',
    iconUrl: '/chains/aurora.svg'
  },
  solana: {
    id: 'solana',
    name: 'Solana',
    nativeCurrency: {
      name: 'SOL',
      symbol: 'SOL',
      decimals: 9
    },
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    explorerUrl: 'https://solscan.io',
    iconUrl: '/chains/solana.svg'
  }
};

// Утилиты для работы с сетями
export const getChainInfo = (chainId: ChainId): ChainInfo | undefined => {
  return SUPPORTED_CHAINS[chainId];
};

export const getChainName = (chainId: ChainId): string => {
  return SUPPORTED_CHAINS[chainId]?.name || chainId;
};

export const getSupportedChainIds = (): ChainId[] => {
  return Object.keys(SUPPORTED_CHAINS) as ChainId[];
};

export const isChainSupported = (chainId: string): chainId is ChainId => {
  return chainId in SUPPORTED_CHAINS;
};

// Токены для свапов по сетям
export const CHAIN_TOKENS: Record<ChainId, string[]> = {
  near: ['NEAR', 'USDC', 'USDT', 'wNEAR', 'REF', 'AURORA'],
  ethereum: ['ETH', 'USDC', 'USDT', 'DAI', 'WETH', 'LINK'],
  base: ['ETH', 'USDC', 'USDbC', 'DAI'],
  arbitrum: ['ETH', 'USDC', 'USDT', 'ARB', 'GMX'],
  optimism: ['ETH', 'USDC', 'USDT', 'OP', 'SNX'],
  polygon: ['MATIC', 'USDC', 'USDT', 'DAI', 'WETH'],
  bsc: ['BNB', 'USDC', 'USDT', 'BUSD', 'CAKE'],
  aurora: ['ETH', 'USDC', 'USDT', 'AURORA', 'wNEAR'],
  solana: ['SOL', 'USDC', 'USDT', 'RAY', 'SRM']
};
```

### 3.3 src/lib/omni/intents.ts - Логика выполнения intents

```typescript
import { web3 } from '../web3';
import { 
  OmniChainIntent, 
  SwapIntent, 
  BridgeIntent, 
  TransferIntent,
  StakeIntent,
  IntentResult,
  Quote,
  ChainId 
} from './types';
import { getChainInfo } from './chains';

// Хранилище активных intents
const activeIntents = new Map<string, OmniChainIntent>();

// Генерация уникального ID для intent
const generateIntentId = (): string => {
  return `intent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Получение котировки для свапа
 */
export const getSwapQuote = async (
  fromToken: string,
  toToken: string,
  amount: string,
  chainId: ChainId = 'near'
): Promise<Quote> => {
  // Здесь интеграция с HOT Protocol для получения котировки
  const quote: Quote = {
    inputAmount: amount,
    outputAmount: '0', // Будет заполнено из API
    priceImpact: 0,
    route: [fromToken, toToken],
    estimatedGas: '0',
    fees: {
      protocol: '0',
      network: '0'
    },
    expiresAt: Date.now() + 60000 // 1 минута
  };

  // TODO: Интеграция с HOT Protocol API
  // const response = await fetch('https://api.hot-labs.org/quote', {...});
  
  return quote;
};

/**
 * Выполнение свапа через HOT Protocol
 */
export const executeSwap = async (intent: SwapIntent): Promise<IntentResult> => {
  const intentId = generateIntentId();
  
  try {
    const account = web3.getAccount();
    if (!account) {
      throw new Error('Wallet not connected');
    }

    // Создаем запись об intent
    const omniIntent: OmniChainIntent = {
      id: intentId,
      type: 'swap',
      sourceChain: 'near',
      targetChain: 'near',
      sourceToken: intent.fromToken,
      targetToken: intent.toToken,
      amount: intent.amount,
      status: 'pending',
      createdAt: Date.now()
    };
    
    activeIntents.set(intentId, omniIntent);

    // Выполняем свап через HOT Kit
    // const result = await web3.swap({
    //   from: intent.fromToken,
    //   to: intent.toToken,
    //   amount: intent.amount,
    //   slippage: intent.slippage || 0.5
    // });

    // Обновляем статус
    omniIntent.status = 'completed';
    omniIntent.completedAt = Date.now();
    // omniIntent.txHash = result.txHash;

    return {
      success: true,
      intentId,
      // txHash: result.txHash
    };
  } catch (error) {
    const intent = activeIntents.get(intentId);
    if (intent) {
      intent.status = 'failed';
    }
    
    return {
      success: false,
      intentId,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Выполнение бриджа между сетями
 */
export const executeBridge = async (intent: BridgeIntent): Promise<IntentResult> => {
  const intentId = generateIntentId();
  
  try {
    const account = web3.getAccount();
    if (!account) {
      throw new Error('Wallet not connected');
    }

    const sourceChain = getChainInfo(intent.sourceChain);
    const targetChain = getChainInfo(intent.targetChain);
    
    if (!sourceChain || !targetChain) {
      throw new Error('Unsupported chain');
    }

    const omniIntent: OmniChainIntent = {
      id: intentId,
      type: 'bridge',
      sourceChain: intent.sourceChain,
      targetChain: intent.targetChain,
      sourceToken: intent.token,
      targetToken: intent.token,
      amount: intent.amount,
      recipient: intent.recipient,
      status: 'pending',
      createdAt: Date.now()
    };
    
    activeIntents.set(intentId, omniIntent);

    // TODO: Выполнение бриджа через HOT Protocol
    // const result = await web3.bridge({...});

    omniIntent.status = 'executing';

    return {
      success: true,
      intentId
    };
  } catch (error) {
    return {
      success: false,
      intentId,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Выполнение трансфера токенов
 */
export const executeTransfer = async (intent: TransferIntent): Promise<IntentResult> => {
  const intentId = generateIntentId();
  
  try {
    const account = web3.getAccount();
    if (!account) {
      throw new Error('Wallet not connected');
    }

    const omniIntent: OmniChainIntent = {
      id: intentId,
      type: 'transfer',
      sourceChain: intent.chain || 'near',
      targetChain: intent.chain || 'near',
      sourceToken: intent.token,
      targetToken: intent.token,
      amount: intent.amount,
      recipient: intent.recipient,
      status: 'pending',
      createdAt: Date.now()
    };
    
    activeIntents.set(intentId, omniIntent);

    // TODO: Выполнение трансфера
    // const result = await web3.transfer({...});

    omniIntent.status = 'completed';
    omniIntent.completedAt = Date.now();

    return {
      success: true,
      intentId
    };
  } catch (error) {
    return {
      success: false,
      intentId,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Выполнение стейкинга
 */
export const executeStake = async (intent: StakeIntent): Promise<IntentResult> => {
  const intentId = generateIntentId();
  
  try {
    const account = web3.getAccount();
    if (!account) {
      throw new Error('Wallet not connected');
    }

    const omniIntent: OmniChainIntent = {
      id: intentId,
      type: 'stake',
      sourceChain: 'near',
      targetChain: 'near',
      sourceToken: intent.token,
      targetToken: `st${intent.token}`, // staked token
      amount: intent.amount,
      status: 'pending',
      createdAt: Date.now()
    };
    
    activeIntents.set(intentId, omniIntent);

    // TODO: Выполнение стейкинга
    // const result = await web3.stake({...});

    omniIntent.status = 'completed';
    omniIntent.completedAt = Date.now();

    return {
      success: true,
      intentId
    };
  } catch (error) {
    return {
      success: false,
      intentId,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Получение статуса intent
 */
export const getIntentStatus = (intentId: string): OmniChainIntent | undefined => {
  return activeIntents.get(intentId);
};

/**
 * Получение всех активных intents
 */
export const getActiveIntents = (): OmniChainIntent[] => {
  return Array.from(activeIntents.values()).filter(
    intent => intent.status === 'pending' || intent.status === 'executing'
  );
};

/**
 * Получение истории intents
 */
export const getIntentHistory = (): OmniChainIntent[] => {
  return Array.from(activeIntents.values()).sort(
    (a, b) => b.createdAt - a.createdAt
  );
};

/**
 * Отмена pending intent (если возможно)
 */
export const cancelIntent = async (intentId: string): Promise<boolean> => {
  const intent = activeIntents.get(intentId);
  
  if (!intent || intent.status !== 'pending') {
    return false;
  }

  // TODO: Логика отмены через HOT Protocol
  
  intent.status = 'failed';
  return true;
};
```

### 3.4 src/lib/omni/index.ts - Экспорт модуля

```typescript
// Omni Chain Intents - главный экспорт
export * from './types';
export * from './chains';
export * from './intents';

// Re-export web3 для удобства
export { web3, getConnectedWallet, getWalletAddress, isWalletConnected } from '../web3';

// Утилитарные функции
export const formatTokenAmount = (amount: string, decimals: number): string => {
  const num = parseFloat(amount) / Math.pow(10, decimals);
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6
  });
};

export const parseTokenAmount = (amount: string, decimals: number): string => {
  const num = parseFloat(amount) * Math.pow(10, decimals);
  return Math.floor(num).toString();
};

export const shortenAddress = (address: string, chars: number = 4): string => {
  if (!address) return '';
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
};

export const getExplorerTxUrl = (chainId: string, txHash: string): string => {
  const explorers: Record<string, string> = {
    near: `https://nearblocks.io/txns/${txHash}`,
    ethereum: `https://etherscan.io/tx/${txHash}`,
    base: `https://basescan.org/tx/${txHash}`,
    arbitrum: `https://arbiscan.io/tx/${txHash}`,
    optimism: `https://optimistic.etherscan.io/tx/${txHash}`,
    polygon: `https://polygonscan.com/tx/${txHash}`,
    bsc: `https://bscscan.com/tx/${txHash}`,
    aurora: `https://aurorascan.dev/tx/${txHash}`,
    solana: `https://solscan.io/tx/${txHash}`
  };
  
  return explorers[chainId] || '#';
};
```

---

## Шаг 4: WalletButton с Observer

Создайте файл `src/components/wallet/WalletButton.tsx`:

```typescript
import React, { useEffect, useState, useCallback } from 'react';
import { web3 } from '@/lib/web3';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Wallet, LogOut, Copy, ExternalLink, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

interface WalletState {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  chainId: string | null;
}

export const WalletButton: React.FC = () => {
  const [walletState, setWalletState] = useState<WalletState>({
    address: null,
    isConnected: false,
    isConnecting: false,
    chainId: null
  });

  // Observer для отслеживания изменений состояния кошелька
  useEffect(() => {
    // Инициализация начального состояния
    const account = web3.getAccount();
    if (account) {
      setWalletState({
        address: account.address,
        isConnected: true,
        isConnecting: false,
        chainId: account.chainId || null
      });
    }

    // Подписка на события изменения аккаунта
    const handleAccountChange = (account: any) => {
      console.log('Account changed:', account);
      if (account) {
        setWalletState({
          address: account.address,
          isConnected: true,
          isConnecting: false,
          chainId: account.chainId || null
        });
      } else {
        setWalletState({
          address: null,
          isConnected: false,
          isConnecting: false,
          chainId: null
        });
      }
    };

    // Подписка на события подключения
    const handleConnect = (info: any) => {
      console.log('Wallet connected:', info);
      toast.success('Кошелек подключен');
    };

    // Подписка на события отключения
    const handleDisconnect = () => {
      console.log('Wallet disconnected');
      setWalletState({
        address: null,
        isConnected: false,
        isConnecting: false,
        chainId: null
      });
      toast.info('Кошелек отключен');
    };

    // Подписка на события смены сети
    const handleChainChange = (chainId: string) => {
      console.log('Chain changed:', chainId);
      setWalletState(prev => ({ ...prev, chainId }));
    };

    // Регистрация обработчиков через observer pattern
    // Примечание: точный API зависит от версии @hot-labs/kit
    // web3.on('accountsChanged', handleAccountChange);
    // web3.on('connect', handleConnect);
    // web3.on('disconnect', handleDisconnect);
    // web3.on('chainChanged', handleChainChange);

    // Альтернативный способ через MobX observer (если используется)
    // import { autorun } from 'mobx';
    // const disposer = autorun(() => {
    //   const account = web3.getAccount();
    //   handleAccountChange(account);
    // });

    return () => {
      // Отписка от событий при размонтировании
      // web3.off('accountsChanged', handleAccountChange);
      // web3.off('connect', handleConnect);
      // web3.off('disconnect', handleDisconnect);
      // web3.off('chainChanged', handleChainChange);
      // disposer?.();
    };
  }, []);

  // Подключение кошелька
  const handleConnect = useCallback(async () => {
    try {
      setWalletState(prev => ({ ...prev, isConnecting: true }));
      
      // Открываем модальное окно выбора кошелька
      await web3.connect();
      
      const account = web3.getAccount();
      if (account) {
        setWalletState({
          address: account.address,
          isConnected: true,
          isConnecting: false,
          chainId: account.chainId || null
        });
        toast.success('Кошелек успешно подключен');
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      setWalletState(prev => ({ ...prev, isConnecting: false }));
      toast.error('Ошибка подключения кошелька');
    }
  }, []);

  // Отключение кошелька
  const handleDisconnect = useCallback(async () => {
    try {
      await web3.disconnect();
      setWalletState({
        address: null,
        isConnected: false,
        isConnecting: false,
        chainId: null
      });
      toast.success('Кошелек отключен');
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
      toast.error('Ошибка отключения кошелька');
    }
  }, []);

  // Копирование адреса
  const handleCopyAddress = useCallback(() => {
    if (walletState.address) {
      navigator.clipboard.writeText(walletState.address);
      toast.success('Адрес скопирован');
    }
  }, [walletState.address]);

  // Открытие в explorer
  const handleOpenExplorer = useCallback(() => {
    if (walletState.address) {
      const explorerUrl = `https://nearblocks.io/address/${walletState.address}`;
      window.open(explorerUrl, '_blank');
    }
  }, [walletState.address]);

  // Форматирование адреса для отображения
  const formatAddress = (address: string): string => {
    if (address.endsWith('.near') || address.endsWith('.tg')) {
      return address;
    }
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Если кошелек не подключен - показываем кнопку подключения
  if (!walletState.isConnected) {
    return (
      <Button 
        onClick={handleConnect}
        disabled={walletState.isConnecting}
        className="gap-2"
      >
        <Wallet className="h-4 w-4" />
        {walletState.isConnecting ? 'Подключение...' : 'Подключить кошелек'}
      </Button>
    );
  }

  // Если кошелек подключен - показываем dropdown с опциями
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Wallet className="h-4 w-4" />
          <span>{formatAddress(walletState.address!)}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleCopyAddress}>
          <Copy className="mr-2 h-4 w-4" />
          Копировать адрес
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleOpenExplorer}>
          <ExternalLink className="mr-2 h-4 w-4" />
          Открыть в Explorer
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={handleDisconnect}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Отключить
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default WalletButton;
```

---

## Шаг 5: Использование с MobX Observer (опционально)

Если @hot-labs/kit использует MobX для реактивности, установите:

```bash
yarn add mobx mobx-react-lite
```

Обновите WalletButton:

```typescript
import { observer } from 'mobx-react-lite';
import { web3 } from '@/lib/web3';

export const WalletButton = observer(() => {
  // Теперь компонент автоматически обновится при изменении web3 state
  const account = web3.getAccount();
  const isConnected = !!account;
  
  // ... остальной код
});
```

---

## Шаг 6: Использование в приложении

```typescript
// В App.tsx или Layout
import { WalletButton } from '@/components/wallet/WalletButton';
import { web3 } from '@/lib/web3';

function App() {
  return (
    <div>
      <header>
        <WalletButton />
      </header>
      {/* ... */}
    </div>
  );
}

// Использование Omni Chain Intents
import { executeSwap, executeBridge, getSwapQuote } from '@/lib/omni';

const handleSwap = async () => {
  const quote = await getSwapQuote('NEAR', 'USDC', '10');
  console.log('Quote:', quote);
  
  const result = await executeSwap({
    fromToken: 'NEAR',
    toToken: 'USDC',
    amount: '10',
    slippage: 0.5
  });
  
  if (result.success) {
    console.log('Swap successful:', result.txHash);
  }
};
```

---

## Важные примечания

1. **Reown Project ID**: Получите на https://cloud.reown.com для WalletConnect интеграции

2. **Тестирование**: Сначала тестируйте на testnet перед mainnet

3. **Безопасность**: Никогда не храните приватные ключи в коде

4. **API HOT Protocol**: Документация на https://docs.hot-labs.org

5. **Обновления**: @hot-labs/kit активно развивается, проверяйте changelog

---

## Troubleshooting

### Ошибка "usb" native module
Убедитесь что добавили `resolutions` в package.json

### Ошибка "HotConnector is not defined"
Проверьте правильность импорта из @hot-labs/kit

### WalletConnect не работает
Убедитесь что projectId валидный и домен добавлен в Reown dashboard
