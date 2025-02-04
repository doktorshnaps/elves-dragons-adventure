import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useBattleState } from "@/hooks/useBattleState";
import { fixResizeObserverLoop } from "@/utils/resizeObserverFix";
import { dungeonBackgrounds } from "@/constants/dungeons";
import { BattleLayout } from "@/components/battle/components/BattleLayout";
import { BattleHeader } from "@/components/battle/components/BattleHeader";
import { OpponentsList } from "@/components/battle/components/OpponentsList";
import { NextLevelButton } from "@/components/battle/components/NextLevelButton";
import { PlayerCard } from "@/components/battle/PlayerCard";
import { Inventory } from "@/components/battle/Inventory";
import { HealthDisplay } from "@/components/battle/components/HealthDisplay";

export const Battle = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const savedState = localStorage.getItem('battleState');
  const savedData = savedState ? JSON.parse(savedState) : null;
  const selectedDungeon = savedData?.selectedDungeon;
  const savedLevel = savedData?.currentDungeonLevel || 1;
  
  const backgroundImage = selectedDungeon ? dungeonBackgrounds[selectedDungeon] : '';
  
  const {
    coins,
    isPlayerTurn,
    playerStats,
    opponents = [],
    inventory,
    attackEnemy,
    handleOpponentAttack,
    useItem,
    handleNextLevel
  } = useBattleState(savedLevel);

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

  useEffect(() => {
    if (playerStats?.health <= 0) {
      toast({
        title: "Поражение!",
        description: "Ваш герой пал в бою. Здоровье восстановлено.",
        variant: "destructive"
      });
      
      localStorage.removeItem('battleState');
      
      setTimeout(() => {
        navigate("/");
      }, 2000);
    }
  }, [playerStats?.health, navigate, toast]);

  if (!selectedDungeon) {
    return null;
  }

  return (
    <BattleLayout backgroundImage={backgroundImage}>
      <BattleHeader
        selectedDungeon={selectedDungeon}
        coins={coins}
        savedLevel={savedLevel}
        onBackToGame={handleBackToGame}
        onExitDungeon={handleExitDungeon}
      />

      <OpponentsList
        opponents={opponents}
        onAttack={attackEnemy}
        isPlayerTurn={isPlayerTurn}
        currentLevel={savedLevel}
        playerHealth={playerStats?.health || 0}
      />

      <NextLevelButton
        show={opponents.length === 0 && playerStats?.health > 0}
        onClick={handleNextLevel}
      />

      <PlayerCard playerStats={playerStats} />
      <Inventory items={inventory} onUseItem={useItem} />

      <HealthDisplay
        health={playerStats?.health || 0}
        maxHealth={playerStats?.maxHealth || 0}
      />
    </BattleLayout>
  );
};