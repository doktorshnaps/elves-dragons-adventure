export type EquipmentSlot = 'weapon' | 'shield' | 'armor' | 'ring1' | 'ring2' | 'necklace';
export type EquipmentType = 'weapon' | 'shield' | 'armor' | 'ring' | 'necklace';

export interface Equipment {
  id: number;
  name: string;
  type: EquipmentType;
  slot?: EquipmentSlot;
  equipped: boolean;
  power?: number;
  defense?: number;
  health?: number;
}

export interface EquippedItems {
  weapon: Equipment | null;
  shield: Equipment | null;
  armor: Equipment | null;
  ring1: Equipment | null;
  ring2: Equipment | null;
  necklace: Equipment | null;
}