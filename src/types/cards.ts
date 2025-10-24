export type CardType = 'character' | 'pet' | 'workers';
export type Rarity = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type HeroClass = 
  | 'Рекрут'
  | 'Страж'
  | 'Ветеран'
  | 'Маг'
  | 'Мастер Целитель'
  | 'Защитник'
  | 'Ветеран Защитник'
  | 'Стратег'
  | 'Верховный Стратег';

export type DragonClass = 
  | 'Обычный'
  | 'Необычный'
  | 'Редкий'
  | 'Эпический'
  | 'Легендарный'
  | 'Мифический'
  | 'Этернал'
  | 'Империал'
  | 'Титан';

export type CardClass = HeroClass | DragonClass;

export type Faction = 
  | 'Каледор'
  | 'Сильванести'
  | 'Фаэлин'
  | 'Элленар'
  | 'Тэлэрион'
  | 'Аэлантир'
  | 'Лиорас';

export interface MagicResistance {
  type: 'природа' | 'земля' | 'тьма' | 'свет' | 'вода' | 'песок' | 'лед';
  value: number;
}

export interface Card {
  id: string;
  name: string;
  type: CardType;
  power: number;
  defense: number;
  health: number;
  currentHealth?: number; // Текущее здоровье карты
  lastHealTime?: number; // Время последнего лечения
  magic: number;
  rarity: Rarity;
  cardClass?: CardClass; // Класс карты (определяется при открытии)
  faction?: Faction;
  magicResistance?: MagicResistance;
  image?: string;
  isNFT?: boolean;
  nftContractId?: string;
  nftTokenId?: string;
  description?: string;
  mana?: number;
  maxMana?: number;
}

export interface CardPack {
  id: string;
  cards: Card[];
}

export interface TeamStats {
  power: number;
  defense: number;
  health: number;
  maxHealth: number;
  mana?: number;
  maxMana?: number;
}