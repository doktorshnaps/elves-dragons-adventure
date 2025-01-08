import { ShoppingBag, Search, ArrowLeft, Sword, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { WalletConnection } from "./WalletConnection";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

interface GameHeaderProps {
  isConnected: boolean;
  setIsConnected: (value: boolean) => void;
  walletAddress: string | null;
  setWalletAddress: (value: string | null) => void;
  balance: number;
  hasActiveDungeon: boolean;
  setShowDungeonSearch: (value: boolean) => void;
  setShowShop: (value: boolean) => void;
  teamStats: { power: number; defense: number };
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
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  return (
    <div className={`flex flex-col ${isMobile ? 'gap-2' : 'gap-4'} mb-4`}>
      <div className={`flex ${isMobile ? 'flex-col gap-2' : 'flex-row gap-4'}`}>
        <WalletConnection
          isConnected={isConnected}
          setIsConnected={setIsConnected}
          walletAddress={walletAddress}
          setWalletAddress={setWalletAddress}
        />
        
        <Card className={`bg-game-surface border-game-accent ${isMobile ? 'p-2 text-sm' : 'p-4'}`}>
          <p className="text-game-accent">Баланс: {balance} монет</p>
        </Card>

        <Card className={`bg-game-surface border-game-accent ${isMobile ? 'p-2' : 'p-4'}`}>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <Sword className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} text-game-accent`} />
              <span className={`text-game-accent ${isMobile ? 'text-sm' : ''}`}>{teamStats.power}</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} text-game-accent`} />
              <span className={`text-game-accent ${isMobile ? 'text-sm' : ''}`}>{teamStats.defense}</span>
            </div>
          </div>
        </Card>
      </div>

      <div className={`flex ${isMobile ? 'flex-col gap-2' : 'flex-row justify-between'}`}>
        <Button
          variant="outline"
          className={`bg-game-surface border-game-accent text-game-accent hover:bg-game-accent hover:text-white transition-all duration-300 ${isMobile ? 'text-sm' : ''}`}
          onClick={() => setShowShop(true)}
        >
          <ShoppingBag className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} mr-2`} />
          {isMobile ? 'Магазин' : 'Магазин предметов'}
        </Button>

        {hasActiveDungeon ? (
          <Button
            className={`bg-game-primary hover:bg-game-primary/80 text-white ${isMobile ? 'text-sm' : ''}`}
            onClick={() => navigate("/battle")}
          >
            <ArrowLeft className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} mr-2`} />
            {isMobile ? 'В бой' : 'Вернуться в подземелье'}
          </Button>
        ) : (
          <Button
            className={`bg-game-primary hover:bg-game-primary/80 text-white ${isMobile ? 'text-sm' : ''}`}
            onClick={() => setShowDungeonSearch(true)}
          >
            <Search className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} mr-2`} />
            {isMobile ? 'Поиск' : 'Найти подземелье'}
          </Button>
        )}
      </div>
    </div>
  );
};