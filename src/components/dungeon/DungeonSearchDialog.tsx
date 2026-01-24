import React, { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { EnergyDisplay } from "./EnergyDisplay";
import { dungeonRoutes, DungeonType, dungeonLevelRanges } from "@/constants/dungeons";
import { EnergyState, useEnergy } from "@/utils/energyManager";
import { ActiveDungeonButton } from "./components/ActiveDungeonButton";
import { DungeonControls } from "./components/DungeonControls";
import { DungeonWarnings } from "./components/DungeonWarnings";
import { usePlayerState } from "@/hooks/usePlayerState";
import { useGameData } from "@/hooks/useGameData";
import { useDungeonSync } from "@/hooks/useDungeonSync";
import { ActiveDungeonWarning } from "./ActiveDungeonWarning";
import { useGameStore } from "@/stores/gameStore";
import { useLanguage } from "@/hooks/useLanguage";
import { t } from "@/utils/translations";
import { clearActiveBattle } from "@/utils/activeBattleChecker";
import { useWalletContext } from "@/contexts/WalletConnectContext";
import { useQueryClient } from "@tanstack/react-query";

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
  spider_nest: 1,
  bone_dungeon: 15,
  dark_mage: 30,
  forgotten_souls: 40,
  ice_throne: 50,
  sea_serpent: 65,
  dragon_lair: 80,
  pantheon_gods: 90
};

