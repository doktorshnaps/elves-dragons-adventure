import { useState, useEffect } from "react";
import { Wallet2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setupWalletSelector } from "@near-wallet-selector/core";
import { setupModal } from "@near-wallet-selector/modal-ui";
import { setupMyNearWallet } from "@near-wallet-selector/my-near-wallet";
import { useToast } from "@/hooks/use-toast";

interface WalletConnectionProps {
  isConnected: boolean;
  setIsConnected: (value: boolean) => void;
  walletAddress: string | null;
  setWalletAddress: (value: string | null) => void;
}

export const WalletConnection = ({
  isConnected,
  setIsConnected,
  walletAddress,
  setWalletAddress,
}: WalletConnectionProps) => {
  const { toast } = useToast();

  useEffect(() => {
    const initWallet = async () => {
      const selector = await setupWalletSelector({
        network: "testnet",
        modules: [setupMyNearWallet()],
      });

      const modal = setupModal(selector, {
        contractId: "game.testnet",
      });

      const wallet = await selector.wallet();
      const accounts = await wallet.getAccounts();

      if (accounts.length > 0) {
        setIsConnected(true);
        setWalletAddress(accounts[0].accountId);
        toast({
          title: "Wallet Connected",
          description: `Connected to ${accounts[0].accountId}`,
        });
      }

      (window as any).walletSelector = selector;
      (window as any).walletModal = modal;
    };

    initWallet().catch(console.error);
  }, [toast, setIsConnected, setWalletAddress]);

  const handleConnect = async () => {
    if (isConnected) {
      setIsConnected(false);
      setWalletAddress(null);
      toast({
        title: "Wallet Disconnected",
        description: "Your wallet has been disconnected",
      });
    } else {
      try {
        const modal = (window as any).walletModal;
        await modal.show();
        
        const selector = (window as any).walletSelector;
        const wallet = await selector.wallet();
        const accounts = await wallet.getAccounts();
        
        if (accounts.length > 0) {
          setIsConnected(true);
          setWalletAddress(accounts[0].accountId);
          toast({
            title: "Wallet Connected",
            description: `Connected to ${accounts[0].accountId}`,
          });
        }
      } catch (error) {
        console.error('Error connecting wallet:', error);
        toast({
          title: "Connection Error",
          description: "Failed to connect wallet",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <Button
      variant="outline"
      className="bg-game-surface border-game-accent text-game-accent hover:bg-game-accent hover:text-white transition-all duration-300"
      onClick={handleConnect}
    >
      <Wallet2 className="mr-2 h-4 w-4" />
      {isConnected ? `Connected: ${walletAddress?.slice(0, 6)}...` : "Connect Wallet"}
    </Button>
  );
};