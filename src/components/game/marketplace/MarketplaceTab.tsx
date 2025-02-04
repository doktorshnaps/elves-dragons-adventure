import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useBalanceState } from "@/hooks/useBalanceState";
import { MarketplaceListing } from "./types";
import { ListingDialog } from "./ListingDialog";
import { MarketplaceLayout } from "./components/MarketplaceLayout";
import { MarketplaceHeader } from "./components/MarketplaceHeader";
import { MarketplaceContent } from "./components/MarketplaceContent";

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
    <MarketplaceLayout>
      <MarketplaceHeader />
      
      <MarketplaceContent
        listings={listings}
        balance={balance}
        onOpenListingDialog={() => setShowListingDialog(true)}
        onBuy={handleBuy}
        onCancelListing={handleCancelListing}
      />

      {showListingDialog && (
        <ListingDialog
          onClose={() => setShowListingDialog(false)}
          onCreateListing={handleCreateListing}
        />
      )}
    </MarketplaceLayout>
  );
};