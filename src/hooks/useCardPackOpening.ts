import { useState } from 'react';
import { Item } from "@/types/inventory";
import { Card as CardType } from "@/types/cards";
import { useGameData } from '@/hooks/useGameData';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useWalletContext } from '@/contexts/WalletConnectContext';
import { useQueryClient } from '@tanstack/react-query';

export const useCardPackOpening = () => {
  const { gameData, loadGameData } = useGameData();
  const { toast } = useToast();
  const { accountId } = useWalletContext();
  const queryClient = useQueryClient();
  const [isOpening, setIsOpening] = useState(false);
  const [revealedCard, setRevealedCard] = useState<CardType | null>(null);
  const [showRevealModal, setShowRevealModal] = useState(false);
  const [cardQueue, setCardQueue] = useState<CardType[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [skipAnimations, setSkipAnimations] = useState(false);

  // Card pack removal is now handled by item_instances, not inventory
  const removeCardPacksFromInventory = (count: number, referencePack: Item) => {
    return { updatedInventory: [], removedCount: count };
  };

  const openCardPacks = async (packItem: Item, count: number): Promise<CardType[]> => {
    console.log('🔔 openCardPacks CALLED START', { 
      packItemName: packItem.name, 
      packItemType: packItem.type,
      count, 
      isOpening,
      packItem 
    });
    
    if (packItem.type !== 'cardPack' || isOpening) {
      console.log('❌ Early exit:', { 
        reason: packItem.type !== 'cardPack' ? 'not a cardPack' : 'already opening',
        packItemType: packItem.type,
        isOpening 
      });
      return [];
    }

    // Card packs are now tracked in item_instances, count validation should happen there
    if (count < 1) return [];

    setIsOpening(true);

    try {
      // Вызываем edge function для генерации карт с серверным логированием
      console.log(`🎁 Calling edge function to open ${count} card pack(s)...`);
      
      const { data, error } = await supabase.functions.invoke('open-card-packs', {
        body: {
          wallet_address: accountId,
          pack_name: packItem.name,
          count: count
        }
      });
      
      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }
      
      const newCards = data.cards as CardType[];

      console.log(`📦 Received ${newCards.length} cards from edge function`);

      // КРИТИЧНО: Инвалидируем кеш React Query для немедленного обновления UI
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['itemInstances', accountId] }),
        queryClient.invalidateQueries({ queryKey: ['cardInstances', accountId] })
      ]);
      
      console.log('✅ Cache invalidated for itemInstances and cardInstances');

      // Если получены карты, показываем их по очереди
      if (newCards.length > 0) {
        setCardQueue(newCards);
        setCurrentCardIndex(0);
        setRevealedCard(newCards[0]);
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
    setSkipAnimations(false);
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

  const skipAllAnimations = () => {
    setSkipAnimations(true);
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
    totalCards: cardQueue.length,
    skipAnimations,
    skipAllAnimations
  };
};