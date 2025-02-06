
import { cn } from "@/lib/utils";

interface HealthBarProps {
  current: number;
  max: number;
  className?: string;
  indicatorClassName?: string;
  label?: string;
  showValue?: boolean;
}

export const HealthBar = ({
  current,
  max,
  className,
  indicatorClassName,
  label,
  showValue = true
}: HealthBarProps) => {
  const percentage = (current / max) * 100;

  return (
    <div className="space-y-1">
      {label && (
        <div className="flex justify-between text-xs text-game-accent">
          <span>{label}</span>
          {showValue && (
            <span>{Math.floor(current)}/{max}</span>
          )}
        </div>
      )}
      <div className={cn("h-2 rounded-full", className)}>
        <div 
          className={cn("h-full rounded-full transition-all duration-300 relative", indicatorClassName)}
          style={{ width: `${Math.max(0, Math.min(percentage, 100))}%` }}
        >
          {showValue && (
            <div className="absolute inset-0 flex items-center justify-center text-[10px] text-white font-bold whitespace-nowrap">
              {Math.floor(current)}/{max}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
