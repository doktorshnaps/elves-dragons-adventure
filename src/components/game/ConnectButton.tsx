import { Wallet2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ConnectButtonProps {
  isConnected: boolean;
  walletAddress: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
}

export const ConnectButton = ({
  isConnected,
  walletAddress,
  onConnect,
  onDisconnect
}: ConnectButtonProps) => {
  return (
    <Button
      variant="outline"
      className="bg-game-surface border-game-accent text-game-accent hover:bg-game-accent hover:text-white transition-all duration-300"
      onClick={isConnected ? onDisconnect : onConnect}
    >
      <Wallet2 className="mr-2 h-4 w-4" />
      {isConnected ? `Connected: ${walletAddress?.slice(0, 6)}...` : "Connect Wallet"}
    </Button>
  );
};