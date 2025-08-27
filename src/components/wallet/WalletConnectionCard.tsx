import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wallet, X, Loader2 } from 'lucide-react';
import { useWalletConnection, WalletConnection } from '@/hooks/useWalletConnection';
import { WalletType } from '@hot-labs/near-connect';

const WALLET_ICONS: Record<WalletType, string> = {
  [WalletType.NEAR]: '🔷',
  [WalletType.EVM]: '⚡',
  [WalletType.SOLANA]: '🟣',
  [WalletType.TON]: '💎',
  [WalletType.STELLAR]: '⭐'
};

const WALLET_NAMES: Record<WalletType, string> = {
  [WalletType.NEAR]: 'NEAR',
  [WalletType.EVM]: 'Ethereum',
  [WalletType.SOLANA]: 'Solana',
  [WalletType.TON]: 'TON',
  [WalletType.STELLAR]: 'Stellar'
};

export const WalletConnectionCard = () => {
  const {
    connections,
    isConnecting,
    error,
    connectWallet,
    disconnectWallet,
    disconnectAll,
    isInitialized
  } = useWalletConnection();

  const formatAddress = (address: string) => {
    if (address.length <= 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const availableWallets = [
    WalletType.NEAR,
    WalletType.TON
  ];

  const connectedTypes = connections.map(conn => conn.type);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Подключение кошелька
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isInitialized && (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Инициализация...</span>
          </div>
        )}

        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Connected Wallets */}
        {connections.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Подключенные кошельки:</h4>
            {connections.map((connection) => (
              <div
                key={connection.type}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">
                    {WALLET_ICONS[connection.type]}
                  </span>
                  <div>
                    <div className="font-medium">
                      {WALLET_NAMES[connection.type]}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatAddress(connection.address)}
                    </div>
                  </div>
                  <Badge variant="secondary" className="ml-auto">
                    {connection.network}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => disconnectWallet(connection.type)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            
            {connections.length > 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={disconnectAll}
                className="w-full"
              >
                Отключить все кошельки
              </Button>
            )}
          </div>
        )}

        {/* Available Wallets to Connect */}
        {isInitialized && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Доступные кошельки:</h4>
            <div className="grid grid-cols-2 gap-2">
              {availableWallets
                .filter(type => !connectedTypes.includes(type))
                .map((walletType) => (
                  <Button
                    key={walletType}
                    variant="outline"
                    size="sm"
                    onClick={() => connectWallet(walletType)}
                    disabled={isConnecting}
                    className="flex items-center gap-2"
                  >
                    {isConnecting && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    <span>{WALLET_ICONS[walletType]}</span>
                    {WALLET_NAMES[walletType]}
                  </Button>
                ))}
            </div>
          </div>
        )}

        {connections.length === 0 && isInitialized && (
          <div className="text-center p-6 text-muted-foreground">
            <Wallet className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Нет подключенных кошельков</p>
            <p className="text-sm">Выберите кошелек для подключения</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};