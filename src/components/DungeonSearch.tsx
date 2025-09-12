import { useDungeonSearch } from "@/hooks/useDungeonSearch";
import { DungeonSearchDialog } from "./dungeon/DungeonSearchDialog";
import { useEffect, useState } from "react";

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