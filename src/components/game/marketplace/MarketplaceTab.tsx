import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Plus, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ListingDialog } from "./ListingDialog";
import { MarketplaceListing } from "./types";
import { useBalanceState } from "@/hooks/useBalanceState";
import { MarketplaceListings } from "./MarketplaceListings";
import { useNavigate } from "react-router-dom";

export const MarketplaceTab = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
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

    const newListings = listings.filter(l => l.id !== listing.id);
    setListings(newListings);
    localStorage.setItem('marketplaceListings', JSON.stringify(newListings));
    updateBalance(balance - listing.price);

    if (listing.type === 'item') {
      const currentInventory = JSON.parse(localStorage.getItem('gameInventory') || '[]');
      const newItem = {
        ...listing.item,
        id: Date.now()
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
        id: Date.now()
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

  return (
    <div 
      className="min-h-screen p-4"
      style={{
        backgroundImage: "url('/lovable-uploads/9ec81c2e-643f-4e30-b019-c3721a2bafc2.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="max-w-7xl mx-auto space-y-4 bg-black/40 p-6 rounded-lg backdrop-blur-sm">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => navigate('/game')}
              className="bg-purple-600/80 hover:bg-purple-700 text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Вернуться в игру
            </Button>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <ShoppingBag className="w-6 h-6" />
              Торговая площадка
            </h2>
          </div>
          <Button
            onClick={() => setShowListingDialog(true)}
            className="bg-game-accent hover:bg-game-accent/80"
          >
            <Plus className="w-4 h-4 mr-2" />
            Создать объявление
          </Button>
        </div>

        <MarketplaceListings 
          listings={listings}
          balance={balance}
          onBuy={handleBuy}
          onCancelListing={handleCancelListing}
        />

        {showListingDialog && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <ListingDialog
              onClose={() => setShowListingDialog(false)}
              onCreateListing={handleCreateListing}
            />
          </div>
        )}
      </div>
    </div>
  );
};