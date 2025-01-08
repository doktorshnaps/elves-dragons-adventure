import { ShoppingBag, Search, ArrowLeft, Sword, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { WalletConnection } from "./WalletConnection";
import { useNavigate } from "react-router-dom";

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

  return (
    <div className="flex justify-between items-center mb-8">
      <div className="flex gap-4">
        <WalletConnection
          isConnected={isConnected}
          setIsConnected={setIsConnected}
          walletAddress={walletAddress}
          setWalletAddress={setWalletAddress}
        />
        
        <Card className="bg-game-surface border-game-accent p-4">
          <p className="text-game-accent">Баланс: {balance} монет</p>
        </Card>

        <Card className="bg-game-surface border-game-accent p-4">
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <Sword className="w-4 h-4 text-game-accent" />
              <span className="text-game-accent">{teamStats.power}</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-game-accent" />
              <span className="text-game-accent">{teamStats.defense}</span>
            </div>
          </div>
        </Card>

        <Button
          variant="outline"
          className="bg-game-surface border-game-accent text-game-accent hover:bg-game-accent hover:text-white transition-all duration-300"
          onClick={() => setShowShop(true)}
        >
          <ShoppingBag className="mr-2 h-4 w-4" />
          Магазин предметов
        </Button>
      </div>

      {hasActiveDungeon ? (
        <Button
          className="bg-game-primary hover:bg-game-primary/80 text-white"
          onClick={() => navigate("/battle")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Вернуться в подземелье
        </Button>
      ) : (
        <Button
          className="bg-game-primary hover:bg-game-primary/80 text-white"
          onClick={() => setShowDungeonSearch(true)}
        >
          <Search className="mr-2 h-4 w-4" />
          Найти подземелье
        </Button>
      )}
    </div>
  );
};