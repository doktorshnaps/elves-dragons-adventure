/**
 * OMNI Wallet Button Component
 * 
 * A reusable button component for connecting/disconnecting wallets via OMNI.
 * Supports multiple chains and shows connected wallet address.
 */

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Wallet, LogOut, Copy, Check, ChevronDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  getOmniConnector,
  connectOmniWallet,
  getConnectedWallets,
  onWalletConnect,
  onWalletDisconnect,
  type OmniWallet,
} from '@/lib/web3';

interface WalletButtonProps {
  className?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function WalletButton({ className, variant = 'outline', size = 'default' }: WalletButtonProps) {
  const [wallets, setWallets] = useState<OmniWallet[]>([]);
  const [connecting, setConnecting] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  // Sync wallets state
  const syncWallets = useCallback(() => {
    const connected = getConnectedWallets();
    setWallets(connected);
  }, []);

  useEffect(() => {
    // Initial sync
    syncWallets();

    // Subscribe to wallet events
    const unsubConnect = onWalletConnect(() => {
      syncWallets();
      toast({
        title: 'Кошелёк подключён',
        description: 'Вы успешно подключили кошелёк через OMNI',
      });
    });

    const unsubDisconnect = onWalletDisconnect(() => {
      syncWallets();
      toast({
        title: 'Кошелёк отключён',
        description: 'Кошелёк был отключён',
      });
    });

    return () => {
      unsubConnect();
      unsubDisconnect();
    };
  }, [syncWallets, toast]);

  const handleConnect = async (chain?: 'near' | 'evm') => {
    setConnecting(true);
    try {
      await connectOmniWallet(chain);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      toast({
        title: 'Ошибка подключения',
        description: error instanceof Error ? error.message : 'Не удалось подключить кошелёк',
        variant: 'destructive',
      });
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async (wallet: OmniWallet) => {
    try {
      await wallet.disconnect();
      syncWallets();
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    }
  };

  const copyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: 'Адрес скопирован',
        description: address,
      });
    } catch (error) {
      console.error('Failed to copy address:', error);
    }
  };

  const truncateAddress = (address: string) => {
    if (address.length <= 16) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const primaryWallet = wallets[0];

  // Not connected state
  if (wallets.length === 0) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={variant}
            size={size}
            className={className}
            disabled={connecting}
          >
            <Wallet className="mr-2 h-4 w-4" />
            {connecting ? 'Подключение...' : 'Подключить'}
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => handleConnect('near')}>
            <span className="mr-2">🌊</span>
            NEAR Wallet
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleConnect('evm')}>
            <span className="mr-2">⟠</span>
            EVM Wallet (MetaMask)
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleConnect()}>
            <Wallet className="mr-2 h-4 w-4" />
            Любой кошелёк
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Connected state
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <Wallet className="mr-2 h-4 w-4" />
          {truncateAddress(primaryWallet.address)}
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {wallets.map((wallet, index) => (
          <div key={wallet.address}>
            <DropdownMenuItem
              onClick={() => copyAddress(wallet.address)}
              className="flex items-center justify-between"
            >
              <span className="truncate max-w-[140px]">{truncateAddress(wallet.address)}</span>
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </DropdownMenuItem>
            {index < wallets.length - 1 && <DropdownMenuSeparator />}
          </div>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => primaryWallet && handleDisconnect(primaryWallet)}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Отключить
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default WalletButton;
