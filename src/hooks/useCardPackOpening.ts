import { useState } from 'react';
import { Item } from "@/types/inventory";
import { Card as CardType } from "@/types/cards";
import { useGameData } from '@/hooks/useGameData';
import { useToast } from '@/hooks/use-toast';
import { generateCard } from '@/utils/cardUtils';
import { supabase } from '@/integrations/supabase/client';
import { useWallet } from '@/hooks/useWallet';

export const useCardPackOpening = () => {
  const { gameData, loadGameData } = useGameData();
  const { toast } = useToast();
  const { accountId } = useWallet();
  const [isOpening, setIsOpening] = useState(false);
  const [revealedCard, setRevealedCard] = useState<CardType | null>(null);
  const [showRevealModal, setShowRevealModal] = useState(false);
  const [cardQueue, setCardQueue] = useState<CardType[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

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
    console.log('🎴 Starting openCardPacks process');

    try {
      // Генерируем карты, которые будет содержать открытие
      const newCards: CardType[] = Array.from({ length: count }, () =>
        generateCard(Math.random() > 0.5 ? 'character' : 'pet')
      );
      
      console.log('🎴 Generated cards:', newCards);

      // Вызываем edge function для открытия колод
      console.log('🎴 Calling edge function with:', { accountId, packName: packItem.name, count, cardsCount: newCards.length });
      
      const { data, error } = await supabase.functions.invoke('open-card-packs', {
        body: {
          p_wallet_address: accountId,
          p_pack_name: packItem.name,
          p_count: count,
          p_new_cards: newCards
        }
      });

      if (error) {
        console.error('🎴 Edge function error:', error);
        toast({
          title: 'Ошибка',
          description: 'Не удалось открыть колоды карт: ' + error.message,
          variant: 'destructive',
        });
        return [];
      }
      
      console.log('🎴 Edge function response:', data);

      // Обновляем локальные данные из Supabase чтобы исключить рассинхрон
      await loadGameData();

      console.log('🎴 Cards generated for animation:', newCards);
      
      // Если получены карты, показываем их по очереди
      if (newCards.length > 0) {
        setCardQueue(newCards);
        setCurrentCardIndex(0);
        setRevealedCard(newCards[0]);
        console.log('🎴 Setting showRevealModal to true, card:', newCards[0]);
        setShowRevealModal(true);
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
    setCardQueue([]);
    setCurrentCardIndex(0);
  };

  const showNextCard = () => {
    const nextIndex = currentCardIndex + 1;
    if (nextIndex < cardQueue.length) {
      setCurrentCardIndex(nextIndex);
      setRevealedCard(cardQueue[nextIndex]);
    } else {
      closeRevealModal();
    }
  };

  return {
    openCardPack,
    openCardPacks,
    isOpening,
    revealedCard,
    showRevealModal,
    closeRevealModal,
    showNextCard,
    currentCardIndex,
    totalCards: cardQueue.length
  };
};