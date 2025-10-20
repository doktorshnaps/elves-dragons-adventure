import { Card } from "@/types/cards";
import { Item } from "@/types/inventory";
import { NFTCard } from "@/hooks/useNFTCards";

export interface MarketplaceListing {
  id: string;
  type: 'card' | 'item';
  item: Card | Item | NFTCard;
  price: number;
  sellerId: string;
  createdAt: string;
  isNFT?: boolean;
  paymentToken?: string;
}

export interface ListingItemDisplay {
  id: string;
  name: string;
  type: 'card' | 'item';
  image?: string;
  rarity?: number;
  description?: string;
}
