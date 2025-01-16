import { useState } from "react";
import { dungeons } from "@/constants/dungeons";

export const useDungeonSelection = () => {
  const [rolling, setRolling] = useState(false);
  const [selectedDungeon, setSelectedDungeon] = useState<string | null>(null);

  const startRolling = () => {
    setRolling(true);
    let currentIndex = 0;
    const interval = setInterval(() => {
      setSelectedDungeon(dungeons[currentIndex]);
      currentIndex = (currentIndex + 1) % dungeons.length;
    }, 100);

    return { interval, selectFinalDungeon: () => dungeons[Math.floor(Math.random() * dungeons.length)] };
  };

  const stopRolling = () => {
    setRolling(false);
  };

  return {
    rolling,
    selectedDungeon,
    setSelectedDungeon,
    startRolling,
    stopRolling
  };
};