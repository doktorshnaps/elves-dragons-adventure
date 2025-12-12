/**
 * WalletButton Component
 * 
 * Кнопка подключения/отключения NEAR кошелька
 * Использует mobx-react-lite для реактивного обновления UI
 */

import { observer } from "mobx-react-lite";
import { useEffect } from "react";
import { walletStore } from "@/lib/web3";
import { Button } from "@/components/ui/button";
import { Wallet, LogOut, Loader2 } from "lucide-react";

interface WalletButtonProps {
  className?: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  showAddress?: boolean;
}

export const WalletButton = observer(function WalletButton({
  className = "",
  variant = "default",
  size = "default",
  showAddress = true,
}: WalletButtonProps) {
  useEffect(() => {
    // Инициализируем коннектор при монтировании
    walletStore.init();
  }, []);

  const handleClick = () => {
    if (walletStore.isConnected) {
      walletStore.disconnect();
    } else {
      walletStore.connect();
    }
  };

  // Форматирование адреса для отображения
  const formatAddress = (address: string): string => {
    if (address.length <= 16) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (walletStore.isConnecting) {
    return (
      <Button
        variant={variant}
        size={size}
        className={className}
        disabled
      >
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Подключение...
      </Button>
    );
  }

  if (walletStore.isConnected && walletStore.accountId) {
    return (
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={handleClick}
      >
        <LogOut className="mr-2 h-4 w-4" />
        {showAddress ? formatAddress(walletStore.accountId) : "Выйти"}
      </Button>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleClick}
    >
      <Wallet className="mr-2 h-4 w-4" />
      Подключить кошелёк
    </Button>
  );
});

export default WalletButton;
