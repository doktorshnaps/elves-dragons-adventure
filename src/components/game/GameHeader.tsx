import { ConnectButton } from "./ConnectButton";
import { PlayerStats } from "./PlayerStats";
import { Button } from "@/components/ui/button";
import { QuestsWindow } from "./QuestsWindow";
import { useIsMobile } from "@/hooks/use-mobile";
import { TeamStats } from "@/types/cards";
import { Store, Sword } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface GameHeaderProps {
  isConnected: boolean;
  setIsConnected: (value: boolean) => void;
  walletAddress: string | null;
  setWalletAddress: (address: string | null) => void;
  balance: number;
  hasActiveDungeon: boolean;
  setShowDungeonSearch: (show: boolean) => void;
  setShowShop: (show: boolean) => void;
  teamStats: TeamStats;
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
  const navigate = useNavigate();

  const handleDungeonClick = () => {
    const savedState = localStorage.getItem('battleState');
    if (savedState) {
      const state = JSON.parse(savedState);
      if (state.playerStats && state.playerStats.health > 0) {
        navigate('/battle');
        return;
      }
    }
    setShowDungeonSearch(true);
  };

  return (
    <div className={`flex flex-col ${isMobile ? 'gap-2' : 'gap-4'}`}>
      <div className="flex justify-between items-center">
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
          <QuestsWindow />
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setShowShop(true)}
          >
            <Store className="w-4 h-4" />
            Магазин
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={handleDungeonClick}
          >
            <Sword className="w-4 h-4" />
            {hasActiveDungeon ? "Вернуться в подземелье" : "Найти подземелье"}
          </Button>
        </div>
      </div>
      <PlayerStats balance={balance} teamStats={teamStats} />
    </div>
  );
};