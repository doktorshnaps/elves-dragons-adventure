import "@/utils/near-polyfills";
import { useToast } from "@/hooks/use-toast";
import { useWalletInit } from "@/hooks/useWalletInit";
import { ConnectButton } from "./ConnectButton";
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
  const { selector, modal } = useWalletInit(setIsConnected, setWalletAddress);

  const handleConnect = async () => {
    if (isConnected) {
      setIsConnected(false);
      setWalletAddress(null);
      toast({
        title: "Кошелек отключен",
        description: "Ваш кошелек был успешно отключен",
      });
      return;
    }

    if (!modal) return;

    try {
      modal.show();
      const wallet = await selector?.wallet();
      
      if (!wallet) return;

      const accounts = await wallet.getAccounts();
      
      if (accounts.length > 0) {
        setIsConnected(true);
        setWalletAddress(accounts[0].accountId);
        toast({
          title: "Кошелек подключен",
          description: `Подключен к аккаунту ${accounts[0].accountId}`,
        });
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };

  return (
    <ConnectButton
      isConnected={isConnected}
      walletAddress={walletAddress}
      onClick={handleConnect}
    />
  );
};