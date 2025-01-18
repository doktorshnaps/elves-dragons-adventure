import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface DragonEggTimerProps {
  rarity: number;
  petName: string;
  createdAt: string;
  onHatch: () => void;
}

export const DragonEggTimer = ({ rarity, petName, createdAt, onHatch }: DragonEggTimerProps) => {
  const { toast } = useToast();
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [isHatched, setIsHatched] = useState(false);

  const getHatchTime = (rarity: number): number => {
    const hours = {
      2: 1,    // 1 hour
      3: 4,    // 4 hours
      4: 12,   // 12 hours
      5: 24,   // 24 hours
      6: 72,   // 72 hours
      7: 100,  // 100 hours
      8: 200   // 200 hours
    }[rarity] || 0;

    return hours * 60 * 60 * 1000; // Convert to milliseconds
  };

  useEffect(() => {
    const checkHatchStatus = () => {
      const hatchTime = getHatchTime(rarity);
      const createdDate = new Date(createdAt);
      const now = new Date();
      const timeDiff = now.getTime() - createdDate.getTime();

      if (timeDiff >= hatchTime) {
        setIsHatched(true);
        onHatch();
        toast({
          title: "Яйцо дракона вылупилось!",
          description: `${petName} теперь доступен в вашей коллекции`,
        });
      } else {
        setTimeLeft(formatDistanceToNow(new Date(createdDate.getTime() + hatchTime)));
      }
    };

    const interval = setInterval(checkHatchStatus, 1000);
    return () => clearInterval(interval);
  }, [rarity, createdAt, onHatch, petName]);

  if (isHatched) return null;

  return (
    <Card className="p-4 bg-game-surface border-game-accent">
      <h3 className="text-lg font-bold text-game-accent mb-2">Яйцо дракона</h3>
      <p className="text-sm text-gray-400">Питомец: {petName}</p>
      <p className="text-sm text-gray-400">До вылупления: {timeLeft}</p>
    </Card>
  );
};