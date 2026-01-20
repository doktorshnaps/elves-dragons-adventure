import React from "react";
import { DragonEggTimer } from "../DragonEggTimer";
import { useToast } from "@/hooks/use-toast";
import { DragonEgg, useDragonEggs } from "@/contexts/DragonEggContext";
import { Card, Rarity, Faction } from "@/types/cards";
import { cardDatabase } from "@/data/cardDatabase";
import { Card as UICard } from "@/components/ui/card";
import { calculateCardStats } from "@/utils/cardUtils";
import { useCardInstancesContext } from "@/providers/CardInstancesProvider";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { useQueryClient } from '@tanstack/react-query';
import { useWalletContext } from '@/contexts/WalletConnectContext';
import { useGameEvent } from '@/contexts/GameEventsContext';

interface DragonEggsListProps {
  eggs: DragonEgg[];
}

export const DragonEggsList = ({ eggs }: DragonEggsListProps) => {
  const { toast } = useToast();
  const { removeEgg, startIncubation } = useDragonEggs();
  const { createCardInstance } = useCardInstancesContext();
  const queryClient = useQueryClient();
  const { accountId } = useWalletContext();

  // Слушаем событие начала инкубации через GameEventsContext
  useGameEvent('startIncubation', (payload) => {
    const { petName } = payload || {};
    if (!petName) return;
    
    const egg = eggs.find(e => e.petName === petName && !e.incubationStarted);
    if (egg) {
      startIncubation(egg.id);
      toast({ 
        title: 'Инкубация начата', 
        description: `${egg.petName} (${egg.rarity}★)` 
      });
    }
  }, [eggs, startIncubation, toast]);

  const handleHatch = async (egg: DragonEgg) => {
    // Находим базовую информацию о питомце из базы данных
    const basePet = cardDatabase.find(card => 
      card.type === 'pet' && 
      card.name === egg.petName
    );

    if (!basePet) {
      console.error('Pet not found in database:', egg.petName);
      return;
    }

    // Используем новую систему расчета характеристик
    const stats = calculateCardStats(basePet.name, egg.rarity as Rarity, basePet.type);
    
    // Создаем нового питомца с корректными характеристиками
    const newPet: Card = {
      id: Date.now().toString(),
      name: egg.petName,
      type: 'pet',
      power: stats.power,
      defense: stats.defense,
      health: stats.health,
      magic: stats.magic,
      rarity: egg.rarity as Rarity,
      faction: basePet.faction as Faction,
      image: basePet.image
    };

    // Создаем card_instance напрямую через провайдер
    const result = await createCardInstance(newPet, 'dragon');
    
    if (result) {
      // Удаляем яйцо из контекста
      await removeEgg(egg.id);
      
      // Обновляем список карт через invalidation
      queryClient.invalidateQueries({ queryKey: ['cardInstances', accountId] });

      toast({
        title: 'Питомец получен!',
        description: `${egg.petName} (${egg.rarity}★) добавлен в вашу коллекцию`,
      });
    } else {
      toast({
        title: 'Ошибка',
        description: 'Не удалось создать питомца',
        variant: 'destructive'
      });
    }
  };

  if (eggs.length === 0) return null;

  return (
    <div className="col-span-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
      {eggs.map((egg) => {
        const basePet = cardDatabase.find(card => 
          card.type === 'pet' && 
          card.name === egg.petName
        );

        if (!basePet) return null;

        return (
          <UICard 
            key={egg.id}
            className="w-[90px] h-[180px] sm:w-[120px] sm:h-[240px] md:w-[130px] md:h-[260px] lg:w-[140px] lg:h-[280px] p-2 bg-game-surface/80 border-game-accent backdrop-blur-sm"
          >
            <div className="flex flex-col h-full">
              <div 
                className="relative w-full h-[75px] sm:h-[100px] md:h-[110px] lg:h-[120px] mb-1 rounded-lg overflow-hidden"
              >
                <OptimizedImage
                  src={basePet.image || '/placeholder.svg'}
                  alt={egg.petName}
                  width={140}
                  height={120}
                  placeholder="/placeholder.svg"
                  className="w-full h-full object-contain filter brightness-75 saturate-50"
                  progressive={true}
                />
              </div>
              <div className="flex flex-col flex-grow">
                <div className="text-[7px] sm:text-[10px] md:text-[11px] font-medium text-game-accent mb-1">
                  {egg.petName}
                </div>
                <div className="text-[6px] sm:text-[8px] md:text-[10px] text-gray-400">
                  Редкость: {egg.rarity}
                </div>
                <DragonEggTimer
                  rarity={egg.rarity as Rarity}
                  petName={egg.petName}
                  createdAt={egg.incubationStarted ? egg.createdAt : ''}
                  onHatch={() => handleHatch(egg)}
                />
              </div>
            </div>
          </UICard>
        );
      })}
    </div>
  );
};
