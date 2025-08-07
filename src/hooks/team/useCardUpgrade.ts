import { Card as CardType } from "@/types/cards";
import { useToast } from '@/hooks/use-toast';
import { upgradeCard } from '@/utils/cardUtils';
import { useDragonEggs } from '@/contexts/DragonEggContext';
import { useGameData } from '@/hooks/useGameData';
import { Item } from '@/types/inventory';

export const useCardUpgrade = (
  cards: CardType[],
  setCards: (cards: CardType[]) => void,
  selectedCards: CardType[],
  setSelectedCards: (cards: CardType[]) => void
) => {
  const { toast } = useToast();
  const { addEgg } = useDragonEggs();
  const { gameData, updateGameData } = useGameData();

  const handleUpgrade = async () => {
    if (selectedCards.length !== 2) {
      toast({
        title: "Ошибка улучшения",
        description: "Выберите две одинаковые карты для улучшения",
        variant: "destructive",
      });
      return;
    }

    const upgradedCard = upgradeCard(selectedCards[0], selectedCards[1]);
    
    if (!upgradedCard) {
      toast({
        title: "Ошибка улучшения",
        description: "Выбранные карты должны быть одинаковыми и иметь одинаковую редкость",
        variant: "destructive",
      });
      return;
    }

    // Удаляем выбранные карты из общего списка
    const newCards = cards.filter(c => !selectedCards.some(sc => sc.id === c.id));

    if (selectedCards[0].type === 'pet') {
      // Для питомцев создаем яйцо и добавляем его в инвентарь
      const eggId = Date.now().toString();
      const createdAt = new Date().toISOString();

addEgg({
        id: eggId,
        petName: upgradedCard.name,
        rarity: upgradedCard.rarity,
        createdAt,
        faction: upgradedCard.faction || 'Каледор',
        incubationStarted: false,
      }, upgradedCard.faction || 'Каледор');

      const eggItem: Item = {
        id: eggId,
        name: 'Яйцо дракона',
        type: 'dragon_egg',
        value: upgradedCard.rarity,
        description: `${upgradedCard.name}`,
        image: '/lovable-uploads/8a069dd4-47ad-496c-a248-f796257f9233.png',
        petName: upgradedCard.name,
      };
      await updateGameData({ inventory: [ ...(gameData.inventory || []), eggItem ] });

      toast({
        title: "Создано яйцо дракона!",
        description: `Улучшенный питомец появится через некоторое время`,
      });
    } else {
      // Для героев добавляем улучшенную карту
      newCards.push(upgradedCard);
      toast({
        title: "Карта улучшена!",
        description: `${upgradedCard.name} теперь имеет редкость ${upgradedCard.rarity}`,
      });
    }

// Обновляем состояние, Supabase и localStorage
    setCards(newCards);
    await updateGameData({ cards: newCards });
    localStorage.setItem('gameCards', JSON.stringify(newCards));

    // Отправляем событие обновления карт
    const cardsEvent = new CustomEvent('cardsUpdate', { 
      detail: { cards: newCards }
    });
    window.dispatchEvent(cardsEvent);

    // Очищаем выбранные карты
    setSelectedCards([]);
  };

  return { handleUpgrade };
};