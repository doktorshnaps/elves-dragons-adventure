import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ListingDialog } from "./ListingDialog";
import { MarketplaceListing } from "./types";
import { useBalanceState } from "@/hooks/useBalanceState";

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

  const handleBuy = (listing: MarketplaceListing) => {
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
      const currentInventory = localStorage.getItem('gameInventory');
      const inventory = currentInventory ? JSON.parse(currentInventory) : [];
      inventory.push(listing.item);
      localStorage.setItem('gameInventory', JSON.stringify(inventory));
      
      const inventoryEvent = new CustomEvent('inventoryUpdate', { 
        detail: { inventory }
      });
      window.dispatchEvent(inventoryEvent);
    } else {
      const currentCards = localStorage.getItem('gameCards');
      const cards = currentCards ? JSON.parse(currentCards) : [];
      cards.push(listing.item);
      localStorage.setItem('gameCards', JSON.stringify(cards));
      
      const cardsEvent = new CustomEvent('cardsUpdate', { 
        detail: { cards }
      });
      window.dispatchEvent(cardsEvent);
    }

    toast({
      title: "Покупка совершена",
      description: `${listing.item.name} добавлен в ваш инвентарь`,
    });
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
          {listings.map((listing) => (
            <Card key={listing.id} className="p-4 bg-game-surface border-game-accent">
              <div className="flex flex-col gap-2">
                <h3 className="font-semibold text-game-accent">{listing.item.name}</h3>
                <p className="text-sm text-gray-400">
                  {listing.type === 'card' ? (
                    <>
                      {listing.item.type === 'character' ? 'Герой' : 'Питомец'} - 
                      Редкость: {listing.item.rarity}
                    </>
                  ) : (
                    'Предмет'
                  )}
                </p>
                <p className="text-yellow-500 font-medium">{listing.price} токенов</p>
                <Button
                  onClick={() => handleBuy(listing)}
                  disabled={balance < listing.price}
                  className="w-full mt-2"
                >
                  Купить
                </Button>
              </div>
            </Card>
          ))}
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