import { Item } from "@/types/inventory";

export interface GroupedItem {
  name: string;
  type: Item["type"];
  value: number;
  count: number;
  items: Item[];
  image?: string;
  image_url?: string; // URL from database
  petName?: string;
}