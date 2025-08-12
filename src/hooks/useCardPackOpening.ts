import { useState } from 'react';
import { Item } from "@/types/inventory";
import { Card as CardType } from "@/types/cards";
import { useGameData } from '@/hooks/useGameData';
import { useToast } from '@/hooks/use-toast';
import { generateCard } from '@/utils/cardUtils';

export const useCardPackOpening = () => {
  const { gameData, updateGameData } = useGameData();
  const { toast } = useToast();
  const [isOpening, setIsOpening] = useState(false);
  const [revealedCard, setRevealedCard] = useState<CardType | null>(null);
  const [showRevealModal, setShowRevealModal] = useState(false);

  const removeCardPacksFromInventory = (count: number, referencePack: Item) => {
    const inv = [...(gameData.inventory || [])];
    let removed = 0;
    const updated = [] as Item[];
    for (const it of inv) {
      if (
        removed < count &&
        it.type === 'cardPack' &&
        // Prefer same name to keep UX consistent for different pack types
        (it.name === referencePack.name)
      ) {
        removed += 1;
        continue; // skip adding this one (removed)
      }
      updated.push(it);
    }

    // If not enough with exact name, try removing any remaining generic card packs
    if (removed < count) {
      const stillNeeded = count - removed;
      const tmp: Item[] = [];
      for (const it of updated) {
        if (removed < count && it.type === 'cardPack' && it.name !== referencePack.name) {
          removed += 1;
          continue;
        }
        tmp.push(it);
      }
      return { updatedInventory: tmp, removedCount: removed };
    }

    return { updatedInventory: updated, removedCount: removed };
  };

  const openCardPacks = async (packItem: Item, count: number): Promise<CardType[]> => {
    if (packItem.type !== 'cardPack' || isOpening) return [];

    const available = (gameData.inventory || []).filter(i => i.type === 'cardPack' && i.name === packItem.name).length
      + (gameData.inventory || []).filter(i => i.type === 'cardPack' && i.name !== packItem.name).length; // total packs of any type

    if (count < 1) return [];
    if (available < count) {
      toast({
        title: 'Недостаточно колод',
        description: `У вас только ${available} колод(ы) для открытия`,
        variant: 'destructive',
      });
      return [];
    }

    setIsOpening(true);

    try {
      const { updatedInventory, removedCount } = removeCardPacksFromInventory(count, packItem);

      if (removedCount < count) {
        toast({
          title: 'Недостаточно колод',
          description: `У вас только ${removedCount} колод(ы) для открытия`,
          variant: 'destructive',
        });
        return [];
      }

      // Generate cards
      const newCards: CardType[] = Array.from({ length: count }, () =>
        generateCard(Math.random() > 0.5 ? 'character' : 'pet')
      );

      const updatedCards = [...(gameData.cards || []), ...newCards];

      await updateGameData({
        inventory: updatedInventory,
        cards: updatedCards,
      });

      // Show last revealed in modal for UX continuity
      const last = newCards[newCards.length - 1] || null;
      if (last) {
        setRevealedCard(last);
        setShowRevealModal(true);
      }

      toast({
        title: 'Колоды открыты',
        description: `Открыто ${count} колод(ы). Новых карт: ${newCards.length}`,
      });

      return newCards;
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось открыть колоды карт',
        variant: 'destructive',
      });
      return [];
    } finally {
      setIsOpening(false);
    }
  };

  const openCardPack = async (packItem: Item): Promise<CardType | null> => {
    const cards = await openCardPacks(packItem, 1);
    return cards[0] || null;
  };

  const closeRevealModal = () => {
    setShowRevealModal(false);
    setRevealedCard(null);
  };

  return {
    openCardPack,
    openCardPacks,
    isOpening,
    revealedCard,
    showRevealModal,
    closeRevealModal
  };
};