import { DragonEggTimer } from "../DragonEggTimer";
import { useToast } from "@/hooks/use-toast";
import { DragonEgg } from "@/contexts/DragonEggContext";
import { Card } from "@/types/cards";

interface DragonEggsListProps {
  eggs: DragonEgg[];
}

export const DragonEggsList = ({ eggs }: DragonEggsListProps) => {
  const { toast } = useToast();

  const handleHatch = (egg: DragonEgg) => {
    // Создаем нового питомца
    const newPet: Card = {
      id: Date.now().toString(),
      name: egg.petName,
      type: 'pet',
      power: 10 * egg.rarity,
      defense: 8 * egg.rarity,
      health: 15 * egg.rarity,
      magic: 5 * egg.rarity,
      rarity: egg.rarity,
    };

    // Получаем текущие карты
    const savedCards = localStorage.getItem('gameCards');
    const currentCards = savedCards ? JSON.parse(savedCards) : [];

    // Добавляем нового питомца
    const updatedCards = [...currentCards, newPet];
    localStorage.setItem('gameCards', JSON.stringify(updatedCards));

    // Удаляем яйцо из localStorage
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
  };

  if (eggs.length === 0) return null;

  return (
    <div className="col-span-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
      {eggs.map((egg) => (
        <DragonEggTimer
          key={egg.id}
          rarity={egg.rarity}
          petName={egg.petName}
          createdAt={egg.createdAt}
          onHatch={() => handleHatch(egg)}
        />
      ))}
    </div>
  );
};