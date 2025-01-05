import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Home, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OpponentCard } from "@/components/battle/OpponentCard";
import { PlayerCard } from "@/components/battle/PlayerCard";
import { PlayerCards } from "@/components/battle/PlayerCards";
import { Inventory, Item } from "@/components/battle/Inventory";
import { useBattleState } from "@/hooks/useBattleState";
import { useToast } from "@/hooks/use-toast";

const Battle = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    level,
    coins,
    isPlayerTurn,
    playerStats,
    opponents,
    attackEnemy,
    handleOpponentAttack
  } = useBattleState();

  useEffect(() => {
    if (!isPlayerTurn) {
      handleOpponentAttack();
    }
  }, [isPlayerTurn]);

  const [playerCards] = React.useState([
    { id: 1, name: "Меч героя", power: 5, defense: 2 },
    { id: 2, name: "Щит стража", power: 2, defense: 8 },
    { id: 3, name: "Амулет силы", power: 3, defense: 3 },
  ]);

  // Добавляем начальные предметы инвентаря
  const [inventoryItems] = React.useState<Item[]>([
    { id: 1, name: "Зелье здоровья", type: "healthPotion", value: 30 },
    { id: 2, name: "Зелье здоровья", type: "healthPotion", value: 30 },
    { id: 3, name: "Зелье защиты", type: "defensePotion", value: 20 },
    { id: 4, name: "Меч воина", type: "weapon", value: 15 },
  ]);

  const handleUseItem = (item: Item) => {
    switch (item.type) {
      case "healthPotion":
        toast({
          title: "Использовано зелье здоровья",
          description: `Восстановлено ${item.value} здоровья`,
        });
        break;
      case "defensePotion":
        toast({
          title: "Использовано зелье защиты",
          description: `Восстановлено ${item.value} защиты`,
        });
        break;
      case "weapon":
        toast({
          title: "Использовано оружие",
          description: `Увеличена сила атаки на ${item.value}`,
        });
        break;
      case "armor":
        toast({
          title: "Использована броня",
          description: `Увеличена защита на ${item.value}`,
        });
        break;
    }
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
          {opponents.map((opponent) => (
            <OpponentCard
              key={opponent.id}
              opponent={opponent}
              onAttack={attackEnemy}
              isPlayerTurn={isPlayerTurn}
            />
          ))}
        </div>

        <PlayerCard playerStats={playerStats} level={level} />
        <PlayerCards cards={playerCards} />
        <Inventory items={inventoryItems} onUseItem={handleUseItem} />

        <div className="fixed bottom-6 right-6 bg-game-surface p-4 rounded-lg border border-game-accent shadow-lg">
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-red-500" />
            <span className="font-bold text-xl text-game-accent">
              {playerStats.health}/{playerStats.maxHealth}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Battle;