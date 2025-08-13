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
    const updated: Item[] = [];

    const targetId = referencePack?.id != null ? String(referencePack.id) : "";
    const targetName = referencePack.name;

    // Remove the exact referenced pack by id first (only one), then same-name packs
    for (const it of inv) {
      const isPack = it.type === 'cardPack';
      const idStr = it?.id != null ? String(it.id) : "";

      if (isPack && removed < count) {
        if (removed === 0 && idStr === targetId) {
          removed += 1;
          continue;
        }
        if (it.name === targetName) {
          removed += 1;
          continue;
        }
      }

      updated.push(it);
    }

    return { updatedInventory: updated, removedCount: removed };
  };

  const openCardPacks = async (packItem: Item, count: number): Promise<CardType[]> => {
    if (packItem.type !== 'cardPack' || isOpening) return [];

    const allPacks = (gameData.inventory || []).filter(
      (i) => i.type === 'cardPack' && i.name === packItem.name
    );
    const available = allPacks.length;

    if (count < 1) return [];
    if (available < count) {
      toast({
        title: 'Недостаточно колод',
        description: `Доступно только ${available} колод(ы) этой серии для открытия`,
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
          description: `Доступно только ${available} колод(ы) этой серии для открытия`,
          variant: 'destructive',
        });
        return [];
      }

      const newCards: CardType[] = Array.from({ length: count }, () =>
        generateCard(Math.random() > 0.5 ? 'character' : 'pet')
      );

      const updatedCards = [...(gameData.cards || []), ...newCards];

      await updateGameData({
        inventory: updatedInventory,
        cards: updatedCards,
      });

      // Keep localStorage and listeners in sync to immediately disable selling
      try {
        localStorage.setItem('gameInventory', JSON.stringify(updatedInventory));
        localStorage.setItem('gameCards', JSON.stringify(updatedCards));
        window.dispatchEvent(new CustomEvent('inventoryUpdate', { detail: { inventory: updatedInventory } }));
        window.dispatchEvent(new CustomEvent('cardsUpdate', { detail: { cards: updatedCards } }));
      } catch (err) {
        console.error('Inventory sync error', err);
        toast({
          title: 'Ошибка синхронизации',
          description: 'Не удалось синхронизировать инвентарь',
          variant: 'destructive',
        });
      }

      // Packs left of the same type/name
      const packsLeftSame = updatedInventory.filter(
        (i) => i.type === 'cardPack' && i.name === packItem.name
      ).length;

      if (packsLeftSame > 0) {
        const last = newCards[newCards.length - 1] || null;
        if (last) {
          setRevealedCard(last);
          setShowRevealModal(true);
        }
      } else {
        // Last pack: close all related modals just like on sell flow
        setShowRevealModal(false);
        setRevealedCard(null);
      }

      toast({
        title: 'Колоды открыты',
        description: `Открыто ${count} колод(ы). Новых карт: ${newCards.length}`,
      });

      return newCards;
    } catch (error: unknown) {
      console.error('openCardPacks error', error);
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