const getDungeonName = (dungeon: DungeonType, lang: string) => {
  const keys: Record<DungeonType, string> = {
    spider_nest: 'dungeonSearch.spiderNest',
    bone_dungeon: 'dungeonSearch.boneDungeon',
    dark_mage: 'dungeonSearch.darkMage',
    forgotten_souls: 'dungeonSearch.forgottenSouls',
    ice_throne: 'dungeonSearch.iceThrone',
    sea_serpent: 'dungeonSearch.seaSerpent',
    dragon_lair: 'dungeonSearch.dragonLair',
    pantheon_gods: 'dungeonSearch.pantheonGods'
  };
  return t(lang as any, keys[dungeon]);
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
  console.log('🎯 [DungeonSearchDialog] Received props:', {
    hasActiveCards,
    isHealthTooLow,
    energyState,
    balance
  });
  
  const { language } = useLanguage();
  const navigate = useNavigate();
  const teamBattleState = useGameStore((state) => state.teamBattleState);
  const accountLevel = useGameStore((state) => state.accountLevel);
  
  const [activeDungeon, setActiveDungeon] = React.useState<string | null>(null);
  const { playerStats } = usePlayerState();
  const { updateGameData } = useGameData();
  const { hasOtherActiveSessions, hasAnyActiveSession, allActiveSessions, activeSessions, startDungeonSession, endDungeonSession } = useDungeonSync();
  const { accountId } = useWalletContext();
  const queryClient = useQueryClient();
  const [showActiveWarning, setShowActiveWarning] = useState(false);
  const [pendingDungeon, setPendingDungeon] = useState<DungeonType | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  React.useEffect(() => {
    // 1. Проверяем состояние из Zustand store (единственный источник истины)
    if (teamBattleState?.selectedDungeon) {
      setActiveDungeon(teamBattleState.selectedDungeon);
      return;
    }
    
    // 2. Проверяем активную сессию из БД через localStorage (синхронизируется через useDungeonSync)
    try {
      const localSession = localStorage.getItem('activeDungeonSession');
      if (localSession) {
        const parsed = JSON.parse(localSession);
        if (parsed?.dungeon_type) {
          setActiveDungeon(parsed.dungeon_type);
          return;
        }
      }
    } catch (e) {
      console.error('Error parsing activeDungeonSession from localStorage:', e);
    }
    
    // Если ничего не найдено, сбрасываем
    setActiveDungeon(null);
  }, [teamBattleState]);

  const handleResetActiveBattle = async () => {
    if (isResetting) return;
    setIsResetting(true);
    
    try {
      // ✅ Используем атомарный сброс через централизованную функцию
      const cleared = await clearActiveBattle(updateGameData, queryClient, accountId);
      
      if (cleared) {
        // Сбрасываем локальный state
        setActiveDungeon(null);
        // Небольшая задержка для завершения real-time событий
        await new Promise(r => setTimeout(r, 200));
      }
      
      // Перезагружаем страницу для полной очистки состояния
      window.location.reload();
    } catch (e) {
      console.error('Error resetting battle:', e);
      window.location.reload();
    }
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
      return false;
    }

    const basicRequirements = !isHealthTooLow && hasActiveCards && energyState.current > 0;
    const levelRequirement = accountLevel >= requiredLevel;
    
    // If there's an active dungeon, only allow access to that specific dungeon
    if (activeDungeon) {
      return activeDungeon === dungeonType;
    }
    
    return basicRequirements && levelRequirement;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[100]"
    >
      <Card variant="menu" className="p-8 max-w-md w-full relative" style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}>
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-4 top-4 text-white hover:text-white/80"
          onClick={onClose}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-6">
            {activeDungeon ? t(language, 'dungeonSearch.activeTitle') : t(language, 'dungeonSearch.selectTitle')}
          </h2>
          
          <EnergyDisplay energyState={energyState} timeUntilNext={timeUntilNext} />
          
          <div className="mb-4">
            <p className="text-white">{t(language, 'dungeonSearch.balance')} {balance} ELL</p>
          </div>

          {hasAnyActiveSession && allActiveSessions.length > 0 && (
            <div className="bg-red-900/40 border-2 border-red-500/60 rounded-lg p-4 mb-4 space-y-3">
              <div className="flex items-center gap-2 text-red-400 font-bold text-lg">
                <span>⚠️</span>
                <span>{t(language, 'dungeonSearch.unfinishedDungeonTitle')}</span>
              </div>
              <p className="text-white/90 text-sm">
                {t(language, 'dungeonSearch.unfinishedDungeonMessage')}
              </p>
              <div className="bg-white/10 p-2 rounded border border-white/20 text-sm">
                <div className="text-purple-300 font-semibold">
                  {getDungeonName(allActiveSessions[0]?.dungeon_type as DungeonType, language)} - Ур. {allActiveSessions[0]?.level}
                </div>
              </div>
              <Button 
                variant="destructive" 
                className="w-full font-bold" 
                onClick={async () => { 
                  await endDungeonSession(); 
                  setActiveDungeon(null);
                }}
              >
                {t(language, 'dungeonSearch.resetActiveDungeon')}
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
                  className={`w-full flex items-center justify-between ${
                    isActiveDungeon 
                      ? 'bg-green-600 hover:bg-green-700 border-green-500 text-white shadow-lg shadow-green-500/50' 
                      : activeDungeon 
                        ? 'bg-black/30 border-white/30 text-white/50 cursor-not-allowed opacity-50'
                        : !canEnter
                          ? 'bg-black/30 border-white/30 text-white/50 cursor-not-allowed opacity-50'
                          : ''
                  }`}
                  style={!isActiveDungeon && !activeDungeon && canEnter ? { boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' } : undefined}
                >
                  <span className="flex items-center gap-2">
                    {getDungeonName(dungeon as DungeonType, language)}
                    {isActiveDungeon && (
                      <span className="flex items-center gap-1 text-xs font-bold bg-green-400/20 px-2 py-0.5 rounded-full">
                        <span>⚔️</span>
                        <span>{t(language, 'dungeonSearch.active')}</span>
                      </span>
                    )}
                    {!canEnter && !isActiveDungeon && (
                      <span className="text-xs opacity-70">
                        (Требуется {requiredLevel} ур.)
                      </span>
                    )}
                  </span>
                  <span className="text-xs opacity-70">
                    Ур. {dungeonLevelRanges[dungeon as DungeonType].min}-{dungeonLevelRanges[dungeon as DungeonType].max}
                  </span>
                </Button>
              );
            })}
          </div>

          {activeDungeon && (
            <div className="text-sm text-white/70 mt-4 space-y-2">
              <p>
                {t(language, 'dungeonSearch.activeBattleWarning')}
              </p>
              <Button
                variant="destructive"
                onClick={handleResetActiveBattle}
                className="border border-red-500/40"
              >
                {t(language, 'dungeonSearch.resetBattle')}
              </Button>
            </div>
          )}

          <Button
            onClick={onClose}
            variant="menu"
            className="mt-4"
            style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}
          >
            {t(language, 'dungeonSearch.close')}
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