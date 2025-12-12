/**
 * Example 1: Basic OMNI Wallet Connection
 * 
 * Demonstrates how to initialize OMNI connector and connect wallets.
 */

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  initOmniConnector,
  connectOmniWallet,
  getConnectedWallets,
  onWalletConnect,
  onWalletDisconnect,
  type OmniWallet,
} from '@/lib/web3';

export function OmniBasicUsage() {
  const [initialized, setInitialized] = useState(false);
  const [wallets, setWallets] = useState<OmniWallet[]>([]);
  const [loading, setLoading] = useState(false);

  // Initialize OMNI connector on mount
  useEffect(() => {
    const init = async () => {
      try {
        await initOmniConnector({
          enabledChains: ['near', 'evm'],
          walletConnect: {
            projectId: '1292473190ce7eb75c9de67e15aaad99',
            metadata: {
              name: 'My App',
              description: 'My awesome app',
              url: window.location.origin,
              icons: ['/favicon.ico'],
            },
          },
        });
        setInitialized(true);
        setWallets(getConnectedWallets());
      } catch (error) {
        console.error('Failed to initialize OMNI:', error);
      }
    };

    init();
  }, []);

  // Subscribe to wallet events
  useEffect(() => {
    if (!initialized) return;

    const unsubConnect = onWalletConnect((wallet) => {
      console.log('Wallet connected:', wallet.address);
      setWallets(getConnectedWallets());
    });

    const unsubDisconnect = onWalletDisconnect((wallet) => {
      console.log('Wallet disconnected:', wallet.address);
      setWallets(getConnectedWallets());
    });

    return () => {
      unsubConnect();
      unsubDisconnect();
    };
  }, [initialized]);

  const handleConnect = async (chain: 'near' | 'evm') => {
    setLoading(true);
    try {
      await connectOmniWallet(chain);
    } catch (error) {
      console.error('Connection failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>OMNI Basic Usage</CardTitle>
        <CardDescription>
          Connect your wallet using OMNI multi-chain connector
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!initialized ? (
          <p className="text-muted-foreground">Initializing OMNI...</p>
        ) : (
          <>
            <div className="flex gap-2">
              <Button
                onClick={() => handleConnect('near')}
                disabled={loading}
                variant="outline"
              >
                Connect NEAR
              </Button>
              <Button
                onClick={() => handleConnect('evm')}
                disabled={loading}
                variant="outline"
              >
                Connect EVM
              </Button>
            </div>

            {wallets.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Connected Wallets:</p>
                {wallets.map((wallet) => (
                  <div
                    key={wallet.address}
                    className="flex items-center justify-between p-2 bg-muted rounded"
                  >
                    <span className="text-sm font-mono truncate max-w-[200px]">
                      {wallet.address}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => wallet.disconnect()}
                    >
                      Disconnect
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default OmniBasicUsage;
