import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { MarketplaceListing } from "./types";
import { getItemDisplayInfo } from "./utils";
import { useWalletContext } from "@/contexts/WalletConnectContext";

interface MarketplaceListingsProps {
  listings: MarketplaceListing[];
  balance: number;
  onBuy: (listing: MarketplaceListing) => void;
  onCancelListing: (listing: MarketplaceListing) => void;
  enableSelection?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
}

export const MarketplaceListings = ({
  listings,
  balance,
  onBuy,
  onCancelListing,
  enableSelection,
  selectedIds,
  onToggleSelect,
}: MarketplaceListingsProps) => {
  const { accountId } = useWalletContext();
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
        const isOwnListing = listing.sellerId === accountId;
        const isCard = "rarity" in listing.item;

        return (
          <Card key={listing.id} className="p-4 bg-game-surface/90 border-game-accent backdrop-blur-sm">
            <div className="relative flex flex-col gap-3">
              {enableSelection && !isOwnListing && typeof onToggleSelect === 'function' && (
                <label className="absolute top-2 left-2 z-10 flex items-center gap-1 text-xs select-none">
                  <input
                    type="checkbox"
                    checked={!!(selectedIds && selectedIds.has(listing.id))}
                    onChange={() => onToggleSelect(listing.id)}
                    className="h-4 w-4 accent-current text-game-accent"
                  />
                  <span className="text-game-accent">Выбрать</span>
                </label>
              )}

              {displayInfo.image && (
                <div className="w-full aspect-[4/3] overflow-hidden rounded-md border border-game-accent/50">
                  <img
                    src={displayInfo.image}
                    alt={`Изображение ${displayInfo.type === "Карта" ? "карты" : "предмета"} ${listing.item.name}`}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </div>
              )}

              <h3 className="font-semibold text-game-accent">{listing.item.name}</h3>

              <div className="text-sm text-gray-300 space-y-1">
                <p>
                  {displayInfo.type}
                  {isCard && (displayInfo as any).rarity && ` - Редкость: ${(displayInfo as any).rarity}`}
                </p>
                {displayInfo.description && <p>{displayInfo.description}</p>}
                {isCard && (displayInfo as any).faction && (
                  <p>Фракция: {(displayInfo as any).faction}</p>
                )}
                {isCard && (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    <span>Сила: {(listing.item as any).power}</span>
                    <span>Защита: {(listing.item as any).defense}</span>
                    <span>Здоровье: {(listing.item as any).health}</span>
                    <span>Магия: {(listing.item as any).magic}</span>
                  </div>
                )}
              </div>

              <p className="text-yellow-500 font-medium">{listing.price} ELL</p>

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