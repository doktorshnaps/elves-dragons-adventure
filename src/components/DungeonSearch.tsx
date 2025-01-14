import React from "react";
import { DungeonSearchDialog } from "./dungeon/DungeonSearchDialog";
import { useDungeonSearch } from "@/hooks/useDungeonSearch";
import { EnergyState } from "@/utils/energyManager";

interface DungeonSearchProps {
  onClose: () => void;
  balance: number;
  onBalanceChange: (newBalance: number) => void;
}

export const DungeonSearch = ({ onClose, balance }: DungeonSearchProps) => {
  const {
    rolling,
    selectedDungeon,
    energyState,
    timeUntilNext,
    isHealthTooLow,
    rollDice
  } = useDungeonSearch(balance);

  return (
    <DungeonSearchDialog
      onClose={onClose}
      balance={balance}
      selectedDungeon={selectedDungeon}
      rolling={rolling}
      energyState={energyState}
      timeUntilNext={timeUntilNext}
      isHealthTooLow={isHealthTooLow}
      onRollDice={rollDice}
    />
  );
};