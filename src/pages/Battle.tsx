import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Home, Heart, DoorOpen, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OpponentCard } from "@/components/battle/OpponentCard";
import { PlayerCard } from "@/components/battle/PlayerCard";
import { PlayerCards } from "@/components/battle/PlayerCards";
import { Inventory } from "@/components/battle/Inventory";
import { LevelUpDialog } from "@/components/battle/LevelUpDialog";
import { useBattleState } from "@/hooks/useBattleState";
import { useToast } from "@/hooks/use-toast";

const Battle = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const currentLevel = parseInt(searchParams.get("level") || "1", 10);

  const {
    coins,
    isPlayerTurn,
    playerStats,
    opponents = [],
    inventory,
    showLevelUp,
    attackEnemy,
    handleOpponentAttack,
    useItem,
    handleUpgrade,
    handleNextLevel
  } = useBattleState(currentLevel);

  useEffect(() => {
    if (!isPlayerTurn) {
      handleOpponentAttack();
    }
  }, [isPlayerTurn, handleOpponentAttack]);

  const handleExitDungeon = () => {
    localStorage.removeItem('battleState');
    toast({
      title: "Подземелье покинуто",
      description: "Вы покинули подземелье. Весь прогресс сброшен.",
    });
    navigate("/game");
  };

  // Определяем, когда показывать кнопку следующего уровня
  const showNextLevelButton = opponents.length === 0 && playerStats?.health > 0;

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
            <span className="text-xl font-bold text-purple-500">👑 Уровень {currentLevel}</span>
            <Button
              variant="destructive"
              className="bg-red-600 hover:bg-red-700"
              onClick={handleExitDungeon}
            >
              <DoorOpen className="h-5 w-5 mr-2" />
              Покинуть подземелье
            </Button>
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

        {showNextLevelButton && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center mb-8"
          >
            <Button
              variant="default"
              size="lg"
              onClick={handleNextLevel}
              className="bg-green-600 hover:bg-green-700 text-white font-bold"
            >
              <ArrowRight className="h-5 w-5 mr-2" />
              Перейти на следующий уровень
            </Button>
          </motion.div>
        )}

        <PlayerCard playerStats={playerStats} />
        <PlayerCards cards={[
          { id: 1, name: "Меч героя", power: 5, defense: 2 },
          { id: 2, name: "Щит стража", power: 2, defense: 8 },
          { id: 3, name: "Амулет силы", power: 3, defense: 3 },
        ]} />
        <Inventory items={inventory} onUseItem={useItem} />

        <LevelUpDialog
          isOpen={showLevelUp}
          onUpgradeSelect={handleUpgrade}
        />

        <div className="fixed bottom-6 right-6 bg-game-surface p-4 rounded-lg border border-game-accent shadow-lg">
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-red-500" />
            <span className="font-bold text-xl text-game-accent">
              {playerStats?.health}/{playerStats?.maxHealth}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Battle;