import { useState, useEffect } from "react";
import { setupWalletSelector } from "@near-wallet-selector/core";
import { setupModal } from "@near-wallet-selector/modal-ui";
import { setupMyNearWallet } from "@near-wallet-selector/my-near-wallet";
import { useToast } from "@/hooks/use-toast";

export const useWalletInit = (
  setIsConnected: (value: boolean) => void,
  setWalletAddress: (value: string | null) => void
) => {
  const [selector, setSelector] = useState<any>(null);
  const [modal, setModal] = useState<any>(null);
  const { toast } = useToast();

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
  }, [setIsConnected, setWalletAddress, toast]);

  return { selector, modal };
};