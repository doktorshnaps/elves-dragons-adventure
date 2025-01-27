import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, DoorOpen, Heart, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OpponentCard } from "@/components/battle/OpponentCard";
import { PlayerCard } from "@/components/battle/PlayerCard";
import { Inventory } from "@/components/battle/Inventory";
import { useToast } from "@/hooks/use-toast";
import { useBattleState } from "@/hooks/useBattleState";
import { fixResizeObserverLoop } from "@/utils/resizeObserverFix";
import { useIsMobile } from "@/hooks/use-mobile";
import { dungeonBackgrounds } from "@/constants/dungeons";
import { Item } from "@/types/inventory";
import { applyItemEffect } from "@/utils/itemUtils";

const Battle = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const savedState = localStorage.getItem('battleState');
  const savedData = savedState ? JSON.parse(savedState) : null;
  const selectedDungeon = savedData?.selectedDungeon;
  const savedLevel = savedData?.currentDungeonLevel || 1;
  
  const backgroundImage = selectedDungeon ? dungeonBackgrounds[selectedDungeon] : '';
  
  const {
    coins,
    isPlayerTurn,
    playerStats,
    setPlayerStats,
    opponents = [],
    inventory,
    attackEnemy,
    handleOpponentAttack,
    useItem: removeItem,
    handleNextLevel
  } = useBattleState(savedLevel);

  const useItem = (item: Item) => {
    if (!playerStats) return;

    const newStats = applyItemEffect(item, playerStats);
    setPlayerStats(newStats);
    removeItem(item);

    let effectDescription = "";
    switch (item.name) {
      case "Зелье здоровья":
        effectDescription = `Восстановлено ${item.value} здоровья`;
        break;
      case "Зелье защиты":
        effectDescription = `Увеличена защита на ${item.value}`;
        break;
      case "Старый железный меч":
        effectDescription = `Увеличена сила на ${item.value}`;
        break;
      case "Кожаная броня":
        effectDescription = `Увеличена защита на ${item.value}`;
        break;
    }

    toast({
      title: "Предмет использован",
      description: effectDescription,
    });
  };

  useEffect(() => {
    fixResizeObserverLoop();
  }, []);

  useEffect(() => {
    if (!isPlayerTurn && playerStats?.health > 0) {
      handleOpponentAttack();
    }
  }, [isPlayerTurn, handleOpponentAttack, playerStats?.health]);

  useEffect(() => {
    const battleState = localStorage.getItem('battleState');
    if (!battleState) {
      toast({
        title: "Ошибка",
        description: "Подземелье не выбрано. Вернитесь на главную страницу и выберите подземелье.",
        variant: "destructive"
      });
      navigate("/game");
      return;
    }

    const state = JSON.parse(battleState);
    if (!state.selectedDungeon || state.playerStats.health <= 0) {
      localStorage.removeItem('battleState');
      navigate("/game");
    }
  }, [selectedDungeon, navigate, toast]);

  const handleExitDungeon = () => {
    const battleState = localStorage.getItem('battleState');
    if (battleState) {
      const state = JSON.parse(battleState);
      if (state.playerStats.health > 0) {
        toast({
          title: "Подземелье покинуто",
          description: `Вы покинули ${selectedDungeon}. Весь прогресс сброшен.`,
        });
      }
      localStorage.removeItem('battleState');
    }
    navigate("/game");
  };

  const handleBackToGame = () => {
    const battleState = localStorage.getItem('battleState');
    if (battleState) {
      const state = JSON.parse(battleState);
      if (state.playerStats.health > 0) {
        navigate("/game");
      } else {
        localStorage.removeItem('battleState');
        navigate("/game");
      }
    } else {
      navigate("/game");
    }
  };

  const showNextLevelButton = opponents.length === 0 && playerStats?.health > 0;

  useEffect(() => {
    if (playerStats?.health <= 0) {
      toast({
        title: "Поражение!",
        description: "Ваш герой пал в бою. Здоровье восстановлено.",
        variant: "destructive"
      });
      
      localStorage.removeItem('battleState');
      
      setTimeout(() => {
        navigate("/game");
      }, 2000);
    }
  }, [playerStats?.health, navigate, toast]);

  return (
    <div 
      className="min-h-screen bg-game-background p-2 md:p-6 relative"
      style={{
        backgroundImage: backgroundImage ? `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url(${backgroundImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-7xl mx-auto"
      >
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4 md:mb-8">
          <div className="flex items-center gap-2 md:gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="text-game-accent hover:text-game-accent/80"
              onClick={handleBackToGame}
            >
              <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
            <h1 className="text-xl md:text-3xl font-bold text-game-accent">{selectedDungeon}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2 md:gap-4">
            <span className="text-base md:text-xl font-bold text-yellow-500">🪙 {coins}</span>
            <span className="text-base md:text-xl font-bold text-purple-500">👑 Уровень {savedLevel}</span>
            <Button
              variant="destructive"
              className="bg-red-600 hover:bg-red-700 text-xs md:text-base"
              onClick={handleExitDungeon}
            >
              <DoorOpen className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" />
              {isMobile ? `Выход из ${selectedDungeon}` : `Покинуть ${selectedDungeon}`}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 mb-4 md:mb-8">
          {opponents.map((opponent) => (
            <OpponentCard
              key={opponent.id}
              opponent={opponent}
              onAttack={attackEnemy}
              isPlayerTurn={isPlayerTurn}
              currentLevel={savedLevel}
              playerHealth={playerStats?.health || 0}
            />
          ))}
        </div>

        {showNextLevelButton && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center mb-4 md:mb-8"
          >
            <Button
              variant="default"
              size={isMobile ? "default" : "lg"}
              onClick={handleNextLevel}
              className="bg-green-600 hover:bg-green-700 text-white font-bold text-sm md:text-base"
            >
              <ArrowRight className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" />
              {isMobile ? "Следующий уровень" : "Перейти на следующий уровень"}
            </Button>
          </motion.div>
        )}

        <PlayerCard playerStats={playerStats} />
        <Inventory items={inventory} onUseItem={useItem} />

        <div className="fixed bottom-2 md:bottom-6 right-2 md:right-6 bg-game-surface p-2 md:p-4 rounded-lg border border-game-accent shadow-lg">
          <div className="flex items-center gap-1 md:gap-2">
            <Heart className="w-4 h-4 md:w-6 md:h-6 text-red-500" />
            <span className="font-bold text-base md:text-xl text-game-accent">
              {Math.floor(playerStats?.health || 0)}/{playerStats?.maxHealth}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Battle;
