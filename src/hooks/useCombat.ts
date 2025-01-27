import { useState, useEffect } from "react";
import { PlayerStats, Opponent } from "@/types/battle";
import { calculateDamage } from "@/utils/battleCalculations";
import { useToast } from "./use-toast";

interface UseCombatProps {
  playerStats: PlayerStats;
  setPlayerStats: (stats: PlayerStats) => void;
  opponents: Opponent[];
  level: number;
}

export const useCombat = ({
  playerStats,
  setPlayerStats,
  opponents,
  level
}: UseCombatProps) => {
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const { toast } = useToast();

  const attackEnemy = (enemyIndex: number) => {
    if (!isPlayerTurn || !opponents[enemyIndex]) return;

    const { damage } = calculateDamage(playerStats.power);
    
    if (damage > 0) {
      toast({
        title: "Атака!",
        description: `Вы нанесли ${damage} урона`,
      });
    }

    setIsPlayerTurn(false);
  };

  const handleOpponentAttack = () => {
    if (isPlayerTurn) return;

    const activeOpponents = opponents.filter(opp => opp.health > 0);
    if (activeOpponents.length === 0) {
      setIsPlayerTurn(true);
      return;
    }

    const attacker = activeOpponents[Math.floor(Math.random() * activeOpponents.length)];
    const { damage } = calculateDamage(attacker.power);

    if (damage > 0) {
      setPlayerStats({
        ...playerStats,
        health: Math.max(0, playerStats.health - damage)
      });

      toast({
        title: "Получен урон!",
        description: `Враг нанес ${damage} урона`,
      });
    }

    setIsPlayerTurn(true);
  };

  useEffect(() => {
    if (!isPlayerTurn) {
      const timer = setTimeout(handleOpponentAttack, 1000);
      return () => clearTimeout(timer);
    }
  }, [isPlayerTurn]);

  return {
    isPlayerTurn,
    attackEnemy,
    handleOpponentAttack
  };
};