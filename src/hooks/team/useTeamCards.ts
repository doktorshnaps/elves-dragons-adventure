import { useState, useEffect } from "react";
import { Card as CardType } from "@/types/cards";
import { useCardSelection } from "./useCardSelection";
import { useCardManagement } from "./useCardManagement";
import { useCardUpgrade } from "./useCardUpgrade";
import { useCardHealthSync } from "@/hooks/useCardHealthSync";
import { useGameStore } from "@/stores/gameStore";

export const useTeamCards = () => {
  const gameCards = useGameStore((state) => state.cards);
  const [cards, setCards] = useState<CardType[]>(gameCards);

  const {
    selectedCards,
    setSelectedCards,
    handleCardSelect
  } = useCardSelection(cards);

  const { handleSellCard } = useCardManagement(cards, setCards, setSelectedCards);
  const { handleUpgrade } = useCardUpgrade(cards, setCards, selectedCards, setSelectedCards);

  // Use health synchronization
  useCardHealthSync();

  // Синхронизируем с store
  useEffect(() => {
    setCards(gameCards);
  }, [gameCards]);

  return {
    cards,
    selectedCards,
    handleSellCard,
    handleCardSelect,
    handleUpgrade
  };
};