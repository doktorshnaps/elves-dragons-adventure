import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft, DoorOpen } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useBalanceState } from "@/hooks/useBalanceState";

interface BattleHeaderProps {
  selectedDungeon: string;
  savedLevel: number;
  onBackToGame: () => void;
  onExitDungeon: () => void;
}

export const BattleHeader = ({
  selectedDungeon,
  savedLevel,
  onBackToGame,
  onExitDungeon
}: BattleHeaderProps) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { balance } = useBalanceState();

  const handleExitDungeon = () => {
    localStorage.removeItem('battleState');
    toast({
      title: "Подземелье покинуто",
      description: `Вы покинули ${selectedDungeon}`,
    });
    navigate('/game');
  };

  return (
    <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4 md:mb-8">
      <div className="flex items-center gap-2 md:gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="text-game-accent hover:text-game-accent/80"
          onClick={() => navigate('/menu')}
        >
          <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
        </Button>
        <h1 className="text-xl md:text-3xl font-bold text-game-accent">{selectedDungeon}</h1>
      </div>
      <div className="flex flex-wrap items-center gap-2 md:gap-4">
        <span className="text-base md:text-xl font-bold text-yellow-500">🪙 {balance}</span>
        <span className="text-base md:text-xl font-bold text-purple-500">👑 Уровень {savedLevel}</span>
        <Button
          variant="destructive"
          className="bg-red-600 hover:bg-red-700 text-xs md:text-base"
          onClick={handleExitDungeon}
        >
          <DoorOpen className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" />
          {isMobile ? `Выход из ${selectedDungeon}` : `Покинуть ${selectedDungeon}`}
        </Button>
      </div>
    </div>
  );
};