import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sword } from "lucide-react";
import { motion } from "framer-motion";

interface OpponentCardProps {
  opponent: {
    id: number;
    name: string;
    power: number;
    health: number;
    maxHealth: number;
  };
  onAttack: (id: number) => void;
  isPlayerTurn: boolean;
}

export const OpponentCard = ({ opponent, onAttack, isPlayerTurn }: OpponentCardProps) => {
  return (
    <motion.div
      key={`${opponent.id}`}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      transition={{ delay: opponent.id * 0.2 }}
    >
      <Card className="p-6 bg-game-surface border-game-accent hover:border-game-primary transition-colors">
        <div className="flex flex-col gap-4">
          <h3 className="text-xl font-bold text-game-accent">
            {opponent.name}
          </h3>
          <div className="space-y-2">
            <p className="text-gray-400">Сила: {opponent.power}</p>
            <div className="w-full bg-gray-700 rounded-full h-2.5">
              <div
                className="bg-red-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${(opponent.health / opponent.maxHealth) * 100}%` }}
              ></div>
            </div>
            <p className="text-gray-400">Здоровье: {opponent.health}/{opponent.maxHealth}</p>
          </div>
          <Button
            onClick={() => onAttack(opponent.id)}
            variant="destructive"
            className="w-full"
            disabled={!isPlayerTurn}
          >
            <Sword className="w-4 h-4 mr-2" />
            Атаковать
          </Button>
        </div>
      </Card>
    </motion.div>
  );
};