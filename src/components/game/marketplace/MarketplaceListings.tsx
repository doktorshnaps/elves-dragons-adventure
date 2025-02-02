import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { MarketplaceListing } from "./types";
import { getItemDisplayInfo } from "./utils";

interface MarketplaceListingsProps {
  listings: MarketplaceListing[];
  balance: number;
  onBuy: (listing: MarketplaceListing) => void;
  onCancelListing: (listing: MarketplaceListing) => void;
}

export const MarketplaceListings = ({
  listings,
  balance,
  onBuy,
  onCancelListing,
}: MarketplaceListingsProps) => {
  if (listings.length === 0) {
    return (
      <div className="text-center py-8 text-gray-300 backdrop-blur-sm bg-black/30 rounded-lg">
        На торговой площадке пока нет объявлений
      </div>
    );
  }

  return (
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
              <p className="text-yellow-500 font-medium">{listing.price} токенов</p>
              {isOwnListing ? (
                <Button
                  onClick={() => onCancelListing(listing)}
                  variant="destructive"
                  className="w-full mt-2"
                >
                  <X className="w-4 h-4 mr-2" />
                  Отменить
                </Button>
              ) : (
                <Button
                  onClick={() => onBuy(listing)}
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
  );
};