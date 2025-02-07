
import React, { useEffect } from 'react';
import { Chest } from '../../ChestSprite';
import { generateLoot } from '@/utils/lootUtils';
import { useToast } from '@/hooks/use-toast';
import { useInventoryState } from '@/hooks/useInventoryState';

interface ChestManagerProps {
  chests: Chest[];
  setChests: React.Dispatch<React.SetStateAction<Chest[]>>;
  playerPosition: number;
  playerY: number;
}

export const ChestManager = ({
  chests,
  setChests,
  playerPosition,
  playerY
}: ChestManagerProps) => {
  const { toast } = useToast();
  const { inventory, updateInventory } = useInventoryState();

  useEffect(() => {
    if (playerY === 0) {
      const playerWidth = 48;
      const playerLeft = playerPosition;
      const playerRight = playerPosition + playerWidth;

      const collided = chests.find(chest => {
        if (chest.collected) return false;

        const chestWidth = 48;
        const chestBounds = {
          left: chest.position,
          right: chest.position + chestWidth
        };

        return (playerRight >= chestBounds.left && playerLeft <= chestBounds.right);
      });

      if (collided) {
        const { items, coins } = generateLoot({ 
          coins: { chance: 1, min: 10, max: 50 },
          healthPotion: { chance: 0.3 }
        });

        setChests(prev => prev.map(chest => 
          chest.id === collided.id ? { ...chest, collected: true } : chest
        ));

        if (items.length > 0) {
          const newInventory = [...inventory, ...items];
          updateInventory(newInventory);
          items.forEach(item => {
            toast({
              title: "Получен предмет!",
              description: `Вы нашли ${item.name}`,
            });
          });
        }

        if (coins > 0) {
          toast({
            title: "Сокровище!",
            description: `Вы нашли ${coins} монет`,
          });
        }
      }
    }
  }, [playerPosition, playerY, chests, inventory, updateInventory, toast]);

  return null;
};

