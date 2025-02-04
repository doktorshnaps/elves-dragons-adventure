import React from "react";
import { DungeonSearchDialog } from "./dungeon/DungeonSearchDialog";
import { useDungeonSearch } from "@/hooks/useDungeonSearch";

interface DungeonSearchProps {
  onClose: () => void;
  balance: number;
  onBalanceChange: (newBalance: number) => void;
}

export const DungeonSearch = ({ onClose, balance, onBalanceChange }: DungeonSearchProps) => {
  const [hasActiveCards, setHasActiveCards] = React.useState(false);

  React.useEffect(() => {
    const checkActiveCards = () => {
      const savedCards = localStorage.getItem('gameCards');
      if (savedCards) {
        const cards = JSON.parse(savedCards);
        const heroes = cards.filter(card => card.type === 'character');
        const pets = cards.filter(card => card.type === 'pet');
        
        setHasActiveCards(heroes.length > 0);
      } else {
        setHasActiveCards(false);
      }
    };

    checkActiveCards();
    window.addEventListener('cardsUpdate', checkActiveCards);
    window.addEventListener('storage', checkActiveCards);

    return () => {
      window.removeEventListener('cardsUpdate', checkActiveCards);
      window.removeEventListener('storage', checkActiveCards);
    };
  }, []);

  React.useEffect(() => {
    localStorage.removeItem('battleState');
  }, []);

  const {
    rolling,
    selectedDungeon,
    energyState,
    timeUntilNext,
    isHealthTooLow,
    rollDice
  } = useDungeonSearch(balance);

  return (
    <div className="fixed inset-0 z-[100]">
      <DungeonSearchDialog
        onClose={onClose}
        balance={balance}
        selectedDungeon={selectedDungeon}
        rolling={rolling}
        energyState={energyState}
        timeUntilNext={timeUntilNext}
        isHealthTooLow={isHealthTooLow}
        onRollDice={rollDice}
        hasActiveCards={hasActiveCards}
      />
    </div>
  );
};