import { useState, useEffect } from "react";
import { Wallet2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setupWalletSelector } from "@near-wallet-selector/core";
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

let selector: Awaited<ReturnType<typeof setupWalletSelector>>;
let modal: ReturnType<typeof setupModal>;

const initWallet = async () => {
  if (!selector) {
    selector = await setupWalletSelector({
      modules: [setupHotWallet()],
      network: "testnet",
    });

    modal = setupModal(selector, {
      contractId: "game.testnet",
    });

    return { selector, modal };
  }
  return { selector, modal };
};

export const WalletConnection = ({
  isConnected,
  setIsConnected,
  walletAddress,
  setWalletAddress,
}: WalletConnectionProps) => {
  const { toast } = useToast();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const setupWallet = async () => {
      try {
        const { selector } = await initWallet();
        const wallet = await selector.wallet();
        const accounts = await wallet.getAccounts();
        console.log("Available accounts:", accounts);

        if (accounts.length > 0) {
          setWalletAddress(accounts[0].accountId);
          setIsConnected(true);
          toast({
            title: "Кошелек подключен",
            description: `Подключен к ${accounts[0].accountId}`,
          });
        }

        selector.on("signedIn", async (event) => {
          console.log("Signed in event:", event);
          setWalletAddress(event.accounts[0].accountId);
          setIsConnected(true);
          toast({
            title: "Кошелек подключен",
            description: `Подключен к ${event.accounts[0].accountId}`,
          });
        });

        selector.on("signedOut", async () => {
          console.log("Signed out event triggered");
          setWalletAddress(null);
          setIsConnected(false);
          toast({
            title: "Кошелек отключен",
            description: "Ваш кошелек был отключен",
          });
        });

        setIsInitialized(true);
      } catch (error) {
        console.error("Error initializing wallet:", error);
        toast({
          title: "Ошибка инициализации",
          description: "Не удалось инициализировать кошелек",
          variant: "destructive",
        });
      }
    };

    if (!isInitialized) {
      setupWallet();
    }
  }, [setIsConnected, setWalletAddress, toast, isInitialized]);

  const handleConnect = async () => {
    try {
      console.log("Handle connect triggered, current connection status:", isConnected);
      const { selector, modal } = await initWallet();
      
      if (isConnected) {
        console.log("Attempting to sign out");
        const wallet = await selector.wallet();
        await wallet.signOut();
      } else {
        console.log("Showing modal for connection");
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