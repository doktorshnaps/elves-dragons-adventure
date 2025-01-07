export type EquipmentSlot = 'weapon' | 'shield' | 'armor' | 'ring1' | 'ring2' | 'necklace';

export interface Equipment {
  id: number;
  name: string;
  slot: EquipmentSlot;
  power?: number;
  defense?: number;
  equipped: boolean;
}

export interface EquippedItems {
  weapon: Equipment | null;
  shield: Equipment | null;
  armor: Equipment | null;
  ring1: Equipment | null;
  ring2: Equipment | null;
  necklace: Equipment | null;
}