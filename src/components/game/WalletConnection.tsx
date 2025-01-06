import { useState, useEffect } from "react";
import { Wallet2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setupWalletSelector, Wallet } from "@near-wallet-selector/core";
import { setupModal } from "@near-wallet-selector/modal-ui";
import { setupHotWallet } from "@hot-wallet/sdk/adapter/near";
import { useToast } from "@/hooks/use-toast";
import "@near-wallet-selector/modal-ui/styles.css";

interface WalletConnectionProps {
  isConnected: boolean;
  setIsConnected: (value: boolean) => void;
  walletAddress: string | null;
  setWalletAddress: (value: string | null) => void;
}

const initSelector = (async () => {
  const selector = await setupWalletSelector({ 
    modules: [setupHotWallet()], 
    network: "testnet" 
  });
  const modal = setupModal(selector, { contractId: "game.testnet" });
  return { selector, modal };
})();

export const WalletConnection = ({
  isConnected,
  setIsConnected,
  walletAddress,
  setWalletAddress,
}: WalletConnectionProps) => {
  const { toast } = useToast();
  const [wallet, setWallet] = useState<Wallet>();

  useEffect(() => {
    initSelector.then(({ selector }) => {
      selector.wallet().then((wallet) => {
        wallet.getAccounts().then((accounts) => {
          if (accounts.length > 0) {
            setWalletAddress(accounts[0].accountId);
            setIsConnected(true);
            setWallet(wallet);
            toast({
              title: "Кошелек подключен",
              description: `Подключен к ${accounts[0].accountId}`,
            });
          }
        });
      });

      selector.on("signedIn", async (event) => {
        setWallet(await selector.wallet());
        setWalletAddress(event.accounts[0].accountId);
        setIsConnected(true);
        toast({
          title: "Кошелек подключен",
          description: `Подключен к ${event.accounts[0].accountId}`,
        });
      });

      selector.on("signedOut", async () => {
        setWallet(undefined);
        setWalletAddress(null);
        setIsConnected(false);
        toast({
          title: "Кошелек отключен",
          description: "Ваш кошелек был отключен",
        });
      });
    }).catch((error) => {
      console.error("Error initializing wallet:", error);
      toast({
        title: "Ошибка инициализации",
        description: "Не удалось инициализировать кошелек",
        variant: "destructive",
      });
    });
  }, [setIsConnected, setWalletAddress, toast]);

  const handleConnect = async () => {
    try {
      const { modal } = await initSelector;
      if (wallet) {
        await wallet.signOut();
      } else {
        modal.show();
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast({
        title: "Ошибка подключения",
        description: "Не удалось подключить кошелек",
        variant: "destructive",
      });
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