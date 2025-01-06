import "@/utils/near-polyfills";
import { useToast } from "@/hooks/use-toast";
import { useWalletInit } from "@/hooks/useWalletInit";
import { ConnectButton } from "./ConnectButton";
import { HOT } from "@hot-wallet/sdk";
import "@near-wallet-selector/modal-ui/styles.css";

// Initialize Hot Wallet provider
HOT.setupEthProvider((request, chain, address) => {
  // For demo purposes, we'll use a public Ethereum RPC
  const publicRpcProvider: Record<string, string> = {
    "1": "https://eth-mainnet.public.blastapi.io",
    "5": "https://eth-goerli.public.blastapi.io"
  };
  
  return fetch(publicRpcProvider[chain], {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  }).then(res => res.json());
});

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

    try {
      // First try Hot Wallet
      const hotWalletAddress = await (HOT as any).requestAccounts().catch(() => null);
      
      if (hotWalletAddress && hotWalletAddress[0]) {
        setIsConnected(true);
        setWalletAddress(hotWalletAddress[0]);
        toast({
          title: "Кошелек подключен",
          description: `Подключен к аккаунту ${hotWalletAddress[0]}`,
        });
        return;
      }

      // If Hot Wallet fails, try NEAR wallet
      if (!modal) return;

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
      console.error('Wallet connection error:', error);
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