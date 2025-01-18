import { Card } from "@/types/cards";
import { Item } from "@/components/battle/Inventory";

export interface MarketplaceListing {
  id: string;
  type: 'card' | 'item';
  item: Card | Item;
  price: number;
  sellerId: string;
  createdAt: string;
}

export interface ListingItemDisplay {
  id: string;
  name: string;
  type: 'card' | 'item';
  image?: string;
  rarity?: number;
  description?: string;
}