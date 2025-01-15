import { useState, useEffect } from "react";
import { setupWalletSelector } from "@near-wallet-selector/core";
import { setupModal } from "@near-wallet-selector/modal-ui";
import { setupMyNearWallet } from "@near-wallet-selector/my-near-wallet";
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Polyfill Buffer for browser environment
import { Buffer } from 'buffer';
globalThis.Buffer = Buffer;

export const WalletConnect = () => {
  const [accountId, setAccountId] = useState<string | null>(null);
  const { toast } = useToast();
  const [modal, setModal] = useState<any>(null);

  useEffect(() => {
    setupWalletSelector({
      network: "testnet",
      modules: [setupMyNearWallet()],
    }).then((selector) => {
      const modal = setupModal(selector, {
        contractId: "dev-1234567890",
      });
      setModal(modal);

      // Get wallet state on load
      const accounts = selector.store.getState().accounts;
      if (accounts.length > 0) {
        setAccountId(accounts[0].accountId);
        toast({
          title: "Кошелек подключен",
          description: `Аккаунт: ${accounts[0].accountId}`,
        });
      }
    });
  }, []);

  const handleConnect = () => {
    if (!accountId && modal) {
      modal.show();
    } else {
      modal?.wallet().signOut();
      setAccountId(null);
      toast({
        title: "Кошелек отключен",
        description: "Вы успешно отключили кошелек",
      });
    }
  };

  return (
    <Button
      variant="outline"
      className="gap-2"
      onClick={handleConnect}
    >
      <Wallet className="w-4 h-4" />
      {accountId ? "Отключить кошелек" : "Подключить кошелек"}
    </Button>
  );
};