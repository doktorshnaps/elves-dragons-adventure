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
import { useGameStore } from "@/stores/gameStore";

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

  const selectedTeam = useGameStore((state) => state.selectedTeam);
  const cards = useGameStore((state) => state.cards);

  const computeHasActiveCards = () => {
    console.log('🔍 [DungeonSearch] Checking active cards...');
    console.log('🎮 [DungeonSearch] selectedTeam from store:', selectedTeam);
    console.log('📊 [DungeonSearch] selectedTeam type:', typeof selectedTeam);
    console.log('📏 [DungeonSearch] selectedTeam length:', selectedTeam?.length);
    console.log('🃏 [DungeonSearch] cards from store:', cards);
    
    // Проверяем Zustand store - основной источник данных
    // Команда должна содержать хотя бы одного героя
    if (Array.isArray(selectedTeam) && selectedTeam.length > 0) {
      console.log('✅ [DungeonSearch] selectedTeam is array with length:', selectedTeam.length);
      console.log('📋 [DungeonSearch] selectedTeam structure:', JSON.stringify(selectedTeam, null, 2));
      
      const hasHero = selectedTeam.some(pair => {
        const result = pair?.hero && pair.hero.id;
        console.log('🦸 [DungeonSearch] Checking pair:', { hasHero: result, pair: JSON.stringify(pair) });
        return result;
      });
      console.log('🦸 [DungeonSearch] Has hero in team:', hasHero);
      
      if (hasHero) {
        console.log('✅ [DungeonSearch] RESULT: Active cards found (Zustand)');
        return true;
      } else {
        console.log('⚠️ [DungeonSearch] Team has items but no heroes found');
      }
    } else {
      console.log('⚠️ [DungeonSearch] selectedTeam is empty, null, or not array:', {
        isArray: Array.isArray(selectedTeam),
        isNull: selectedTeam === null,
        isUndefined: selectedTeam === undefined,
        value: selectedTeam
      });
    }
    
    console.log('❌ [DungeonSearch] RESULT: No active cards found');
    return false;
  };

  const [hasActiveCards, setHasActiveCards] = useState<boolean>(computeHasActiveCards);

  useEffect(() => {
    console.log('🔄 [DungeonSearch] useEffect triggered - recalculating hasActiveCards');
    console.log('📊 [DungeonSearch] Current selectedTeam:', selectedTeam);
    console.log('🎴 [DungeonSearch] Current cards:', cards);
    
    const newValue = computeHasActiveCards();
    console.log('🎯 [DungeonSearch] New hasActiveCards value:', newValue);
    setHasActiveCards(newValue);
  }, [selectedTeam, cards]);

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