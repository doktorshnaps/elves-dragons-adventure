import { useState, useEffect } from "react";
import { Card as CardType } from "@/types/cards";
import { useCardSelection } from "./useCardSelection";
import { useCardManagement } from "./useCardManagement";
import { useCardUpgrade } from "./useCardUpgrade";
import { useCards } from "@/hooks/useCards";

/**
 * РЕФАКТОРИНГ: Теперь использует useCards() как единый источник правды
 * вместо gameStore.cards
 */
export const useTeamCards = () => {
  const { cards: cardsFromInstances, loading } = useCards();
  const [cards, setCards] = useState<CardType[]>(cardsFromInstances);

  const {
    selectedCards,
    setSelectedCards,
    handleCardSelect
  } = useCardSelection(cards);

  const { handleSellCard } = useCardManagement(cards, setCards, setSelectedCards);
  const { handleUpgrade } = useCardUpgrade(cards, setCards, selectedCards, setSelectedCards);

  // Синхронизируем с card_instances
  useEffect(() => {
    setCards(cardsFromInstances);
  }, [cardsFromInstances]);

  return {
    cards,
    selectedCards,
    handleSellCard,
    handleCardSelect,
    handleUpgrade,
    loading
  };
};