import { useState, useEffect, useCallback } from "react";
import { Wallet2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setupWalletSelector } from "@near-wallet-selector/core";
import { setupModal } from "@near-wallet-selector/modal-ui";
import { setupMyNearWallet } from "@near-wallet-selector/my-near-wallet";
import { useToast } from "@/hooks/use-toast";
import "@near-wallet-selector/modal-ui/styles.css";

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
  const [walletModal, setWalletModal] = useState<any>(null);
  const [selector, setSelector] = useState<any>(null);

  const initWallet = useCallback(async () => {
    try {
      const selector = await setupWalletSelector({
        network: "testnet",
        modules: [setupMyNearWallet()],
      });

      const modal = setupModal(selector, {
        contractId: "game.testnet",
      });

      setSelector(selector);
      setWalletModal(modal);

      const wallet = await selector.wallet();
      const accounts = await wallet.getAccounts();

      if (accounts.length > 0) {
        setIsConnected(true);
        setWalletAddress(accounts[0].accountId);
        toast({
          title: "Кошелек подключен",
          description: `Подключен к ${accounts[0].accountId}`,
        });
      }
    } catch (error) {
      console.error("Error initializing wallet:", error);
      toast({
        title: "Ошибка инициализации",
        description: "Не удалось инициализировать кошелек",
        variant: "destructive",
      });
    }
  }, [setIsConnected, setWalletAddress, toast]);

  useEffect(() => {
    initWallet();
  }, [initWallet]);

  const handleConnect = async () => {
    if (isConnected) {
      setIsConnected(false);
      setWalletAddress(null);
      toast({
        title: "Кошелек отключен",
        description: "Ваш кошелек был отключен",
      });
    } else {
      try {
        if (!walletModal) {
          toast({
            title: "Ошибка подключения",
            description: "Кошелек не инициализирован. Попробуйте перезагрузить страницу.",
            variant: "destructive",
          });
          return;
        }

        await walletModal.show();
        
        if (selector) {
          const wallet = await selector.wallet();
          const accounts = await wallet.getAccounts();
          
          if (accounts.length > 0) {
            setIsConnected(true);
            setWalletAddress(accounts[0].accountId);
            toast({
              title: "Кошелек подключен",
              description: `Подключен к ${accounts[0].accountId}`,
            });
          }
        }
      } catch (error) {
        console.error('Error connecting wallet:', error);
        toast({
          title: "Ошибка подключения",
          description: "Не удалось подключить кошелек",
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
      {isConnected ? `Подключен: ${walletAddress?.slice(0, 6)}...` : "Подключить кошелек"}
    </Button>
  );
};