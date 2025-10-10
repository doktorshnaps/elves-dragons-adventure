import { Battery } from "lucide-react";
import { Progress } from "../ui/progress";
import { EnergyState } from "@/utils/energyManager";

interface EnergyDisplayProps {
  energyState: EnergyState;
  timeUntilNext: number;
}

export const EnergyDisplay = ({ energyState, timeUntilNext }: EnergyDisplayProps) => {
  const formatTime = (ms: number): string => {
    const minutes = Math.floor(ms / (60 * 1000));
    const seconds = Math.floor((ms % (60 * 1000)) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-center gap-2 mb-2">
        <Battery className="w-5 h-5 text-white" />
        <span className="text-white">
          Энергия: {energyState.current}/{energyState.max}
        </span>
      </div>
      <Progress value={(energyState.current / energyState.max) * 100} className="w-full" />
      {energyState.current < energyState.max && (
        <p className="text-sm text-white/70 mt-1">
          Следующая энергия через: {formatTime(timeUntilNext)}
        </p>
      )}
    </div>
  );
};