import { useState, useEffect } from "react";
import { Card as CardType } from "@/types/cards";
import { useCardSelection } from "./useCardSelection";
import { useCardManagement } from "./useCardManagement";
import { useCardUpgrade } from "./useCardUpgrade";
import { useCardHealthSync } from "@/hooks/useCardHealthSync";

export const useTeamCards = () => {
  const [cards, setCards] = useState<CardType[]>(() => {
    const savedCards = localStorage.getItem('gameCards');
    return savedCards ? JSON.parse(savedCards) : [];
  });

  const {
    selectedCards,
    setSelectedCards,
    handleCardSelect
  } = useCardSelection(cards);

  const { handleSellCard } = useCardManagement(cards, setCards, setSelectedCards);
  const { handleUpgrade } = useCardUpgrade(cards, setCards, selectedCards, setSelectedCards);

  // Use health synchronization
  useCardHealthSync();

  useEffect(() => {
    const handleCardsUpdate = (e: CustomEvent<{ cards: CardType[] }>) => {
      setCards(e.detail.cards);
    };

    const handleStorageChange = () => {
      const savedCards = localStorage.getItem('gameCards');
      if (savedCards) {
        setCards(JSON.parse(savedCards));
      }
    };

    window.addEventListener('cardsUpdate', handleCardsUpdate as EventListener);
    window.addEventListener('storage', handleStorageChange);

    const interval = setInterval(handleStorageChange, 500);

    return () => {
      window.removeEventListener('cardsUpdate', handleCardsUpdate as EventListener);
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  return {
    cards,
    selectedCards,
    handleSellCard,
    handleCardSelect,
    handleUpgrade
  };
};