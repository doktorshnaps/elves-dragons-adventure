import { Button } from "@/components/ui/button";
import { Sword, ShoppingCart } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { ConnectButton } from "./ConnectButton";
import { PlayerStats } from "./PlayerStats";
import { TeamStats as TeamStatsType } from "@/types/cards";

interface GameHeaderProps {
  isConnected: boolean;
  setIsConnected: (value: boolean) => void;
  walletAddress: string | null;
  setWalletAddress: (address: string | null) => void;
  balance: number;
  hasActiveDungeon: boolean;
  setShowDungeonSearch: (value: boolean) => void;
  setShowShop: (value: boolean) => void;
  teamStats: TeamStatsType;
}

export const GameHeader = ({
  isConnected,
  setIsConnected,
  walletAddress,
  setWalletAddress,
  balance,
  hasActiveDungeon,
  setShowDungeonSearch,
  setShowShop,
  teamStats,
}: GameHeaderProps) => {
  const isMobile = useIsMobile();

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <ConnectButton
          isConnected={isConnected}
          walletAddress={walletAddress}
          onConnect={() => setIsConnected(true)}
          onDisconnect={() => {
            setIsConnected(false);
            setWalletAddress(null);
          }}
        />
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setShowDungeonSearch(true)}
            disabled={hasActiveDungeon}
          >
            <Sword className="w-4 h-4" />
            {isMobile ? "Подземелье" : "Поиск подземелья"}
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setShowShop(true)}
          >
            <ShoppingCart className="w-4 h-4" />
            {isMobile ? "Магазин" : "Открыть магазин"}
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <PlayerStats balance={balance} teamStats={teamStats} />
      </div>
    </div>
  );
};