import { useState } from "react";
import { useToast } from "./use-toast";
import { useEnergy } from "@/utils/energyManager";
import { useEnergyManagement } from "./dungeon/useEnergyManagement";
import { useHealthCheck } from "./dungeon/useHealthCheck";
import { DungeonType } from "@/constants/dungeons";

export const useDungeonSearch = (balance: number) => {
  const { toast } = useToast();
  const { energyState, timeUntilNext } = useEnergyManagement();
  const [selectedDungeon, setSelectedDungeon] = useState<DungeonType | null>(null);
  const { isHealthTooLow } = useHealthCheck();

  return {
    selectedDungeon,
    energyState,
    timeUntilNext,
    isHealthTooLow,
  };
};