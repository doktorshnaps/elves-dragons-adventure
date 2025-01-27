import { cn } from "@/lib/utils";

export interface StatBarProps {
  value: number;
  maxValue: number;
  color?: string;
  height?: "sm" | "md" | "lg";
  className?: string;
}

export const StatBar = ({
  value,
  maxValue,
  color = "bg-red-600",
  height = "md",
  className
}: StatBarProps) => {
  const percentage = (value / maxValue) * 100;
  
  const heightClass = {
    sm: "h-1.5",
    md: "h-2.5",
    lg: "h-4"
  }[height];

  return (
    <div className={cn("w-full bg-gray-700 rounded-full", heightClass, className)}>
      <div
        className={cn("rounded-full transition-all duration-300", color)}
        style={{ width: `${percentage}%`, height: "100%" }}
      />
    </div>
  );
};