import React from 'react';
import { Button } from "@/components/ui/button";
import { ShoppingBag, Plus } from "lucide-react";
import { MarketplaceListing } from "../types";
import { MarketplaceListings } from "../MarketplaceListings";

interface MarketplaceContentProps {
  listings: MarketplaceListing[];
  balance: number;
  onOpenListingDialog: () => void;
  onBuy: (listing: MarketplaceListing) => void;
  onCancelListing: (listing: MarketplaceListing) => void;
}

export const MarketplaceContent = ({
  listings,
  balance,
  onOpenListingDialog,
  onBuy,
  onCancelListing
}: MarketplaceContentProps) => {
  return (
    <div 
      className="flex-1 bg-game-surface/90 p-4 rounded-lg border border-game-accent backdrop-blur-sm h-[calc(100vh-120px)] overflow-y-auto"
      style={{ 
        touchAction: 'pan-y',
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'contain',
        msOverflowStyle: '-ms-autohiding-scrollbar',
        scrollBehavior: 'smooth',
        WebkitUserSelect: 'none',
        userSelect: 'none'
      }}
    >
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-6 h-6 text-game-accent" />
          <span className="text-xl font-bold text-game-accent">Доступные предложения</span>
        </div>
        <Button
          onClick={onOpenListingDialog}
          className="bg-game-accent hover:bg-game-accent/80"
        >
          <Plus className="w-4 h-4 mr-2" />
          Создать объявление
        </Button>
      </div>

      <MarketplaceListings 
        listings={listings}
        balance={balance}
        onBuy={onBuy}
        onCancelListing={onCancelListing}
      />
    </div>
  );
};