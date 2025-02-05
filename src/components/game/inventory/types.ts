import { Item } from "@/types/inventory";

export interface GroupedItem {
  name: string;
  type: Item["type"];
  value: number;
  count: number;
  items: Item[];
  image?: string;
  petName?: string;
}