import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { getRarityLabel } from "@/utils/cardUtils";

interface DragonEggTimerProps {
  rarity: number;
  petName: string;
  createdAt: string;
  onHatch: () => void;
  faction?: string;
}

export const DragonEggTimer = ({ 
  rarity, 
  petName, 
  createdAt, 
  onHatch,
  faction 
}: DragonEggTimerProps) => {
  const { toast } = useToast();
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [isStarted, setIsStarted] = useState(false);
  const [isHatched, setIsHatched] = useState(false);
  const [canClaim, setCanClaim] = useState(false);
  const [hasNotified, setHasNotified] = useState(false);

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
    if (!isStarted) return;

    const checkHatchStatus = () => {
      const hatchTime = getHatchTime(rarity);
      const startDate = new Date(createdAt);
      const now = new Date();
      const timeDiff = now.getTime() - startDate.getTime();

      if (timeDiff >= hatchTime) {
        setIsHatched(true);
        setCanClaim(true);
        
        if (!hasNotified) {
          toast({
            title: "Яйцо дракона вылупилось!",
            description: `${petName} готов к получению`,
          });
          setHasNotified(true);
        }
      } else {
        setTimeLeft(formatDistanceToNow(new Date(startDate.getTime() + hatchTime)));
      }
    };

    const interval = setInterval(checkHatchStatus, 1000);
    return () => clearInterval(interval);
  }, [rarity, createdAt, isStarted, petName, hasNotified, toast]);

  const handleStart = () => {
    setIsStarted(true);
    toast({
      title: "Инкубация началась",
      description: `${petName} вылупится через некоторое время`,
    });
  };

  const handleClaim = () => {
    if (canClaim) {
      onHatch();
      setIsHatched(true);
      setCanClaim(false);
      toast({
        title: "Питомец получен!",
        description: `${petName} теперь доступен в вашей коллекции`,
      });
    }
  };

  if (!isStarted || (isHatched && !canClaim)) return null;

  return (
    <Card className="p-4 bg-game-surface border-game-accent">
      <h3 className="text-lg font-bold text-game-accent mb-2">Яйцо дракона</h3>
      <div className="space-y-2 text-sm text-gray-400">
        <p>Питомец: {petName}</p>
        {faction && <p>Фракция: {faction}</p>}
        <p>Редкость: {getRarityLabel(rarity as 1|2|3|4|5|6|7|8)}</p>
        {!isStarted ? (
          <Button 
            onClick={handleStart}
            className="w-full mt-2 bg-blue-600 hover:bg-blue-700"
          >
            Начать инкубацию
          </Button>
        ) : canClaim ? (
          <Button 
            onClick={handleClaim}
            className="w-full mt-2 bg-green-600 hover:bg-green-700"
          >
            Получить питомца
          </Button>
        ) : (
          <p className="mt-2">До вылупления: {timeLeft}</p>
        )}
      </div>
    </Card>
  );
};