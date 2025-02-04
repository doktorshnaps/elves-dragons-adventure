import React from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { EnergyDisplay } from "./EnergyDisplay";
import { DungeonDisplay } from "./DungeonDisplay";
import { dungeonBackgrounds, DungeonType } from "@/constants/dungeons";
import { EnergyState } from "@/utils/energyManager";

interface DungeonSearchDialogProps {
  onClose: () => void;
  balance: number;
  selectedDungeon: DungeonType | null;
  rolling: boolean;
  energyState: EnergyState;
  timeUntilNext: number;
  isHealthTooLow: boolean;
  onRollDice: () => void;
  hasActiveCards: boolean;
}

export const DungeonSearchDialog = ({
  onClose,
  balance,
  selectedDungeon,
  rolling,
  energyState,
  timeUntilNext,
  isHealthTooLow,
  onRollDice,
  hasActiveCards
}: DungeonSearchDialogProps) => {
  const backgroundImage = selectedDungeon ? dungeonBackgrounds[selectedDungeon] : '';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[100]"
    >
      <Card 
        className="bg-game-surface border-game-accent p-8 max-w-md w-full relative overflow-hidden"
        style={{
          backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          touchAction: 'pan-y',
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain'
        }}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        
        <div 
          className="relative z-10 max-h-[80vh] overflow-y-auto"
          style={{ 
            touchAction: 'pan-y',
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
            msOverflowStyle: '-ms-autohiding-scrollbar',
            scrollBehavior: 'smooth',
            WebkitUserSelect: 'none',
            userSelect: 'none'
          }}
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-4 text-game-accent hover:text-game-accent/80"
            onClick={onClose}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div className="text-center">
            <h2 className="text-2xl font-bold text-game-accent mb-6">Поиск подземелья</h2>
            
            <EnergyDisplay energyState={energyState} timeUntilNext={timeUntilNext} />
            
            <div className="mb-4">
              <p className="text-game-accent">Баланс: {balance} монет</p>
            </div>
            
            <DungeonDisplay rolling={rolling} selectedDungeon={selectedDungeon} />

            <div className="space-x-4">
              <Button
                onClick={onRollDice}
                disabled={rolling || energyState.current <= 0 || isHealthTooLow || !hasActiveCards}
                className="bg-game-primary hover:bg-game-primary/80"
              >
                {rolling ? "Поиск подземелья..." : "Искать подземелье"}
              </Button>
              <Button
                onClick={onClose}
                variant="outline"
                className="border-game-accent text-game-accent"
              >
                Закрыть
              </Button>
            </div>
            
            {isHealthTooLow && (
              <p className="text-red-500 mt-4">
                Здоровье слишком низкое для входа в подземелье
              </p>
            )}

            {!hasActiveCards && (
              <p className="text-red-500 mt-4">
                У вас нет активных карт героев или питомцев
              </p>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
};