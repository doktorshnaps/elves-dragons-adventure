import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coins, Sword } from "lucide-react";
import { motion } from "framer-motion";
import { Monster } from "./types";

interface MonsterCardProps {
  monster: Monster;
  onAttack: () => void;
  playerHealth: number;
}

export const MonsterCard = ({ monster, onAttack, playerHealth }: MonsterCardProps) => {
  const healthPercentage = (monster.health / monster.maxHealth) * 100;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className="p-6 bg-game-surface border-game-accent">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-game-accent">{monster.name}</h3>
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4" />
              <span>{monster.reward}</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Сила: {monster.power}</span>
              <span>HP: {Math.ceil(monster.health)}/{monster.maxHealth}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2.5">
              <div
                className="bg-red-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${Math.max(0, Math.min(healthPercentage, 100))}%` }}
              />
            </div>
          </div>

          <Button 
            className="w-full"
            onClick={onAttack}
            disabled={playerHealth <= 0}
          >
            <Sword className="w-4 h-4 mr-2" />
            Атаковать
          </Button>
        </div>
      </Card>
    </motion.div>
  );
};