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
  isBoss?: boolean;
}

export const useBattleState = (initialLevel: number = 1) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [level, setLevel] = useState(initialLevel);
  const [coins, setCoins] = useState(0);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);

  const getScaledStats = (baseValue: number, isBoss: boolean = false) => {
    const levelScale = Math.pow(1.2, level - 1);
    const bossMultiplier = isBoss ? 3 : 1;
    return Math.round(baseValue * levelScale * bossMultiplier);
  };

  const generateOpponents = (currentLevel: number): Opponent[] => {
    const isBossWave = currentLevel % 5 === 0;
    
    if (isBossWave) {
      return [{
        id: 1,
        name: "🔥 Босс Древний Дракон",
        power: getScaledStats(10, true),
        health: getScaledStats(200, true),
        maxHealth: getScaledStats(200, true),
        isBoss: true
      }];
    }

    return [
      { 
        id: 1, 
        name: "Дракон", 
        power: getScaledStats(5), 
        health: getScaledStats(100),
        maxHealth: getScaledStats(100)
      },
      { 
        id: 2, 
        name: "Тролль", 
        power: getScaledStats(3),
        health: getScaledStats(70),
        maxHealth: getScaledStats(70)
      },
      { 
        id: 3, 
        name: "Гоблин", 
        power: getScaledStats(2),
        health: getScaledStats(50),
        maxHealth: getScaledStats(50)
      },
    ];
  };

  const [playerStats, setPlayerStats] = useState<PlayerStats>({
    health: 100,
    maxHealth: 100,
    power: 20,
    defense: 10,
  });

  const [opponents, setOpponents] = useState<Opponent[]>(generateOpponents(initialLevel));

  const updatePlayerStats = (newStats: PlayerStats) => {
    setPlayerStats(newStats);
  };

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
          title: randomOpponent.isBoss ? "⚠️ Атака босса!" : "Враг атакует!",
          description: message,
          variant: randomOpponent.isBoss ? "destructive" : "default"
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
            title: opponent.isBoss ? 
              (isCritical ? "🎯 Критический удар по боссу!" : "⚔️ Атака босса!") :
              (isCritical ? "Критическая атака!" : "Атака!"),
            description: `Вы нанесли ${isCritical ? "критические " : ""}${damage.toFixed(0)} урона ${opponent.name}!`,
            variant: isCritical ? "destructive" : "default",
          });
          
          if (newHealth <= 0) {
            const baseCoins = Math.floor(Math.random() * 20) + 10;
            const earnedCoins = opponent.isBoss ? baseCoins * 5 : baseCoins;
            setCoins(prev => prev + earnedCoins);
            
            toast({
              title: opponent.isBoss ? "🏆 Босс побежден!" : "Враг побежден!",
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
        
        const isBossDefeated = prevOpponents.some(op => op.isBoss);
        toast({
          title: isBossDefeated ? "🎊 Босс побежден! Новый уровень!" : "Уровень пройден!",
          description: `Вы перешли на уровень ${nextLevel}! ${nextLevel % 5 === 0 ? "Приготовьтесь к битве с боссом!" : ""}`,
        });

        return generateOpponents(nextLevel);
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
    handleOpponentAttack,
    updatePlayerStats
  };
};