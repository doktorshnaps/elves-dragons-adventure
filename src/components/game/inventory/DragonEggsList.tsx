import { DragonEggTimer } from "../DragonEggTimer";
import { useToast } from "@/hooks/use-toast";
import { DragonEgg } from "@/contexts/DragonEggContext";
import { Card, Rarity, Faction } from "@/types/cards";
import { cardDatabase } from "@/data/cardDatabase";
import { Card as UICard } from "@/components/ui/card";

interface DragonEggsListProps {
  eggs: DragonEgg[];
}

export const DragonEggsList = ({ eggs }: DragonEggsListProps) => {
  const { toast } = useToast();

  const handleHatch = (egg: DragonEgg) => {
    // Находим базовую информацию о питомце из базы данных
    const basePet = cardDatabase.find(card => 
      card.type === 'pet' && 
      card.name === egg.petName
    );

    if (!basePet) {
      console.error('Pet not found in database:', egg.petName);
      return;
    }

    // Создаем нового питомца с корректными характеристиками
    const newPet: Card = {
      id: Date.now().toString(),
      name: egg.petName,
      type: 'pet',
      power: basePet.baseStats.power * Math.pow(2, egg.rarity - 1),
      defense: basePet.baseStats.defense * Math.pow(2, egg.rarity - 1),
      health: basePet.baseStats.health * Math.pow(2, egg.rarity - 1),
      magic: basePet.baseStats.magic * Math.pow(2, egg.rarity - 1),
      rarity: egg.rarity as Rarity,
      faction: basePet.faction as Faction,
      image: basePet.image
    };

    // Получаем текущие карты
    const savedCards = localStorage.getItem('gameCards');
    const currentCards = savedCards ? JSON.parse(savedCards) : [];

    // Добавляем нового питомца
    const updatedCards = [...currentCards, newPet];
    localStorage.setItem('gameCards', JSON.stringify(updatedCards));

    // Удаляем яйцо из localStorage и контекста
    const savedEggs = localStorage.getItem('dragonEggs');
    if (savedEggs) {
      const currentEggs = JSON.parse(savedEggs);
      const updatedEggs = currentEggs.filter((e: DragonEgg) => e.id !== egg.id);
      localStorage.setItem('dragonEggs', JSON.stringify(updatedEggs));
    }

    // Отправляем событие обновления карт
    const cardsEvent = new CustomEvent('cardsUpdate', { 
      detail: { cards: updatedCards }
    });
    window.dispatchEvent(cardsEvent);

    // Отправляем событие обновления яиц
    const eggsEvent = new CustomEvent('eggsUpdate');
    window.dispatchEvent(eggsEvent);
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
            className="relative overflow-hidden bg-game-surface border-game-accent"
          >
            <div className="p-2">
              <div 
                className="w-full aspect-square rounded-lg mb-2 bg-center bg-cover"
                style={{
                  backgroundImage: `url(${basePet.image})`,
                  filter: 'brightness(0.7) saturate(0.5)',
                }}
              />
              <div className="text-sm font-medium text-game-accent mb-1">
                {egg.petName}
              </div>
              <div className="text-xs text-gray-400 mb-2">
                Редкость: {egg.rarity}
              </div>
              <DragonEggTimer
                rarity={egg.rarity as Rarity}
                petName={egg.petName}
                createdAt={egg.createdAt}
                onHatch={() => handleHatch(egg)}
              />
            </div>
          </UICard>
        );
      })}
    </div>
  );
};