import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Rarity } from '@/types/cards';

interface UseEggIncubationProps {
  petName: string;
  createdAt: string;
  rarity: Rarity;
  onHatch: () => void;
}

export const useEggIncubation = ({ 
  petName, 
  createdAt, 
  rarity, 
  onHatch 
}: UseEggIncubationProps) => {
  const { toast } = useToast();
  const [isStarted, setIsStarted] = useState(false);
  const [isHatched, setIsHatched] = useState(false);
  const [canClaim, setCanClaim] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const getHatchTime = (rarity: Rarity): number => {
    // Egg rarity represents the TARGET rarity (after upgrade).
    // We need duration based on the source rarity (target - 1).
    const fromRarity = (rarity as number) - 1;
    const durationsMs: Record<number, number> = {
      1: 10 * 60 * 1000,        // 1 -> 2 : 10 мин
      2: 30 * 60 * 1000,        // 2 -> 3 : 30 мин
      3: 10 * 60 * 60 * 1000,   // 3 -> 4 : 10 часов
      4: 72 * 60 * 60 * 1000,   // 4 -> 5 : 72 часа
      5: 150 * 60 * 60 * 1000,  // 5 -> 6 : 150 часов
      6: 200 * 60 * 60 * 1000,  // 6 -> 7 : 200 часов
      7: 300 * 60 * 60 * 1000,  // 7 -> 8 : 300 часов
    };
    return durationsMs[fromRarity] ?? 10 * 60 * 1000;
  };

  // Проверяем сохраненное состояние при монтировании
  useEffect(() => {
    const savedIncubations = localStorage.getItem('eggIncubations');
    if (savedIncubations) {
      const incubations = JSON.parse(savedIncubations);
      const eggIncubation = incubations.find((inc: any) => 
        inc.petName === petName && inc.createdAt === createdAt
      );
      
      if (eggIncubation) {
        setIsStarted(true);
        const hatchTime = getHatchTime(rarity);
        const startDate = new Date(eggIncubation.startedAt);
        const now = new Date();
        const timeDiff = now.getTime() - startDate.getTime();

        if (timeDiff >= hatchTime) {
          setIsHatched(true);
          setCanClaim(true);
          setTimeLeft(0);
        } else {
          setTimeLeft(hatchTime - timeDiff);
        }
      }
    }
  }, [petName, createdAt, rarity]);

  // Обновляем таймер
  useEffect(() => {
    if (!isStarted || isHatched) return;

    const savedIncubations = localStorage.getItem('eggIncubations');
    const incubations = savedIncubations ? JSON.parse(savedIncubations) : [];
    const eggIncubation = incubations.find((inc: any) => 
      inc.petName === petName && inc.createdAt === createdAt
    );

    if (!eggIncubation) return;

    const startTime = new Date(eggIncubation.startedAt).getTime();
    const hatchTime = getHatchTime(rarity);
    
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const elapsed = now - startTime;
      const remaining = hatchTime - elapsed;

      if (remaining <= 0) {
        setTimeLeft(0);
        setCanClaim(true);
        clearInterval(timer);
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isStarted, isHatched, petName, createdAt, rarity]);

  const handleStart = () => {
    setIsStarted(true);
    
    // Сохраняем состояние инкубации
    const savedIncubations = localStorage.getItem('eggIncubations');
    const incubations = savedIncubations ? JSON.parse(savedIncubations) : [];
    
    incubations.push({
      petName,
      createdAt,
      startedAt: new Date().toISOString()
    });
    
    localStorage.setItem('eggIncubations', JSON.stringify(incubations));
    
    toast({
      title: "Инкубация началась",
      description: `${petName} вылупится через некоторое время`,
    });
  };

  const handleClaim = () => {
    setIsHatched(true);
    setCanClaim(false);
    
    // Удаляем информацию об инкубации после получения
    const savedIncubations = localStorage.getItem('eggIncubations');
    if (savedIncubations) {
      const incubations = JSON.parse(savedIncubations);
      const updatedIncubations = incubations.filter((inc: any) => 
        !(inc.petName === petName && inc.createdAt === createdAt)
      );
      localStorage.setItem('eggIncubations', JSON.stringify(updatedIncubations));
    }
    
    // Вызываем onHatch для перемещения карты в колоду
    onHatch();
  };

  return {
    isStarted,
    isHatched,
    canClaim,
    timeLeft,
    handleStart,
    handleClaim
  };
};