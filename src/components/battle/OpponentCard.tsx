import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sword, Coins } from "lucide-react";
import { motion } from "framer-motion";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { generateLootTable, formatDropChance } from "@/utils/lootUtils";
import { useIsMobile } from "@/hooks/use-mobile";
import { StatBar } from "@/components/ui/stat-bar";

interface OpponentCardProps {
  opponent: {
    id: number;
    name: string;
    power: number;
    health: number;
    maxHealth: number;
    isBoss?: boolean;
    image?: string;
  };
  onAttack: (id: number) => void;
  isPlayerTurn: boolean;
  currentLevel: number;
  playerHealth: number;
}

export const OpponentCard = React.memo(({ opponent, onAttack, isPlayerTurn, currentLevel, playerHealth }: OpponentCardProps) => {
  const lootTable = generateLootTable(opponent.isBoss ?? false);
  const isMobile = useIsMobile();

  const isAttackDisabled = !isPlayerTurn || playerHealth <= 0;

  return (
    <motion.div
      key={`${opponent.id}`}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      transition={{ delay: opponent.id * 0.2 }}
    >
      <Card className={`p-3 md:p-6 ${opponent.isBoss ? 'bg-red-950' : 'bg-game-surface'} border-game-accent hover:border-game-primary transition-colors relative`}>
        {opponent.image && (
          <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{ backgroundImage: `url(${opponent.image})` }} />
        )}
        <div className="relative z-10">
          <div className="flex flex-col gap-2 md:gap-4">
            <HoverCard>
              <HoverCardTrigger asChild>
                <h3 className={`text-base md:text-xl font-bold ${opponent.isBoss ? 'text-red-500' : 'text-game-accent'} cursor-help truncate`}>
                  {opponent.name}
                </h3>
              </HoverCardTrigger>
              <HoverCardContent className="w-64 md:w-80">
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Возможная добыча:</h4>
                  <div className="space-y-1 text-xs md:text-sm">
                    <div className="flex items-center gap-1">
                      <Coins className="w-3 h-3 md:w-4 md:h-4" />
                      <span>{formatDropChance(lootTable.coins.chance)} ({lootTable.coins.min}-{lootTable.coins.max})</span>
                    </div>
                  </div>
                </div>
              </HoverCardContent>
            </HoverCard>
            <div className="space-y-2">
              <p className="text-sm md:text-base text-gray-400">Сила: {opponent.power}</p>
              <StatBar 
                value={opponent.health}
                maxValue={opponent.maxHealth}
                color={opponent.isBoss ? "bg-red-700" : "bg-red-600"}
                height={isMobile ? "sm" : "md"}
              />
              <p className="text-xs md:text-sm text-gray-400">HP: {opponent.health}/{opponent.maxHealth}</p>
            </div>
            <Button
              onClick={() => onAttack(opponent.id)}
              variant={opponent.isBoss ? "destructive" : "default"}
              className="w-full text-xs md:text-sm"
              disabled={isAttackDisabled}
            >
              <Sword className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
              {opponent.isBoss ? (isMobile ? "Босс" : "Атаковать босса") : (isMobile ? "Атака" : "Атаковать")}
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
});

OpponentCard.displayName = 'OpponentCard';