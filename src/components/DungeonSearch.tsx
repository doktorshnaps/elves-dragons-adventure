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
    // Проверяем Zustand store - основной источник данных
    if (selectedTeam && selectedTeam.length > 0) {
      return true;
    }
    
    // Проверяем cards в store
    if (cards && cards.length > 0) {
      return true;
    }
    
    // Fallback на localStorage для обратной совместимости
    try {
      const gameData = localStorage.getItem('gameData');
      if (gameData) {
        const parsedData = JSON.parse(gameData);
        if (Array.isArray(parsedData.selected_team) && parsedData.selected_team.length > 0) {
          return true;
        }
      }
    } catch {}
    
    return false;
  };

  const [hasActiveCards, setHasActiveCards] = useState<boolean>(computeHasActiveCards);

  useEffect(() => {
    setHasActiveCards(computeHasActiveCards());
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