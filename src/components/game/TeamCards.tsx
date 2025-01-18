import { useState, useEffect } from "react";
import { Card as CardType } from "@/types/cards";
import { CardDisplay } from "./CardDisplay";
import { useToast } from "@/hooks/use-toast";
import { getCardPrice, upgradeCard } from "@/utils/cardUtils";
import { Button } from "@/components/ui/button";
import { ArrowUpCircle } from "lucide-react";
import { useDragonEggs } from "@/contexts/DragonEggContext";
import { Badge } from "@/components/ui/badge";

export const TeamCards = () => {
  const { toast } = useToast();
  const { eggs, addEgg } = useDragonEggs();
  const [cards, setCards] = useState<CardType[]>(() => {
    const savedCards = localStorage.getItem('gameCards');
    return savedCards ? JSON.parse(savedCards) : [];
  });

  const [selectedCards, setSelectedCards] = useState<CardType[]>([]);

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

  const handleSellCard = (card: CardType) => {
    const newCards = cards.filter(c => c.id !== card.id);
    setCards(newCards);
    localStorage.setItem('gameCards', JSON.stringify(newCards));

    const price = getCardPrice(card.rarity);
    const currentBalance = Number(localStorage.getItem('gameBalance') || '0');
    const newBalance = currentBalance + price;
    localStorage.setItem('gameBalance', newBalance.toString());

    const cardsEvent = new CustomEvent('cardsUpdate', { 
      detail: { cards: newCards }
    });
    window.dispatchEvent(cardsEvent);

    const balanceEvent = new CustomEvent('balanceUpdate', { 
      detail: { balance: newBalance }
    });
    window.dispatchEvent(balanceEvent);

    toast({
      title: "Карта продана",
      description: `Вы получили ${price} токенов`,
    });
  };

  const handleCardSelect = (card: CardType, groupCount: number) => {
    if (groupCount < 2) {
      toast({
        title: "Недостаточно карт",
        description: "Для улучшения нужно минимум 2 одинаковые карты",
        variant: "destructive",
      });
      return;
    }

    const sameCards = cards.filter(c => 
      c.name === card.name && 
      c.rarity === card.rarity && 
      c.type === card.type && 
      c.faction === card.faction
    );

    // Если карты уже выбраны, снимаем выбор со всех карт этой группы
    if (selectedCards.some(c => sameCards.find(sc => sc.id === c.id))) {
      setSelectedCards([]);
      return;
    }

    // Если карты не выбраны, выбираем первые две карты из группы
    if (selectedCards.length === 0) {
      setSelectedCards(sameCards.slice(0, 2));
    } else {
      // Проверяем совместимость с уже выбранной картой
      const firstSelected = selectedCards[0];
      if (
        firstSelected.name === card.name &&
        firstSelected.rarity === card.rarity &&
        firstSelected.type === card.type &&
        firstSelected.faction === card.faction
      ) {
        setSelectedCards([...selectedCards, sameCards[0]]);
      } else {
        toast({
          title: "Несовместимые карты",
          description: "Выберите карты одного типа и редкости",
          variant: "destructive",
        });
      }
    }
  };

  const handleUpgrade = () => {
    if (selectedCards.length !== 2) return;

    const upgradedCard = upgradeCard(selectedCards[0], selectedCards[1]);
    
    if (!upgradedCard) {
      toast({
        title: "Ошибка улучшения",
        description: "Выбранные карты должны быть одинаковыми и иметь одинаковую редкость",
        variant: "destructive",
      });
      return;
    }

    const newCards = cards.filter(c => !selectedCards.find(sc => sc.id === c.id));

    if (selectedCards[0].type === 'pet') {
      // Добавляем яйцо в контекст
      addEgg(upgradedCard, upgradedCard.rarity);

      // Добавляем яйцо в инвентарь
      const currentInventory = localStorage.getItem('gameInventory');
      const inventory = currentInventory ? JSON.parse(currentInventory) : [];
      
      const newEggItem = {
        id: Date.now().toString(),
        name: `Яйцо ${upgradedCard.name}`,
        type: 'dragon_egg',
        description: `Фракция: ${upgradedCard.faction}, Редкость: ${upgradedCard.rarity}`,
        value: upgradedCard.rarity,
        image: upgradedCard.image
      };
      
      inventory.push(newEggItem);
      localStorage.setItem('gameInventory', JSON.stringify(inventory));

      // Отправляем событие обновления инвентаря
      const inventoryEvent = new CustomEvent('inventoryUpdate', {
        detail: { inventory }
      });
      window.dispatchEvent(inventoryEvent);

      toast({
        title: "Создано яйцо дракона!",
        description: `Улучшенный питомец появится через некоторое время`,
      });
    } else {
      newCards.push(upgradedCard);
      toast({
        title: "Карта улучшена!",
        description: `${upgradedCard.name} теперь имеет редкость ${upgradedCard.rarity}`,
      });
    }

    setCards(newCards);
    localStorage.setItem('gameCards', JSON.stringify(newCards));

    const cardsEvent = new CustomEvent('cardsUpdate', { 
      detail: { cards: newCards }
    });
    window.dispatchEvent(cardsEvent);

    setSelectedCards([]);
  };

  const heroes = cards.filter(card => card.type === 'character');
  const isPetActive = (pet: CardType): boolean => {
    if (!pet.faction) return false;
    return heroes.some(hero => 
      hero.type === 'character' && 
      hero.faction === pet.faction && 
      hero.rarity >= pet.rarity
    );
  };

  // Группировка одинаковых карт
  const groupedCards = cards.reduce<{ [key: string]: CardType[] }>((acc, card) => {
    const key = `${card.name}-${card.rarity}-${card.type}-${card.faction || ''}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(card);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {selectedCards.length > 0 && (
        <div className="flex items-center justify-between bg-game-surface p-4 rounded-lg">
          <span className="text-white">
            Выбрано карт: {selectedCards.length}/2
          </span>
          {selectedCards.length === 2 && (
            <Button
              onClick={handleUpgrade}
              className="bg-game-accent hover:bg-game-accent/80"
            >
              <ArrowUpCircle className="w-4 h-4 mr-2" />
              Улучшить
            </Button>
          )}
        </div>
      )}
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
        {Object.values(groupedCards).length > 0 ? (
          Object.values(groupedCards).map((cardGroup) => (
            <div
              key={cardGroup[0].id}
              className={`cursor-pointer transition-all duration-300 relative ${
                selectedCards.find(c => c.id === cardGroup[0].id)
                  ? 'ring-2 ring-game-accent rounded-lg'
                  : ''
              }`}
              onClick={() => handleCardSelect(cardGroup[0], cardGroup.length)}
            >
              <CardDisplay
                card={cardGroup[0]}
                showSellButton={true}
                onSell={handleSellCard}
                isActive={cardGroup[0].type === 'character' || isPetActive(cardGroup[0])}
              />
              {cardGroup.length > 1 && (
                <Badge 
                  className="absolute top-1 right-1 bg-game-accent text-white"
                  variant="default"
                >
                  x{cardGroup.length}
                </Badge>
              )}
            </div>
          ))
        ) : (
          <p className="text-gray-400 col-span-full text-center py-8">
            У вас пока нет карт
          </p>
        )}
      </div>
    </div>
  );
};