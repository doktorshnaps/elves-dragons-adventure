import { useDungeonSearch } from "@/hooks/useDungeonSearch";
import { DungeonSearchDialog } from "./dungeon/DungeonSearchDialog";
import { useEffect, useState } from "react";
import { useDungeonSync } from "@/hooks/useDungeonSync";
import { useWalletContext } from "@/contexts/WalletConnectContext";
import { useNavigate } from "react-router-dom";
import { dungeonRoutes, DungeonType } from "@/constants/dungeons";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { useLatestActiveDungeonSession } from "@/hooks/useActiveDungeonSessions";
import { useGameData } from "@/hooks/useGameData";

// SEO: title and meta for dungeon search
if (typeof document !== 'undefined') {
  document.title = "Поиск подземелий — активные карты героев и драконов";
  const meta = document.querySelector('meta[name="description"]');
  if (meta) meta.setAttribute('content', 'Начните поиск подземелья: проверьте наличие активных карт героев и драконов.');
}

interface DungeonSearchProps {
  onClose: () => void;
  balance: number;
  onBalanceChange: (newBalance: number) => void;
}

export const DungeonSearch = ({ onClose, balance }: DungeonSearchProps) => {
  const {
    selectedDungeon,
    energyState,
    timeUntilNext,
    isHealthTooLow,
  } = useDungeonSearch(balance);

  // КРИТИЧНО: Читаем selectedTeam напрямую из gameData (БД), а не из Zustand store
  // Это гарантирует, что данные будут актуальны даже после перезагрузки страницы
  const { gameData } = useGameData();
  const selectedTeam = gameData.selectedTeam || [];

  const computeHasActiveCards = () => {
    console.log('🔍 [DungeonSearch] Checking active cards...');
    console.log('🎮 [DungeonSearch] selectedTeam from gameData:', selectedTeam);
    console.log('📊 [DungeonSearch] selectedTeam type:', typeof selectedTeam);
    console.log('📏 [DungeonSearch] selectedTeam length:', selectedTeam?.length);
    
    // Проверяем selectedTeam из gameData
    if (!Array.isArray(selectedTeam) || selectedTeam.length === 0) {
      console.log('⚠️ [DungeonSearch] selectedTeam is empty, null, or not array');
      return false;
    }
    
    console.log('✅ [DungeonSearch] selectedTeam is array with length:', selectedTeam.length);
    console.log('📋 [DungeonSearch] selectedTeam structure:', JSON.stringify(selectedTeam, null, 2));
    
    // Проверяем разные возможные структуры данных
    const hasHero = selectedTeam.some(item => {
      // Защита от null/undefined
      if (!item) {
        console.log('⚠️ [DungeonSearch] Found null/undefined item in team');
        return false;
      }
      
      // Вариант 1: структура pair.hero (новая структура)
      if (item.hero && item.hero.id) {
        console.log('✅ [DungeonSearch] Found hero in pair structure:', item.hero.name);
        return true;
      }
      
      // Вариант 2: прямая карта (старая структура)
      if (item.id && item.type && (item.type === 'character' || item.type === 'pet')) {
        console.log('✅ [DungeonSearch] Found card directly:', item.name);
        return true;
      }
      
      console.log('⚠️ [DungeonSearch] Item has unknown structure:', JSON.stringify(item).substring(0, 100));
      return false;
    });
    
    console.log('🦸 [DungeonSearch] Has hero in team:', hasHero);
    
    if (hasHero) {
      console.log('✅ [DungeonSearch] RESULT: Active cards found');
      return true;
    }
    
    console.log('❌ [DungeonSearch] RESULT: No active cards found');
    return false;
  };

  const [hasActiveCards, setHasActiveCards] = useState<boolean>(computeHasActiveCards);

  useEffect(() => {
    console.log('🔄 [DungeonSearch] useEffect triggered - recalculating hasActiveCards');
    console.log('📊 [DungeonSearch] Current selectedTeam from gameData:', {
      selectedTeam,
      type: typeof selectedTeam,
      isArray: Array.isArray(selectedTeam),
      length: selectedTeam?.length,
      data: JSON.stringify(selectedTeam).substring(0, 300)
    });
    
    const newValue = computeHasActiveCards();
    console.log('🎯 [DungeonSearch] New hasActiveCards value:', newValue);
    setHasActiveCards(newValue);
  }, [selectedTeam, gameData]);

  // Предварительная проверка активных сессий с кэшированием
  const { deviceId, endDungeonSession } = useDungeonSync();
  const { accountId } = useWalletContext();
  const navigate = useNavigate();
  const { data: remoteSession } = useLatestActiveDungeonSession();

  if (remoteSession) {
    const isSameDevice = remoteSession.device_id === deviceId;
    
    // Если это то же устройство - не показываем блокирующее окно, разрешаем продолжить
    if (isSameDevice) {
      // Просто не показываем окно, пользователь может продолжить выбор подземелья
      // Но добавим кнопку "Сбросить" в интерфейс выбора подземелья
    } else {
      // Другое устройство - блокируем
      return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[100]">
          <Card variant="menu" className="p-6 max-w-md w-full" style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}>
            <h2 className="text-2xl font-bold text-white mb-4">
              Подземелье активно на другом устройстве
            </h2>
            <p className="text-white/80 mb-6">
              Вход заблокирован. Завершите подземелье на другом устройстве или сбросьте его здесь.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="destructive"
                onClick={async () => { await endDungeonSession(); }}
              >
                Завершить на всех устройствах
              </Button>
            </div>
          </Card>
        </div>
      );
    }
  }

  return (
    <DungeonSearchDialog
      onClose={onClose}
      balance={balance}
      selectedDungeon={selectedDungeon}
      rolling={false}
      energyState={energyState}
      timeUntilNext={timeUntilNext}
      isHealthTooLow={isHealthTooLow}
      onRollDice={() => {}}
      hasActiveCards={hasActiveCards}
    />
  );
};