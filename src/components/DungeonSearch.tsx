import { useDungeonSearch } from "@/hooks/useDungeonSearch";
import { DungeonSearchDialog } from "./dungeon/DungeonSearchDialog";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useDungeonSync } from "@/hooks/useDungeonSync";
import { useWalletContext } from "@/contexts/WalletConnectContext";
import { useNavigate } from "react-router-dom";
import { dungeonRoutes, DungeonType } from "@/constants/dungeons";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
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

  const computeHasActiveCards = () => {
    try {
      const gameData = localStorage.getItem('gameData');
      if (gameData) {
        const parsedData = JSON.parse(gameData);
        if (Array.isArray(parsedData.selected_team)) {
          return parsedData.selected_team.length > 0;
        }
      }
      // Fallback to old gameCards format
      const savedCards = localStorage.getItem('gameCards');
      return savedCards ? JSON.parse(savedCards).length > 0 : false;
    } catch {
      return false;
    }
  };

  const [hasActiveCards, setHasActiveCards] = useState<boolean>(computeHasActiveCards);

  useEffect(() => {
    const update = () => setHasActiveCards(computeHasActiveCards());
    update();

    // Polling to detect same-tab localStorage updates
    const interval = setInterval(update, 500);

    // Cross-tab updates
    const onStorage = (e: StorageEvent) => {
      if (!e.key || e.key === 'gameData' || e.key === 'gameCards' || e.key === 'selectedTeam') update();
    };
    window.addEventListener('storage', onStorage);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  // Предварительная проверка активных сессий в БД при открытии экрана
  const { deviceId, endDungeonSession } = useDungeonSync();
  const { accountId } = useWalletContext();
  const navigate = useNavigate();
  const [remoteSession, setRemoteSession] = useState<null | { device_id: string; dungeon_type: string; level: number; last_activity: number }>(null);

  useEffect(() => {
    const check = async () => {
      if (!accountId) { setRemoteSession(null); return; }
      try {
        const now = Date.now();
        const TIMEOUT = 30000;
        const { data, error } = await supabase
          .from('active_dungeon_sessions')
          .select('device_id,dungeon_type,level,last_activity')
          .eq('account_id', accountId)
          .gte('last_activity', now - TIMEOUT)
          .order('last_activity', { ascending: false })
          .limit(1);
        if (error) throw error;
        setRemoteSession(data && data.length ? data[0] : null);
      } catch (e) {
        console.error('Active dungeon precheck error:', e);
        setRemoteSession(null);
      }
    };
    check();

    // Подписываемся на изменения в БД для автообновления
    if (!accountId) return;
    
    const channel = supabase
      .channel(`dungeon_search_monitor:${accountId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'active_dungeon_sessions',
          filter: `account_id=eq.${accountId}`
        },
        () => {
          console.log('Session changed, rechecking...');
          check();
        }
      )
      .subscribe();

    // Периодическая перезагрузка на случай пропуска realtime событий
    const interval = setInterval(check, 5000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [accountId]);

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
                onClick={async () => { await endDungeonSession(); setRemoteSession(null); }}
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