import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { generatePack } from "@/utils/cardUtils";
import { Card } from "@/types/cards";

export const useGameInitialization = (setCards: (cards: Card[]) => void) => {
  const { toast } = useToast();

  useEffect(() => {
    const savedCards = localStorage.getItem('gameCards');
    const isFirstLaunch = !localStorage.getItem('gameInitialized');

    if (isFirstLaunch) {
      const firstPack = generatePack();
      const secondPack = generatePack();
      const initialCards = [...firstPack, ...secondPack];
      
      localStorage.setItem('gameCards', JSON.stringify(initialCards));
      localStorage.setItem('gameInitialized', 'true');
      
      setCards(initialCards);
      
      toast({
        title: "Добро пожаловать в игру!",
        description: "Вы получили 2 начальные колоды карт",
      });
    } else if (savedCards) {
      setCards(JSON.parse(savedCards));
    }
  }, [setCards, toast]);
};