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
    <div 
      className="flex-1 bg-black/50 p-4 rounded-3xl border-2 border-white backdrop-blur-sm h-[calc(100vh-120px)] overflow-y-auto"
      style={{ 
        touchAction: 'pan-y',
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'contain',
        msOverflowStyle: '-ms-autohiding-scrollbar',
        scrollBehavior: 'smooth',
        WebkitUserSelect: 'none',
        userSelect: 'none',
        boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)'
      }}
    >
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-6 h-6 text-white" />
          <span className="text-xl font-bold text-white">Доступные предложения</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={onBuySelected}
            variant="menu"
            style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}
          >
            <ShoppingBag className="w-4 h-4 mr-2" />
            Купить выбранные
          </Button>
          <Button
            onClick={onOpenListingDialog}
            variant="menu"
            style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Создать объявление
          </Button>
        </div>
      </div>

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
  );
};