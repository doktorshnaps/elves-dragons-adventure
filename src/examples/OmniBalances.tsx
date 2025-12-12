/**
 * Example 3: OMNI Token Balances
 * 
 * Demonstrates how to fetch and display token balances using OMNI.
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';
import {
  initOmniConnector,
  getOmniConnector,
  getConnectedWallets,
  onWalletConnect,
  type OmniWallet,
} from '@/lib/web3';

interface TokenBalance {
  address: string;
  balance: string;
}

export function OmniBalances() {
  const [initialized, setInitialized] = useState(false);
  const [wallet, setWallet] = useState<OmniWallet | null>(null);
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        await initOmniConnector({ enabledChains: ['near', 'evm'] });
        setInitialized(true);
        
        const wallets = getConnectedWallets();
        if (wallets.length > 0) {
          setWallet(wallets[0]);
        }
      } catch (error) {
        console.error('Failed to initialize:', error);
      }
    };

    init();
  }, []);

  useEffect(() => {
    if (!initialized) return;

    const unsubConnect = onWalletConnect((w) => {
      setWallet(w);
      fetchBalances(w);
    });

    return () => {
      unsubConnect();
    };
  }, [initialized]);

  const fetchBalances = async (w: OmniWallet) => {
    setLoading(true);
    try {
      // Fetch balances for common tokens
      const result = await w.fetchBalances();
      
      const parsed: TokenBalance[] = Object.entries(result).map(([address, balance]) => ({
        address,
        balance: formatBalance(balance),
      }));
      
      setBalances(parsed);
    } catch (error) {
      console.error('Failed to fetch balances:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatBalance = (balance: bigint): string => {
    // Assuming 18 decimals, adjust as needed
    const decimals = 18;
    const value = Number(balance) / Math.pow(10, decimals);
    return value.toFixed(4);
  };

  if (!initialized) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!wallet) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Token Balances</CardTitle>
          <CardDescription>Connect wallet to see balances</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Token Balances</CardTitle>
            <CardDescription className="font-mono text-xs">
              {wallet.address.slice(0, 10)}...{wallet.address.slice(-6)}
            </CardDescription>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => fetchBalances(wallet)}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {balances.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            {loading ? 'Loading balances...' : 'No tokens found'}
          </p>
        ) : (
          <div className="space-y-2">
            {balances.map((token) => (
              <div
                key={token.address}
                className="flex items-center justify-between p-3 bg-muted rounded-lg"
              >
                <span className="font-mono text-xs truncate max-w-[180px]">
                  {token.address}
                </span>
                <span className="font-medium">{token.balance}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default OmniBalances;
