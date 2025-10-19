import React, { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { EnergyDisplay } from "./EnergyDisplay";
import { dungeonRoutes, DungeonType } from "@/constants/dungeons";
import { EnergyState, useEnergy } from "@/utils/energyManager";
import { ActiveDungeonButton } from "./components/ActiveDungeonButton";
import { DungeonControls } from "./components/DungeonControls";
import { DungeonWarnings } from "./components/DungeonWarnings";
import { usePlayerState } from "@/hooks/usePlayerState";
import { useGameData } from "@/hooks/useGameData";
import { useDungeonSync } from "@/hooks/useDungeonSync";
import { ActiveDungeonWarning } from "./ActiveDungeonWarning";

interface DungeonSearchDialogProps {
  onClose: () => void;
  balance: number;
  selectedDungeon: DungeonType | null;
  rolling: boolean;
  energyState: EnergyState;
  timeUntilNext: number;
  isHealthTooLow: boolean;
  onRollDice: () => void;
  hasActiveCards: boolean;
}

const dungeonLevelRequirements = {
  spider_nest: 0,
  bone_dungeon: 10,
  dark_mage: 30,
  forgotten_souls: 50,
  ice_throne: 70,
  sea_serpent: 90,
  dragon_lair: 100,
  pantheon_gods: 120
};

const dungeonNames = {
  spider_nest: "Гнездо Гигантских Пауков",
  bone_dungeon: "Темница Костяных Демонов",
  dark_mage: "Лабиринт Темного Мага",
  forgotten_souls: "Пещеры Забытых Душ",
  ice_throne: "Трон Ледяного Короля",
  sea_serpent: "Логово Морского Змея",
  dragon_lair: "Логово Черного Дракона",
  pantheon_gods: "Пантеон Богов"
};

export const DungeonSearchDialog = ({
  onClose,
  balance,
  selectedDungeon,
  energyState,
  timeUntilNext,
  isHealthTooLow,
  hasActiveCards
}: DungeonSearchDialogProps) => {
  const navigate = useNavigate();
  const [activeDungeon, setActiveDungeon] = React.useState<string | null>(null);
  const { playerStats } = usePlayerState();
  const { updateGameData } = useGameData();
  const { hasOtherActiveSessions, activeSessions, startDungeonSession, endDungeonSession } = useDungeonSync();
  const [showActiveWarning, setShowActiveWarning] = useState(false);
  const [pendingDungeon, setPendingDungeon] = useState<DungeonType | null>(null);

  React.useEffect(() => {
    // Check for team battle state only (new system)
    const teamBattleState = localStorage.getItem('teamBattleState');
    const hasActiveBattle = localStorage.getItem('activeBattleInProgress') === 'true';
    
    if (teamBattleState && hasActiveBattle) {
      try {
        const state = JSON.parse(teamBattleState);
        if (state?.selectedDungeon) {
          setActiveDungeon(state.selectedDungeon);
          return;
        }
      } catch (error) {
        console.error('Error parsing teamBattleState:', error);
      }
    }
  }, []);

  const handleResetActiveBattle = async () => {
    try {
      localStorage.removeItem('teamBattleState');
      localStorage.removeItem('activeBattleInProgress');
      localStorage.removeItem('battleState'); // legacy
    } catch {}
    try { await updateGameData({ battleState: null }); } catch {}
    
    // Завершаем сессию подземелья в БД
    await endDungeonSession();
    
    setActiveDungeon(null);
    
    // Перезагружаем данные после короткой задержки
    setTimeout(() => {
      window.location.reload();
    }, 300);
  };
  const handleDungeonSelect = async (dungeonType: DungeonType) => {
    // Блокируем выбор, если на другом устройстве есть активная сессия
    if (hasOtherActiveSessions) {
      return;
    }

    // Only allow selection if no active dungeon or if it's the active dungeon
    if (!activeDungeon || activeDungeon === dungeonType) {
      // Просто переходим в подземелье, энергия и сессия создадутся при нажатии "Начать бой"
      const route = dungeonRoutes[dungeonType];
      navigate(route);
    }
  };

  const handleEndAndRestart = async () => {
    if (!pendingDungeon) return;
    
    // Завершаем активную сессию на другом устройстве
    await endDungeonSession();
    
    // Закрываем предупреждение
    setShowActiveWarning(false);
    
    // Начинаем новое подземелье
    await handleDungeonSelect(pendingDungeon);
    setPendingDungeon(null);
  };

  const canEnterDungeon = (dungeonType: DungeonType, requiredLevel: number) => {
    // Блокируем выбор, если есть активная сессия на другом устройстве
    if (hasOtherActiveSessions) {
      console.log('🚫 Cannot enter dungeon: other active sessions');
      return false;
    }

    const basicRequirements = !isHealthTooLow && hasActiveCards && energyState.current > 0;
    
    console.log(`🔍 Dungeon ${dungeonType} check:`, {
      hasActiveCards,
      energy: energyState.current,
      isHealthTooLow,
      basicRequirements,
      activeDungeon
    });
    
    // If there's an active dungeon, only allow access to that specific dungeon
    if (activeDungeon) {
      return activeDungeon === dungeonType;
    }
    
    return basicRequirements;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[100]"
    >
      <Card variant="menu" className="p-8 max-w-md w-full relative z-[500]" style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}>
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-4 top-4 text-white hover:text-white/80 z-[600]"
          onClick={onClose}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-6">
            {activeDungeon ? 'Активное подземелье' : 'Выбор подземелья'}
          </h2>
          
          <EnergyDisplay energyState={energyState} timeUntilNext={timeUntilNext} />
          
          <div className="mb-4">
            <p className="text-white">Баланс: {balance} ELL</p>
          </div>

          {hasOtherActiveSessions && (
            <div className="text-sm text-white/80 bg-yellow-500/10 border border-yellow-400/30 rounded-md p-3 mb-4">
              <p className="mb-2">На другом устройстве уже запущено подземелье. Вход заблокирован.</p>
              <Button variant="destructive" className="w-full text-xs sm:text-sm" onClick={async () => { await endDungeonSession(); }}>
                Завершить подземелье на другом устройстве
              </Button>
            </div>
          )}

          <div className="space-y-2">
            {Object.entries(dungeonLevelRequirements).map(([dungeon, requiredLevel]) => {
              const isActiveDungeon = activeDungeon === dungeon;
              const canEnter = canEnterDungeon(dungeon as DungeonType, requiredLevel);
              
              return (
                <Button
                  key={dungeon}
                  onClick={() => handleDungeonSelect(dungeon as DungeonType)}
                  disabled={!canEnter}
                  variant="menu"
                  className={`w-full relative z-[510] ${
                    isActiveDungeon 
                      ? 'bg-green-600 hover:bg-green-700 border-green-500 text-white shadow-lg shadow-green-500/50' 
                      : activeDungeon 
                        ? 'bg-black/30 border-white/30 text-white/50 cursor-not-allowed opacity-50'
                        : ''
                  }`}
                  style={!isActiveDungeon && !activeDungeon ? { boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' } : undefined}
                >
                  {dungeonNames[dungeon as keyof typeof dungeonNames]}
                  {isActiveDungeon && <span className="ml-2">⚔️</span>}
                </Button>
              );
            })}
          </div>

          {activeDungeon && (
            <div className="text-sm text-white/70 mt-4 space-y-2">
              <p>
                У вас есть активный бой в подземелье. Завершите его или сдайтесь, чтобы войти в другое подземелье.
              </p>
              <Button
                variant="destructive"
                onClick={handleResetActiveBattle}
                className="border border-red-500/40"
              >
                Сбросить активный бой
              </Button>
            </div>
          )}

          <Button
            onClick={onClose}
            variant="menu"
            className="mt-4 z-[510] relative"
            style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}
          >
            Закрыть
          </Button>

          <DungeonWarnings
            isHealthTooLow={isHealthTooLow}
            hasActiveCards={hasActiveCards}
            activeDungeon={activeDungeon}
          />
        </div>
      </Card>

      <ActiveDungeonWarning
        open={showActiveWarning}
        onContinue={() => {
          setShowActiveWarning(false);
          setPendingDungeon(null);
        }}
        onEndAndRestart={handleEndAndRestart}
        onCancel={() => {
          setShowActiveWarning(false);
          setPendingDungeon(null);
        }}
        activeSessions={activeSessions}
      />
    </motion.div>
  );
};