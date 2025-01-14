import { Item } from "@/components/battle/Inventory";

export interface GroupedItem {
  name: string;
  type: Item["type"];
  value: number;
  count: number;
  items: Item[];
  image?: string;
}