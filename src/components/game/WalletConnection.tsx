import { useState, useEffect } from "react";
import { Wallet2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setupWalletSelector } from "@near-wallet-selector/core";
import { setupModal } from "@near-wallet-selector/modal-ui";
import { setupMyNearWallet } from "@near-wallet-selector/my-near-wallet";
import { useToast } from "@/hooks/use-toast";
import "@near-wallet-selector/modal-ui/styles.css";
import "../../../src/utils/near-polyfills";

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
  const [selector, setSelector] = useState<any>(null);
  const [modal, setModal] = useState<any>(null);

  useEffect(() => {
    const initWallet = async () => {
      try {
        const walletSelector = await setupWalletSelector({
          network: "testnet",
          modules: [setupMyNearWallet()],
        });

        const walletModal = setupModal(walletSelector, {
          contractId: "game.testnet",
        });

        setSelector(walletSelector);
        setModal(walletModal);

        // Check if there's an existing wallet connection
        const wallet = await walletSelector.wallet();
        if (wallet) {
          const accounts = await wallet.getAccounts();
          if (accounts.length > 0) {
            setIsConnected(true);
            setWalletAddress(accounts[0].accountId);
            toast({
              title: "Wallet Connected",
              description: `Connected to ${accounts[0].accountId}`,
            });
          }
        }
      } catch (error) {
        console.error("Error initializing wallet:", error);
        toast({
          title: "Initialization Error",
          description: "Failed to initialize wallet connection",
          variant: "destructive",
        });
      }
    };

    initWallet();
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
        if (!modal) {
          throw new Error("Wallet modal not initialized");
        }

        await modal.show();
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