import { useDungeonSearch } from "@/hooks/useDungeonSearch";
import { DungeonSearchDialog } from "./dungeon/DungeonSearchDialog";

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

  const hasActiveCards = (() => {
    const savedCards = localStorage.getItem('gameCards');
    return savedCards ? JSON.parse(savedCards).length > 0 : false;
  })();

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