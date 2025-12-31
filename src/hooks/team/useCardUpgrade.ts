import { Card as CardType } from "@/types/cards";
import { useQueryClient } from '@tanstack/react-query';
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
  const queryClient = useQueryClient();

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
      // Для питомцев теперь не создаем яйцо, а отправляем на улучшение в Драконье Логово
      // Логика улучшения будет в самом Драконьем Логове
      toast({
        title: "Карты драконов выбраны!",
        description: `Перейдите в Драконье Логово в убежище для улучшения`,
      });
      
      // Для драконов просто очищаем выбранные карты, не добавляем улучшенную карту
      setSelectedCards([]);
      return;
    } else {
      // Для героев добавляем улучшенную карту
      newCards.push(upgradedCard);
      toast({
        title: "Карта улучшена!",
        description: `${upgradedCard.name} теперь имеет редкость ${upgradedCard.rarity}`,
      });
    }

// Обновляем состояние и Supabase (localStorage убран - данные только в React Query)
    setCards(newCards);
    await updateGameData({ cards: newCards });

    // Invalidate React Query caches
    queryClient.invalidateQueries({ queryKey: ['cardInstances'] });

    // Очищаем выбранные карты
    setSelectedCards([]);
  };

  return { handleUpgrade };
};