import { Faction } from '@/types/factions';

export const factions: Faction[] = [
  {
    name: 'Лиорас',
    element: 'nature',
    description: 'Хранители древних лесов и природной магии',
    dragonType: 'Лесной дракон',
    specialAbility: 'Регенерация в лесу и атаки ядом',
    baseStats: {
      power: 8,
      defense: 7,
      magic: 10
    }
  },
  {
    name: 'Каледор',
    element: 'ice',
    description: 'Властители льда и хранители северных земель',
    dragonType: 'Ледяной дракон',
    specialAbility: 'Иммунитет к холоду и ледяные ловушки',
    baseStats: {
      power: 9,
      defense: 8,
      magic: 8
    }
  },
  {
    name: 'Тэлэрион',
    element: 'shadow',
    description: 'Мастера теневой магии и древних тайн',
    dragonType: 'Теневой дракон',
    specialAbility: 'Невидимость и теневые удары',
    baseStats: {
      power: 7,
      defense: 6,
      magic: 12
    }
  },
  {
    name: 'Элленар',
    element: 'light',
    description: 'Хранители священного света и божественной магии',
    dragonType: 'Светлый дракон',
    specialAbility: 'Исцеление и святые печати',
    baseStats: {
      power: 6,
      defense: 9,
      magic: 10
    }
  },
  {
    name: 'Фаэлин',
    element: 'water',
    description: 'Повелители морей и водной стихии',
    dragonType: 'Водный дракон',
    specialAbility: 'Дыхание под водой и водяные вихри',
    baseStats: {
      power: 7,
      defense: 8,
      magic: 10
    }
  },
  {
    name: 'Сильванести',
    element: 'sand',
    description: 'Хранители пустынь и песчаных бурь',
    dragonType: 'Песчаный дракон',
    specialAbility: 'Песчаный щит и миражи',
    baseStats: {
      power: 8,
      defense: 7,
      magic: 9
    }
  },
  {
    name: 'Аэлантир',
    element: 'earth',
    description: 'Властители гор и земной мощи',
    dragonType: 'Горный дракон',
    specialAbility: 'Каменная кожа и землетрясения',
    baseStats: {
      power: 10,
      defense: 10,
      magic: 5
    }
  }
];

export const getFactionByName = (name: string): Faction | undefined => {
  return factions.find(faction => faction.name === name);
};