import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { calculatePlayerDamage, calculateDamage } from '@/utils/battleCalculations';

export interface PlayerStats {
  health: number;
  maxHealth: number;
  power: number;
  defense: number;
}

export interface Opponent {
  id: number;
  name: string;
  power: number;
  health: number;
  maxHealth: number;
}

export const useBattleState = (initialLevel: number = 1) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [level, setLevel] = useState(initialLevel);
  const [coins, setCoins] = useState(0);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);

  const getScaledStats = (baseValue: number) => {
    return Math.round(baseValue * Math.pow(1.2, level - 1));
  };

  const [playerStats, setPlayerStats] = useState<PlayerStats>({
    health: 100,
    maxHealth: 100,
    power: 20,
    defense: 10,
  });

  const [opponents, setOpponents] = useState<Opponent[]>([
    { id: 1, name: "Дракон", power: 5, health: 100, maxHealth: 100 },
    { id: 2, name: "Тролль", power: 3, health: 70, maxHealth: 70 },
    { id: 3, name: "Гоблин", power: 2, health: 50, maxHealth: 50 },
  ].map(opponent => ({
    ...opponent,
    power: getScaledStats(opponent.power),
    health: getScaledStats(opponent.health),
    maxHealth: getScaledStats(opponent.health)
  })));

  const handleOpponentAttack = () => {
    if (opponents.length > 0 && !isPlayerTurn) {
      const randomOpponent = opponents[Math.floor(Math.random() * opponents.length)];
      const { blockedDamage, damageToHealth, newDefense } = calculatePlayerDamage(
        randomOpponent.power,
        playerStats.defense
      );

      setPlayerStats(prev => {
        const newHealth = Math.max(0, prev.health - damageToHealth);
        
        let message = `${randomOpponent.name} атакует с силой ${randomOpponent.power}!`;
        if (blockedDamage > 0) {
          message += ` Защита блокирует ${blockedDamage} урона.`;
        }
        if (damageToHealth > 0) {
          message += ` Нанесено ${damageToHealth} урона здоровью!`;
        }
        message += ` Защита уменьшилась на ${prev.defense - newDefense} (${prev.defense} → ${newDefense}).`;
        
        toast({
          title: "Враг атакует!",
          description: message,
        });
        
        if (newHealth <= 0) {
          toast({
            title: "Игра окончена!",
            description: "Ваш герой пал в бою!",
            variant: "destructive",
          });
          navigate("/game");
        }
        
        return {
          ...prev,
          health: newHealth,
          defense: newDefense,
        };
      });

      setIsPlayerTurn(true);
    }
  };

  const attackEnemy = (enemyId: number) => {
    if (!isPlayerTurn) return;

    setOpponents(prevOpponents => {
      const newOpponents = prevOpponents.map(opponent => {
        if (opponent.id === enemyId) {
          const { damage, isCritical } = calculateDamage(playerStats.power);
          const newHealth = opponent.health - damage;
          
          toast({
            title: isCritical ? "Критическая атака!" : "Атака!",
            description: `Вы нанесли ${isCritical ? "критические " : ""}${damage.toFixed(0)} урона ${opponent.name}!`,
            variant: isCritical ? "destructive" : "default",
          });
          
          if (newHealth <= 0) {
            const earnedCoins = Math.floor(Math.random() * 20) + 10;
            setCoins(prev => prev + earnedCoins);
            
            toast({
              title: "Враг побежден!",
              description: `Вы получили ${earnedCoins} монет!`,
            });
            return null;
          }
          
          return { ...opponent, health: newHealth };
        }
        return opponent;
      }).filter(Boolean);

      if (newOpponents.length === 0) {
        const nextLevel = level + 1;
        setLevel(nextLevel);
        toast({
          title: "Уровень пройден!",
          description: `Вы перешли на уровень ${nextLevel}! Враги стали сильнее!`,
        });

        return [
          { id: 1, name: "Дракон", power: 5, health: 100, maxHealth: 100 },
          { id: 2, name: "Тролль", power: 3, health: 70, maxHealth: 70 },
          { id: 3, name: "Гоблин", power: 2, health: 50, maxHealth: 50 },
        ].map(opponent => ({
          ...opponent,
          power: getScaledStats(opponent.power),
          health: getScaledStats(opponent.health),
          maxHealth: getScaledStats(opponent.health)
        }));
      }

      setIsPlayerTurn(false);
      return newOpponents;
    });
  };

  return {
    level,
    coins,
    isPlayerTurn,
    playerStats,
    opponents,
    attackEnemy,
    handleOpponentAttack
  };
};