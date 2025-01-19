import React from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { EnergyDisplay } from "./EnergyDisplay";
import { dungeonBackgrounds } from "@/constants/dungeons";
import { EnergyState } from "@/utils/energyManager";
import { ScrollArea } from "../ui/scroll-area";

interface DungeonSearchDialogProps {
  onClose: () => void;
  balance: number;
  selectedDungeon: string | null;
  onDungeonSelect: (dungeon: string) => void;
  energyState: EnergyState;
  timeUntilNext: number;
  isHealthTooLow: boolean;
  onEnterDungeon: () => void;
  hasActiveCards: boolean;
  dungeons: readonly string[];
}

export const DungeonSearchDialog = ({
  onClose,
  balance,
  selectedDungeon,
  onDungeonSelect,
  energyState,
  timeUntilNext,
  isHealthTooLow,
  onEnterDungeon,
  hasActiveCards,
  dungeons
}: DungeonSearchDialogProps) => {
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
          backgroundImage: selectedDungeon ? `url("${dungeonBackgrounds[selectedDungeon]}")` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        
        <div className="relative z-10">
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-4 text-game-accent hover:text-game-accent/80"
            onClick={onClose}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div className="text-center">
            <h2 className="text-2xl font-bold text-game-accent mb-6">Выбор подземелья</h2>
            
            <EnergyDisplay energyState={energyState} timeUntilNext={timeUntilNext} />
            
            <div className="mb-4">
              <p className="text-game-accent">Баланс: {balance} монет</p>
            </div>
            
            <ScrollArea className="h-48 mb-6 rounded-md border border-game-accent p-4">
              <div className="space-y-2">
                {dungeons.map((dungeon) => (
                  <Button
                    key={dungeon}
                    onClick={() => onDungeonSelect(dungeon)}
                    variant={selectedDungeon === dungeon ? "default" : "outline"}
                    className={`w-full ${
                      selectedDungeon === dungeon 
                        ? "bg-game-primary text-white" 
                        : "border-game-accent text-game-accent hover:bg-game-primary/20"
                    }`}
                  >
                    {dungeon}
                  </Button>
                ))}
              </div>
            </ScrollArea>

            <div className="space-x-4">
              <Button
                onClick={onEnterDungeon}
                disabled={!selectedDungeon || energyState.current <= 0 || isHealthTooLow || !hasActiveCards}
                className="bg-game-primary hover:bg-game-primary/80"
              >
                Войти в подземелье
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