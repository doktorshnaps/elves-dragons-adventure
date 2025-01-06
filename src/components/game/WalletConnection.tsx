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

    if (!modal) {
      toast({
        title: "Ошибка инициализации",
        description: "Не удалось инициализировать кошелек. Пожалуйста, обновите страницу",
        variant: "destructive",
      });
      return;
    }

    try {
      modal.show();
      const wallet = await selector?.wallet();
      
      if (!wallet) {
        toast({
          title: "Ошибка подключения",
          description: "Пожалуйста, выберите кошелек в модальном окне",
          variant: "destructive",
        });
        return;
      }

      const accounts = await wallet.getAccounts();
      
      if (accounts.length > 0) {
        setIsConnected(true);
        setWalletAddress(accounts[0].accountId);
        toast({
          title: "Кошелек подключен",
          description: `Подключен к аккаунту ${accounts[0].accountId}`,
        });
      } else {
        toast({
          title: "Ошибка подключения",
          description: "Не найдены аккаунты в кошельке",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      
      let errorMessage = "Не удалось подключить кошелек";
      if (error instanceof Error) {
        if (error.message.includes("No wallet selected")) {
          errorMessage = "Пожалуйста, выберите кошелек в модальном окне";
        }
      }
      
      toast({
        title: "Ошибка подключения",
        description: errorMessage,
        variant: "destructive",
      });
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