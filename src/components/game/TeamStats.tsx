import React from "react";
import { Card } from "@/components/ui/card";
import { HealthBar } from "./stats/HealthBar";
import { CombatStats } from "./stats/CombatStats";
import { PlayerStats } from "@/types/battle";
import { TeamStats as TeamStatsType } from "@/types/cards";
import { calculateTeamStats } from "@/utils/cardUtils";
import { Shield, Sword, Pants, Ring, Circle, Belt } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface TeamStatsProps {
  teamStats: TeamStatsType;
}

interface EquipmentSlot {
  name: string;
  icon: React.ReactNode;
  type: string;
}

export const TeamStats = ({ teamStats }: TeamStatsProps) => {
  const [stats, setStats] = React.useState<PlayerStats>(() => {
    const savedState = localStorage.getItem('battleState');
    if (savedState) {
      const state = JSON.parse(savedState);
      return state.playerStats;
    }
    
    return {
      health: teamStats.health,
      maxHealth: teamStats.health,
      power: teamStats.power,
      defense: teamStats.defense,
      experience: 0,
      level: 1,
      requiredExperience: 100
    };
  });

  const [balance, setBalance] = React.useState(() => {
    return Number(localStorage.getItem('gameBalance') || '0');
  });

  const equipmentSlots: EquipmentSlot[] = [
    { name: "Голова", icon: <Circle className="w-5 h-5" />, type: "head" },
    { name: "Нагрудник", icon: <Shield className="w-5 h-5" />, type: "chest" },
    { name: "Наплечники", icon: <Shield className="w-5 h-5 rotate-45" />, type: "shoulders" },
    { name: "Перчатки", icon: <Circle className="w-5 h-5" />, type: "hands" },
    { name: "Ноги", icon: <Pants className="w-5 h-5" />, type: "legs" },
    { name: "Ботинки", icon: <Circle className="w-5 h-5" />, type: "feet" },
    { name: "Левая рука", icon: <Shield className="w-5 h-5" />, type: "leftHand" },
    { name: "Правая рука", icon: <Sword className="w-5 h-5" />, type: "rightHand" },
    { name: "Шея", icon: <Circle className="w-5 h-5" />, type: "neck" },
    { name: "Кольцо 1", icon: <Ring className="w-5 h-5" />, type: "ring1" },
    { name: "Кольцо 2", icon: <Ring className="w-5 h-5" />, type: "ring2" },
    { name: "Бижутерия 1", icon: <Circle className="w-5 h-5" />, type: "jewelry1" },
    { name: "Бижутерия 2", icon: <Circle className="w-5 h-5" />, type: "jewelry2" },
    { name: "Пояс", icon: <Belt className="w-5 h-5" />, type: "belt" },
  ];

  // Обновляем статистику при изменении карт
  React.useEffect(() => {
    const handleCardsUpdate = () => {
      const savedCards = localStorage.getItem('gameCards');
      if (savedCards) {
        const cards = JSON.parse(savedCards);
        const heroes = cards.filter(card => card.type === 'character');
        const pets = cards.filter(card => card.type === 'pet');
        
        // Проверяем активность питомцев
        const activePets = pets.filter(pet => {
          if (!pet.faction) return false;
          return heroes.some(hero => 
            hero.type === 'character' && 
            hero.faction === pet.faction && 
            hero.rarity >= pet.rarity
          );
        });

        // Рассчитываем статистику только для героев и активных питомцев
        const activeCards = [...heroes, ...activePets];
        const activeStats = calculateTeamStats(activeCards);

        setStats(prev => ({
          ...prev,
          health: activeStats.health,
          maxHealth: activeStats.health,
          power: activeStats.power,
          defense: activeStats.defense
        }));
      }
    };

    window.addEventListener('cardsUpdate', handleCardsUpdate);
    window.addEventListener('storage', handleCardsUpdate);

    // Инициализируем статистику при монтировании
    handleCardsUpdate();

    return () => {
      window.removeEventListener('cardsUpdate', handleCardsUpdate);
      window.removeEventListener('storage', handleCardsUpdate);
    };
  }, []);

  React.useEffect(() => {
    const handleBalanceUpdate = () => {
      const newBalance = Number(localStorage.getItem('gameBalance') || '0');
      setBalance(newBalance);
    };

    window.addEventListener('balanceUpdate', handleBalanceUpdate);
    window.addEventListener('storage', handleBalanceUpdate);

    return () => {
      window.removeEventListener('balanceUpdate', handleBalanceUpdate);
      window.removeEventListener('storage', handleBalanceUpdate);
    };
  }, []);

  return (
    <Card 
      className="p-6 bg-game-surface border-game-accent mb-6 relative overflow-hidden"
      style={{
        backgroundImage: `url("/lovable-uploads/29ea34c8-ede8-4cab-8ca2-049cdb5108c3.png")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="absolute inset-0 bg-game-surface/90 backdrop-blur-sm" />
      
      <div className="relative z-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-game-accent">Статистика команды</h2>
          <span className="text-sm text-game-accent">{balance} монет</span>
        </div>
        
        <div className="space-y-4">
          <HealthBar health={stats.health} maxHealth={stats.maxHealth} />
          <CombatStats power={stats.power} defense={stats.defense} />
          
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-game-accent mb-4">Снаряжение</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {equipmentSlots.map((slot) => (
                <TooltipProvider key={slot.type}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div 
                        className="p-3 border border-game-accent rounded-lg bg-game-surface/50 hover:bg-game-surface/70 cursor-pointer transition-colors"
                      >
                        <div className="flex flex-col items-center gap-2">
                          {slot.icon}
                          <span className="text-xs text-game-accent">{slot.name}</span>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p>Пусто</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
