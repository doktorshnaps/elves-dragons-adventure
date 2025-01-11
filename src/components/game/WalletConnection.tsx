import "@/utils/near-polyfills";
import { useToast } from "@/hooks/use-toast";
import { useWalletInit } from "@/hooks/useWalletInit";
import { ConnectButton } from "./ConnectButton";
import { getNFTsForAccount, convertNFTToCard } from "@/utils/nftUtils";
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
    if (!modal) return;

    try {
      modal.show();
      const wallet = await selector?.wallet();
      
      if (!wallet) return;

      const accounts = await wallet.getAccounts();
      
      if (accounts.length > 0) {
        const accountId = accounts[0].accountId;
        setIsConnected(true);
        setWalletAddress(accountId);

        // Получаем NFT пользователя
        const nfts = await getNFTsForAccount(accountId, wallet);
        
        if (nfts.length === 0) {
          toast({
            title: "NFT не найдены",
            description: "У вас нет NFT из коллекции darai.mintbase1.near. Приобретите NFT, чтобы начать игру.",
            variant: "destructive"
          });
          return;
        }

        // Конвертируем NFT в игровые карты
        const cards = nfts.map(convertNFTToCard);
        localStorage.setItem('gameCards', JSON.stringify(cards));
        
        // Отправляем событие обновления карт
        const event = new CustomEvent('cardsUpdate', { 
          detail: { cards }
        });
        window.dispatchEvent(event);

        toast({
          title: "Кошелек подключен",
          description: `Подключен к аккаунту ${accountId}. Загружено ${nfts.length} NFT карт.`,
        });
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast({
        title: "Ошибка подключения",
        description: "Не удалось подключить кошелек или загрузить NFT",
        variant: "destructive"
      });
    }
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setWalletAddress(null);
    localStorage.removeItem('gameCards');
    toast({
      title: "Кошелек отключен",
      description: "Ваш кошелек был успешно отключен",
    });
  };

  return (
    <ConnectButton
      isConnected={isConnected}
      walletAddress={walletAddress}
      onConnect={handleConnect}
      onDisconnect={handleDisconnect}
    />
  );
};