import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ListingDialog } from "./ListingDialog";
import { MarketplaceListing } from "./types";
import { useBalanceState } from "@/hooks/useBalanceState";
import { Card as CardType } from "@/types/cards";
import { Item } from "@/types/inventory";

export const MarketplaceTab = () => {
  const { toast } = useToast();
  const [showListingDialog, setShowListingDialog] = useState(false);
  const { balance, updateBalance } = useBalanceState();
  const [listings, setListings] = useState<MarketplaceListing[]>(() => {
    const saved = localStorage.getItem('marketplaceListings');
    return saved ? JSON.parse(saved) : [];
  });

  const handleCreateListing = (listing: MarketplaceListing) => {
    const newListings = [...listings, listing];
    setListings(newListings);
    localStorage.setItem('marketplaceListings', JSON.stringify(newListings));
    setShowListingDialog(false);
    toast({
      title: "Предмет выставлен на продажу",
      description: `${listing.item.name} выставлен за ${listing.price} токенов`,
    });
  };

  const handleCancelListing = (listing: MarketplaceListing) => {
    // Remove listing
    const newListings = listings.filter(l => l.id !== listing.id);
    setListings(newListings);
    localStorage.setItem('marketplaceListings', JSON.stringify(newListings));

    // Return item to inventory/cards
    if (listing.type === 'item') {
      const currentInventory = JSON.parse(localStorage.getItem('gameInventory') || '[]');
      const newInventory = [...currentInventory, listing.item];
      localStorage.setItem('gameInventory', JSON.stringify(newInventory));
      
      const inventoryEvent = new CustomEvent('inventoryUpdate', { 
        detail: { inventory: newInventory }
      });
      window.dispatchEvent(inventoryEvent);
    } else {
      const currentCards = JSON.parse(localStorage.getItem('gameCards') || '[]');
      const newCards = [...currentCards, listing.item];
      localStorage.setItem('gameCards', JSON.stringify(newCards));
      
      const cardsEvent = new CustomEvent('cardsUpdate', { 
        detail: { cards: newCards }
      });
      window.dispatchEvent(cardsEvent);
    }

    toast({
      title: "Объявление отменено",
      description: `${listing.item.name} возвращен в ваш инвентарь`,
    });
  };

  const handleBuy = (listing: MarketplaceListing) => {
    if (listing.sellerId === 'current-user') {
      toast({
        title: "Ошибка",
        description: "Вы не можете купить свое собственное объявление",
        variant: "destructive",
      });
      return;
    }

    if (balance < listing.price) {
      toast({
        title: "Недостаточно токенов",
        description: "У вас недостаточно токенов для покупки",
        variant: "destructive",
      });
      return;
    }

    // Remove listing
    const newListings = listings.filter(l => l.id !== listing.id);
    setListings(newListings);
    localStorage.setItem('marketplaceListings', JSON.stringify(newListings));

    // Update balance
    updateBalance(balance - listing.price);

    // Add item to buyer's inventory/cards
    if (listing.type === 'item') {
      const currentInventory = JSON.parse(localStorage.getItem('gameInventory') || '[]');
      const newItem = {
        ...listing.item,
        id: Date.now() // Генерируем новый ID для предмета
      };
      const newInventory = [...currentInventory, newItem];
      localStorage.setItem('gameInventory', JSON.stringify(newInventory));
      
      const inventoryEvent = new CustomEvent('inventoryUpdate', { 
        detail: { inventory: newInventory }
      });
      window.dispatchEvent(inventoryEvent);
    } else {
      const currentCards = JSON.parse(localStorage.getItem('gameCards') || '[]');
      const newCard = {
        ...listing.item,
        id: Date.now() // Генерируем новый ID для карты
      };
      const newCards = [...currentCards, newCard];
      localStorage.setItem('gameCards', JSON.stringify(newCards));
      
      const cardsEvent = new CustomEvent('cardsUpdate', { 
        detail: { cards: newCards }
      });
      window.dispatchEvent(cardsEvent);
    }

    toast({
      title: "Покупка совершена",
      description: `${listing.item.name} добавлен в ваш инвентарь`,
    });
  };

  const getItemDisplayInfo = (item: CardType | Item) => {
    if ('rarity' in item) {
      return {
        rarity: item.rarity,
        type: 'Карта',
        description: `${(item as CardType).type === 'character' ? 'Герой' : 'Питомец'}`
      };
    }
    return {
      type: 'Предмет',
      description: item.type === 'healthPotion' ? 'Зелье здоровья' : 'Набор карт'
    };
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <ShoppingBag className="w-6 h-6" />
          Торговая площадка
        </h2>
        <Button
          onClick={() => setShowListingDialog(true)}
          className="bg-game-accent hover:bg-game-accent/80"
        >
          <Plus className="w-4 h-4 mr-2" />
          Создать объявление
        </Button>
      </div>

      {listings.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {listings.map((listing) => {
            const displayInfo = getItemDisplayInfo(listing.item);
            const isOwnListing = listing.sellerId === 'current-user';

            return (
              <Card key={listing.id} className="p-4 bg-game-surface border-game-accent">
                <div className="flex flex-col gap-2">
                  <h3 className="font-semibold text-game-accent">{listing.item.name}</h3>
                  <p className="text-sm text-gray-400">
                    {displayInfo.type}
                    {displayInfo.rarity && ` - Редкость: ${displayInfo.rarity}`}
                    <br />
                    {displayInfo.description}
                  </p>
                  <p className="text-yellow-500 font-medium">{listing.price} токенов</p>
                  {isOwnListing ? (
                    <Button
                      onClick={() => handleCancelListing(listing)}
                      variant="destructive"
                      className="w-full mt-2"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Отменить
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleBuy(listing)}
                      disabled={balance < listing.price}
                      className="w-full mt-2"
                    >
                      Купить
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400">
          На торговой площадке пока нет объявлений
        </div>
      )}

      {showListingDialog && (
        <ListingDialog
          onClose={() => setShowListingDialog(false)}
          onCreateListing={handleCreateListing}
        />
      )}
    </div>
  );
};
