
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useGameData } from "@/hooks/useGameData";
import { AdventureLayout } from "./components/AdventureLayout";
import { InventoryDisplay } from "@/components/game/InventoryDisplay";
import { useMonsterGeneration } from "./useMonsterGeneration";
import { Item } from "@/types/inventory";
import { Monster } from "./types";
import { GameHeader } from "./components/GameHeader";
import { GameContent } from "./components/GameContent";
import { usePlayerStats } from "./game/hooks/usePlayerStats";
import { addAccountExperience } from '@/utils/accountLeveling';
import { useGameStore } from '@/stores/gameStore';
import { useCardInstances } from '@/hooks/useCardInstances';
import { useItemInstances } from '@/hooks/useItemInstances';

export const AdventuresTab = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { gameData, updateGameData } = useGameData();
  const balance = gameData.balance;
  const { generateMonster } = useMonsterGeneration(1);
  const { stats: playerStats, updateStats: setPlayerStats, addExperience } = usePlayerStats();
  const { accountLevel, accountExperience, addAccountExperience: addAccountExp } = useGameStore();
  const { incrementMonsterKills } = useCardInstances();
  const { removeItemInstancesByIds, getInstancesByItemId } = useItemInstances();

  // Adventure монстр - чисто локальное состояние, не нужно сохранять в localStorage
  // При перезагрузке страницы просто генерируется новый монстр
  const [currentMonster, setCurrentMonster] = useState<Monster | null>(null);

  const startAdventure = () => {
    if (playerStats.health <= 0) return;
    const monster = generateMonster();
    setCurrentMonster(monster);
  };

  const handleMonsterDefeat = async (monster: Monster) => {
    if (!monster || playerStats.health <= 0) return;

    const damage = Math.max(0, playerStats.power - Math.floor(Math.random() * 3));
    const newMonsterHealth = monster.health - damage;

    if (newMonsterHealth <= 0) {
      await updateGameData({ balance: balance + monster.reward });
      addExperience(monster.experienceReward);
      
      // Инкремент убийств монстров для всех карт в команде
      const selectedTeam = gameData.selectedTeam || [];
      console.log('Selected team for monster kills:', selectedTeam);
      for (const pair of selectedTeam) {
        if (pair?.hero?.id) {
          const result = await incrementMonsterKills(pair.hero.id);
          console.log(`Hero ${pair.hero.id} monster kill increment result:`, result);
        }
        if (pair?.dragon?.id) {
          const result = await incrementMonsterKills(pair.dragon.id);
          console.log(`Dragon ${pair.dragon.id} monster kill increment result:`, result);
        }
      }
      
      // Добавляем опыт аккаунта за убийство монстра
      // 50 exp за обычного монстра, 200 exp за босса
      const accountExpReward = monster.isBoss ? 200 : 50;
      const experienceResult = addAccountExperience(accountExperience, accountExpReward);
      
      addAccountExp(accountExpReward);
      
      if (experienceResult.leveledUp) {
        toast({
          title: "Победа! Уровень аккаунта повышен!",
          description: `Получено ${monster.reward} ELL, ${monster.experienceReward} опыта героя и ${accountExpReward} опыта аккаунта! Достигнут ${experienceResult.newLevel} уровень аккаунта!`
        });
      } else {
        toast({
          title: "Победа!",
          description: `Получено ${monster.reward} ELL, ${monster.experienceReward} опыта героя и ${accountExpReward} опыта аккаунта!`
        });
      }
      
      if (playerStats.health > 0) {
        const newMonster = generateMonster();
        setCurrentMonster(newMonster);
      } else {
        setCurrentMonster(null);
      }
      return;
    }

    const monsterDamage = Math.max(0, monster.power - Math.floor(playerStats.defense / 2));
    const newPlayerHealth = playerStats.health - monsterDamage;

    if (newPlayerHealth <= 0) {
      toast({
        title: "Поражение!",
        description: "Вы проиграли бой...",
        variant: "destructive"
      });
      setPlayerStats(prev => ({ ...prev, health: 0 }));
      setCurrentMonster(null);
      
      setTimeout(() => {
        navigate('/menu');
      }, 2000);
      
      return;
    }

    setCurrentMonster({ ...monster, health: newMonsterHealth });
    setPlayerStats(prev => ({ ...prev, health: newPlayerHealth }));
  };

  const handleUseItem = async (item: Item) => {
    if (item.type === "healthPotion") {
      const newHealth = Math.min(playerStats.maxHealth, playerStats.health + item.value);
      setPlayerStats(prev => ({
        ...prev,
        health: newHealth
      }));
      
      toast({
        title: "Зелье использовано",
        description: `Восстановлено ${item.value} здоровья`
      });

      // Удаляем предмет из item_instances
      await removeItemInstancesByIds([item.id]);
    }
  };

  const handleSellItem = async (item: Item) => {
    await updateGameData({ balance: balance + 10 });
    await removeItemInstancesByIds([item.id]);
    
    toast({
      title: "Предмет продан",
      description: "Получено 10 ELL"
    });
  };

  useEffect(() => {
    if (!currentMonster && playerStats.health > 0) {
      startAdventure();
    }
  }, [currentMonster, playerStats.health]);

  return (
    <AdventureLayout>
      <div className="max-w-4xl mx-auto">
        <GameHeader 
          balance={balance} 
          onBack={() => navigate('/menu')} 
        />

        <GameContent
          currentMonster={currentMonster}
          onMonsterDefeat={handleMonsterDefeat}
          playerStats={playerStats}
          onStartAdventure={startAdventure}
        />

        <div className="mt-6">
          <InventoryDisplay 
            showOnlyPotions={false} 
            onUseItem={handleUseItem}
            onSellItem={handleSellItem}
          />
        </div>
      </div>
    </AdventureLayout>
  );
};
