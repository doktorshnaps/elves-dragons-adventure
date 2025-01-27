import * as React from "react";
import { cn } from "@/lib/utils";

export interface StatBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max: number;
  color?: string;
  height?: string;
  showText?: boolean;
}

export const StatBar = React.forwardRef<HTMLDivElement, StatBarProps>(
  ({ value, max, color = "#ef4444", height = "h-2", showText = false, className, ...props }, ref) => {
    const percentage = (value / max) * 100;
    
    return (
      <div ref={ref} className={cn("w-full", className)} {...props}>
        {showText && (
          <div className="flex justify-between mb-1">
            <span className="text-sm text-game-accent">
              {Math.floor(value)}/{Math.floor(max)}
            </span>
          </div>
        )}
        <div className={cn("w-full bg-gray-700 rounded-full overflow-hidden", height)}>
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${percentage}%`,
              backgroundColor: color
            }}
          />
        </div>
      </div>
    );
  }
);

StatBar.displayName = "StatBar";