import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Home, Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { OpponentCard } from "@/components/battle/OpponentCard";
import { PlayerCard } from "@/components/battle/PlayerCard";
import { PlayerCards } from "@/components/battle/PlayerCards";
import { Inventory, Item } from "@/components/battle/Inventory";

const Battle = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [level, setLevel] = useState(1);
  const [coins, setCoins] = useState(0);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [inventory, setInventory] = useState<Item[]>([]);
  
  const [playerCards] = useState([
    { id: 1, name: "Меч героя", power: 5, defense: 2 },
    { id: 2, name: "Щит стража", power: 2, defense: 8 },
    { id: 3, name: "Амулет силы", power: 3, defense: 3 },
  ]);

  const baseStats = {
    health: 100,
    maxHealth: 100,
    power: 20,
    defense: 10,
  };

  const [playerStats, setPlayerStats] = useState({
    ...baseStats,
    power: baseStats.power + playerCards.reduce((sum, card) => sum + card.power, 0),
    defense: baseStats.defense + playerCards.reduce((sum, card) => sum + card.defense, 0),
  });

  const getScaledStats = (baseValue: number) => {
    return Math.round(baseValue * Math.pow(1.2, level - 1));
  };

  const [opponents, setOpponents] = useState([
    { id: 1, name: "Дракон", power: 5, health: 100 },
    { id: 2, name: "Тролль", power: 3, health: 70 },
    { id: 3, name: "Гоблин", power: 2, health: 50 },
  ].map(opponent => ({
    ...opponent,
    power: getScaledStats(opponent.power),
    health: getScaledStats(opponent.health),
    maxHealth: getScaledStats(opponent.health)
  })));

  const generateRandomItem = (): Item => {
    const types: Item["type"][] = ["weapon", "armor", "healthPotion", "defensePotion"];
    const type = types[Math.floor(Math.random() * types.length)];
    const value = Math.floor(Math.random() * 10) + 5;
    
    const names = {
      weapon: ["Острый меч", "Боевой топор", "Копье судьбы"],
      armor: ["Кольчуга", "Латный доспех", "Щит рыцаря"],
      healthPotion: ["Зелье исцеления", "Эликсир жизни", "Бальзам"],
      defensePotion: ["Зелье защиты", "Эликсир стойкости", "Настой брони"],
    };
    
    const name = names[type][Math.floor(Math.random() * names[type].length)];
    
    return {
      id: Date.now(),
      name,
      type,
      value,
    };
  };

  const handleUseItem = (item: Item) => {
    switch (item.type) {
      case "weapon":
        setPlayerStats(prev => ({
          ...prev,
          power: prev.power + item.value
        }));
        toast({
          title: "Предмет использован",
          description: `${item.name} увеличивает силу атаки на ${item.value}`,
        });
        break;
      case "armor":
        setPlayerStats(prev => ({
          ...prev,
          defense: prev.defense + item.value
        }));
        toast({
          title: "Предмет использован",
          description: `${item.name} увеличивает защиту на ${item.value}`,
        });
        break;
      case "healthPotion":
        setPlayerStats(prev => ({
          ...prev,
          health: Math.min(prev.maxHealth, prev.health + item.value)
        }));
        toast({
          title: "Зелье использовано",
          description: `Восстановлено ${item.value} здоровья`,
        });
        break;
      case "defensePotion":
        setPlayerStats(prev => ({
          ...prev,
          defense: prev.defense + item.value
        }));
        toast({
          title: "Зелье использовано",
          description: `Восстановлено ${item.value} защиты`,
        });
        break;
    }
    
    setInventory(prev => prev.filter(i => i.id !== item.id));
    setIsPlayerTurn(false);
  };

  useEffect(() => {
    if (!isPlayerTurn && opponents.length > 0) {
      const timer = setTimeout(() => {
        const randomOpponent = opponents[Math.floor(Math.random() * opponents.length)];
        
        const damage = randomOpponent.power;
        const blockedDamage = Math.min(damage, playerStats.defense);
        const damageToHealth = Math.max(0, damage - blockedDamage);
        
        setPlayerStats(prev => {
          const newHealth = Math.max(0, prev.health - damageToHealth);
          const newDefense = Math.max(0, prev.defense - 1);
          
          let message = `${randomOpponent.name} атакует с силой ${damage}!`;
          if (blockedDamage > 0) {
            message += ` Защита блокирует ${blockedDamage} урона.`;
          }
          if (damageToHealth > 0) {
            message += ` Нанесено ${damageToHealth} урона здоровью!`;
          }
          message += ` Защита уменьшилась на 1 (${prev.defense} → ${newDefense}).`;
          
          toast({
            title: "Враг атакует!",
            description: message,
          });
          
          return {
            ...prev,
            health: newHealth,
            defense: newDefense,
          };
        });

        setIsPlayerTurn(true);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isPlayerTurn, opponents, playerStats.defense]);

  useEffect(() => {
    if (playerStats.health <= 0) {
      toast({
        title: "Игра окончена!",
        description: "Ваш герой пал в бою!",
        variant: "destructive",
      });
      navigate("/game");
    }
  }, [playerStats.health, navigate]);

  const calculateDamage = (baseDamage: number) => {
    const isCritical = Math.random() < 0.1; // 10% шанс крита
    const damage = isCritical ? baseDamage * 1.5 : baseDamage;
    return { damage, isCritical };
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
            
            if (Math.random() > 0.5) {
              const droppedItem = generateRandomItem();
              setInventory(prev => [...prev, droppedItem]);
              toast({
                title: "Предмет найден!",
                description: `${opponent.name} сбросил ${droppedItem.name}!`,
              });
            }
            
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
          { id: 1, name: "Дракон", power: 5, health: 100 },
          { id: 2, name: "Тролль", power: 3, health: 70 },
          { id: 3, name: "Гоблин", power: 2, health: 50 },
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

  return (
    <div className="min-h-screen bg-game-background p-6 relative">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-7xl mx-auto"
      >
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="text-game-accent hover:text-game-accent/80"
              onClick={() => navigate("/game")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-bold text-game-accent">Битва</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xl font-bold text-yellow-500">🪙 {coins}</span>
            <span className="text-xl font-bold text-purple-500">👑 Уровень {level}</span>
            <Button
              variant="ghost"
              size="icon"
              className="text-game-accent hover:text-game-accent/80"
              onClick={() => navigate("/")}
            >
              <Home className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <AnimatePresence>
            {opponents.map((opponent) => (
              <OpponentCard
                key={opponent.id}
                opponent={opponent}
                onAttack={attackEnemy}
                isPlayerTurn={isPlayerTurn}
              />
            ))}
          </AnimatePresence>
        </div>

        <PlayerCard playerStats={playerStats} level={level} />
        <PlayerCards cards={playerCards} />
        <Inventory items={inventory} onUseItem={handleUseItem} />
      </motion.div>

      <div className="fixed bottom-6 right-6 bg-game-surface p-4 rounded-lg border border-game-accent shadow-lg">
        <div className="flex items-center gap-2">
          <Heart className="w-6 h-6 text-red-500" />
          <span className="font-bold text-xl text-game-accent">
            {playerStats.health}/{playerStats.maxHealth}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Battle;
