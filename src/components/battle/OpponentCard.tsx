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
}

export const OpponentCard = ({ opponent, onAttack, isPlayerTurn, currentLevel }: OpponentCardProps) => {
  const lootTable = generateLootTable(opponent.isBoss ?? false);
  const experienceReward = getExperienceReward(currentLevel, opponent.isBoss ?? false);

  return (
    <motion.div
      key={`${opponent.id}`}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      transition={{ delay: opponent.id * 0.2 }}
    >
      <Card className={`p-6 ${opponent.isBoss ? 'bg-red-950' : 'bg-game-surface'} border-game-accent hover:border-game-primary transition-colors`}>
        <div className="flex flex-col gap-4">
          <HoverCard>
            <HoverCardTrigger asChild>
              <h3 className={`text-xl font-bold ${opponent.isBoss ? 'text-red-500' : 'text-game-accent'} cursor-help`}>
                {opponent.name}
              </h3>
            </HoverCardTrigger>
            <HoverCardContent className="w-80">
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="font-semibold">Опыт за убийство: {experienceReward}</span>
                </div>
                <h4 className="font-semibold">Шанс выпадения предметов:</h4>
                <div className="space-y-1">
                  <p className="text-sm">🧪 Зелье здоровья: {formatDropChance(lootTable.healthPotion)}</p>
                  <p className="text-sm">🛡️ Зелье защиты: {formatDropChance(lootTable.defensePotion)}</p>
                  <p className="text-sm">⚔️ Оружие: {formatDropChance(lootTable.weapon)}</p>
                  <p className="text-sm">🛡️ Броня: {formatDropChance(lootTable.armor)}</p>
                  <div className="flex items-center gap-1 text-sm">
                    <Coins className="w-4 h-4" />
                    <span>{formatDropChance(lootTable.coins.chance)} ({lootTable.coins.min}-{lootTable.coins.max})</span>
                  </div>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
          <div className="space-y-2">
            <p className="text-gray-400">Сила: {opponent.power}</p>
            <div className="w-full bg-gray-700 rounded-full h-2.5">
              <div
                className={`${opponent.isBoss ? 'bg-red-700' : 'bg-red-600'} h-2.5 rounded-full transition-all duration-300`}
                style={{ width: `${(opponent.health / opponent.maxHealth) * 100}%` }}
              ></div>
            </div>
            <p className="text-gray-400">Здоровье: {opponent.health}/{opponent.maxHealth}</p>
          </div>
          <Button
            onClick={() => onAttack(opponent.id)}
            variant={opponent.isBoss ? "destructive" : "default"}
            className="w-full"
            disabled={!isPlayerTurn}
          >
            <Sword className="w-4 h-4 mr-2" />
            {opponent.isBoss ? "Атаковать босса" : "Атаковать"}
          </Button>
        </div>
      </Card>
    </motion.div>
  );
};