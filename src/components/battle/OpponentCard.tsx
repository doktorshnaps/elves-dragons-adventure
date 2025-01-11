import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sword, Coins, Star } from "lucide-react";
import { motion } from "framer-motion";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { generateLootTable, formatDropChance } from "@/utils/lootUtils";
import { getExperienceReward } from "@/utils/experienceManager";
import { useIsMobile } from "@/hooks/use-mobile";

interface OpponentCardProps {
  opponent: {
    id: number;
    name: string;
    power: number;
    health: number;
    maxHealth: number;
    isBoss?: boolean;
  };
  onAttack: (id: number) => void;
  isPlayerTurn: boolean;
  currentLevel: number;
  playerHealth: number;
}

export const OpponentCard = ({ opponent, onAttack, isPlayerTurn, currentLevel, playerHealth }: OpponentCardProps) => {
  const lootTable = generateLootTable(opponent.isBoss ?? false);
  const experienceReward = getExperienceReward(currentLevel, opponent.isBoss ?? false);
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
      <Card className={`p-3 md:p-6 ${opponent.isBoss ? 'bg-red-950' : 'bg-game-surface'} border-game-accent hover:border-game-primary transition-colors`}>
        <div className="flex flex-col gap-2 md:gap-4">
          <HoverCard>
            <HoverCardTrigger asChild>
              <h3 className={`text-base md:text-xl font-bold ${opponent.isBoss ? 'text-red-500' : 'text-game-accent'} cursor-help truncate`}>
                {opponent.name}
              </h3>
            </HoverCardTrigger>
            <HoverCardContent className="w-64 md:w-80">
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="font-semibold text-sm">Опыт: {experienceReward}</span>
                </div>
                <h4 className="font-semibold text-sm">Возможная добыча:</h4>
                <div className="space-y-1 text-xs md:text-sm">
                  <p>🧪 Зелье здоровья: {formatDropChance(lootTable.healthPotion)}</p>
                  <p>🛡️ Зелье защиты: {formatDropChance(lootTable.defensePotion)}</p>
                  <p>⚔️ Оружие: {formatDropChance(lootTable.weapon)}</p>
                  <p>🛡️ Броня: {formatDropChance(lootTable.armor)}</p>
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
            <div className="w-full bg-gray-700 rounded-full h-1.5 md:h-2.5">
              <div
                className={`${opponent.isBoss ? 'bg-red-700' : 'bg-red-600'} h-1.5 md:h-2.5 rounded-full transition-all duration-300`}
                style={{ width: `${(opponent.health / opponent.maxHealth) * 100}%` }}
              ></div>
            </div>
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
      </Card>
    </motion.div>
  );
};