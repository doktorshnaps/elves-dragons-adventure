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
    let updated: Item[] = [];

    const preferredIds = new Set<string>([String(referencePack.id)]);

    // Pass 1: remove the exact referenced pack by id first
    for (const it of inv) {
      if (
        removed < count &&
        it.type === 'cardPack' &&
        preferredIds.has(String(it.id))
      ) {
        removed += 1;
        continue;
      }
      updated.push(it);
    }

    // Pass 2: remove by same name/type
    if (removed < count) {
      const tmp: Item[] = [];
      for (const it of updated) {
        if (removed < count && it.type === 'cardPack' && it.name === referencePack.name) {
          removed += 1;
          continue;
        }
        tmp.push(it);
      }
      updated = tmp;
    }

    // Pass 3: remove any remaining cardPack (fallback)
    if (removed < count) {
      const tmp: Item[] = [];
      for (const it of updated) {
        if (removed < count && it.type === 'cardPack') {
          removed += 1;
          continue;
        }
        tmp.push(it);
      }
      updated = tmp;
    }

    return { updatedInventory: updated, removedCount: removed };
  };

  const openCardPacks = async (packItem: Item, count: number): Promise<CardType[]> => {
    if (packItem.type !== 'cardPack' || isOpening) return [];

    const allPacks = (gameData.inventory || []).filter(i => i.type === 'cardPack');
    const available = allPacks.length;

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

      // Keep localStorage and listeners in sync to immediately disable selling
      try {
        localStorage.setItem('gameInventory', JSON.stringify(updatedInventory));
        localStorage.setItem('gameCards', JSON.stringify(updatedCards));
        window.dispatchEvent(new CustomEvent('inventoryUpdate', { detail: { inventory: updatedInventory } }));
        window.dispatchEvent(new CustomEvent('cardsUpdate', { detail: { cards: updatedCards } }));
      } catch {}

      // Packs left of the same type/name
      const packsLeftSame = updatedInventory.filter(i => i.type === 'cardPack' && i.name === packItem.name).length;

      if (packsLeftSame > 0) {
        // Show reveal modal only if есть ещё колоды, как при продаже диалог остаётся
        const last = newCards[newCards.length - 1] || null;
        if (last) {
          setRevealedCard(last);
          setShowRevealModal(true);
        }
      } else {
        // Последняя колода: закрываем модальные окна сразу, чтобы повторно нельзя было продать
        setShowRevealModal(false);
        setRevealedCard(null);
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