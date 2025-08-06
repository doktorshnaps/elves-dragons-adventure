import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useGameData } from "@/hooks/useGameData";
import { MarketplaceListing } from "./types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getItemDisplayInfo } from "./utils";
import { ListingDialog } from "./ListingDialog";

export const MarketplaceTab = () => {
  const { toast } = useToast();
  const [showListingDialog, setShowListingDialog] = useState(false);
  const { gameData, updateGameData } = useGameData();
  const balance = gameData.balance;
  const navigate = useNavigate();
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
      description: `${listing.item.name} выставлен за ${listing.price} ELL`,
    });
  };

  const handleCancelListing = (listing: MarketplaceListing) => {
    const newListings = listings.filter(l => l.id !== listing.id);
    setListings(newListings);
    localStorage.setItem('marketplaceListings', JSON.stringify(newListings));

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

  const handleBuy = async (listing: MarketplaceListing) => {
    if (balance < listing.price) {
      toast({
        title: "Недостаточно ELL",
        description: "У вас недостаточно ELL для покупки",
        variant: "destructive",
      });
      return;
    }

    const newListings = listings.filter(l => l.id !== listing.id);
    setListings(newListings);
    localStorage.setItem('marketplaceListings', JSON.stringify(newListings));
    await updateGameData({ balance: balance - listing.price });

    if (listing.type === 'item') {
      const currentInventory = JSON.parse(localStorage.getItem('gameInventory') || '[]');
      const newInventory = [...currentInventory, { ...listing.item, id: Date.now() }];
      localStorage.setItem('gameInventory', JSON.stringify(newInventory));
      
      const inventoryEvent = new CustomEvent('inventoryUpdate', { 
        detail: { inventory: newInventory }
      });
      window.dispatchEvent(inventoryEvent);
    } else {
      const currentCards = JSON.parse(localStorage.getItem('gameCards') || '[]');
      const newCards = [...currentCards, { ...listing.item, id: Date.now() }];
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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Button 
          variant="outline" 
          className="bg-game-surface/80 border-game-accent text-game-accent hover:bg-game-surface"
          onClick={() => navigate('/menu')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Вернуться в меню
        </Button>
        <Button
          onClick={() => setShowListingDialog(true)}
          className="bg-game-accent hover:bg-game-accent/80"
        >
          Создать объявление
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {listings.map((listing) => {
          const displayInfo = getItemDisplayInfo(listing.item);
          const isOwnListing = listing.sellerId === 'current-user';

          return (
            <Card key={listing.id} className="p-4 bg-game-surface/90 border-game-accent backdrop-blur-sm">
              <div className="flex flex-col gap-2">
                <h3 className="font-semibold text-game-accent">{listing.item.name}</h3>
                <p className="text-sm text-gray-300">
                  {displayInfo.type}
                  {displayInfo.rarity && ` - Редкость: ${displayInfo.rarity}`}
                  <br />
                  {displayInfo.description}
                </p>
                <p className="text-yellow-500 font-medium">{listing.price} ELL</p>
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
                    className="w-full mt-2 bg-game-accent hover:bg-game-accent/80"
                  >
                    Купить
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {showListingDialog && (
        <ListingDialog
          onClose={() => setShowListingDialog(false)}
          onCreateListing={handleCreateListing}
        />
      )}
    </div>
  );
};