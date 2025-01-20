import { DragonEggTimer } from "../DragonEggTimer";
import { useToast } from "@/hooks/use-toast";
import { DragonEgg } from "@/contexts/DragonEggContext";
import { Card, Rarity, Faction } from "@/types/cards";
import { cardDatabase } from "@/data/cardDatabase";

interface DragonEggsListProps {
  eggs: DragonEgg[];
}

export const DragonEggsList = ({ eggs }: DragonEggsListProps) => {
  const { toast } = useToast();

  const handleHatch = (egg: DragonEgg) => {
    const basePet = cardDatabase.find(card => 
      card.type === 'pet' && 
      card.name === egg.petName
    );

    if (!basePet) {
      console.error('Pet not found in database:', egg.petName);
      return;
    }

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

    const savedCards = localStorage.getItem('gameCards');
    const currentCards = savedCards ? JSON.parse(savedCards) : [];
    const updatedCards = [...currentCards, newPet];
    localStorage.setItem('gameCards', JSON.stringify(updatedCards));

    const savedEggs = localStorage.getItem('dragonEggs');
    if (savedEggs) {
      const currentEggs = JSON.parse(savedEggs);
      const updatedEggs = currentEggs.filter((e: DragonEgg) => e.id !== egg.id);
      localStorage.setItem('dragonEggs', JSON.stringify(updatedEggs));
    }

    const cardsEvent = new CustomEvent('cardsUpdate', { 
      detail: { cards: updatedCards }
    });
    window.dispatchEvent(cardsEvent);

    const eggsEvent = new CustomEvent('eggsUpdate');
    window.dispatchEvent(eggsEvent);
  };

  if (eggs.length === 0) return null;

  // Удаляем дубликаты яиц на основе petName и rarity
  const uniqueEggs = eggs.reduce((acc: DragonEgg[], current) => {
    const exists = acc.some(egg => 
      egg.petName === current.petName && 
      egg.rarity === current.rarity
    );
    if (!exists) {
      acc.push(current);
    }
    return acc;
  }, []);

  return (
    <div className="col-span-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
      {uniqueEggs.map((egg) => {
        const basePet = cardDatabase.find(card => 
          card.type === 'pet' && 
          card.name === egg.petName
        );

        return (
          <DragonEggTimer
            key={egg.id}
            rarity={egg.rarity}
            petName={egg.petName}
            createdAt={egg.createdAt}
            onHatch={() => handleHatch(egg)}
            faction={basePet?.faction}
          />
        );
      })}
    </div>
  );
};