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
import { useGameStore } from "@/stores/gameStore";

export const MarketplaceTab = () => {
  const { toast } = useToast();
  const [showListingDialog, setShowListingDialog] = useState(false);
  const { gameData, updateGameData } = useGameData();
  // Use Zustand store instead of localStorage
  const balance = useGameStore(state => state.balance);
  const inventory = useGameStore(state => state.inventory);
  const cards = useGameStore(state => state.cards);
  const { addItem, addCard, setBalance } = useGameStore();
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

    // Use Zustand store instead of localStorage
    if (listing.type === 'item') {
      addItem(listing.item as any);
    } else {
      addCard(listing.item as any);
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
    
    // Use Zustand store instead of localStorage - server validates balance
    await updateGameData({ balance: balance - listing.price });
    setBalance(balance - listing.price);

    if (listing.type === 'item') {
      addItem({ ...listing.item, id: Date.now().toString() } as any);
    } else {
      addCard({ ...listing.item, id: Date.now().toString() } as any);
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
          variant="menu"
          style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}
          onClick={() => navigate('/menu')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Вернуться в меню
        </Button>
        <Button
          onClick={() => setShowListingDialog(true)}
          variant="menu"
          style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}
        >
          Создать объявление
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {listings.map((listing) => {
          const displayInfo = getItemDisplayInfo(listing.item);
          const isOwnListing = listing.sellerId === 'current-user';

          return (
            <Card key={listing.id} variant="menu" className="p-4" style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}>
              <div className="flex flex-col gap-2">
                <h3 className="font-semibold text-white">{listing.item.name}</h3>
                <p className="text-sm text-white/80">
                  {displayInfo.type}
                  {displayInfo.rarity && ` - Редкость: ${displayInfo.rarity}`}
                  <br />
                  {displayInfo.description}
                </p>
                <p className="text-yellow-400 font-medium">{listing.price} ELL</p>
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
                    variant="menu"
                    className="w-full mt-2"
                    style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}
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