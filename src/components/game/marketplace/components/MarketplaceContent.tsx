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
  enableSelection?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  onBuySelected?: () => void;
}

export const MarketplaceContent = ({
  listings,
  balance,
  onOpenListingDialog,
  onBuy,
  onCancelListing,
  enableSelection,
  selectedIds,
  onToggleSelect,
  onBuySelected
}: MarketplaceContentProps) => {
  return (
    <div className="flex-1 bg-game-surface/90 p-4 rounded-lg border border-game-accent backdrop-blur-sm flex flex-col min-h-0">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-6 h-6 text-game-accent" />
          <span className="text-xl font-bold text-game-accent">Доступные предложения</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={onBuySelected}
            className="bg-game-accent hover:bg-game-accent/80"
          >
            <ShoppingBag className="w-4 h-4 mr-2" />
            Купить выбранные
          </Button>
          <Button
            onClick={onOpenListingDialog}
            className="bg-game-accent hover:bg-game-accent/80"
          >
            <Plus className="w-4 h-4 mr-2" />
            Создать объявление
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <MarketplaceListings 
          listings={listings}
          balance={balance}
          onBuy={onBuy}
          onCancelListing={onCancelListing}
          enableSelection={enableSelection}
          selectedIds={selectedIds}
          onToggleSelect={onToggleSelect}
        />
      </div>
    </div>
  );
};