// Rarity color scheme for card visual effects
// Rarity 1-9 maps to Hero classes (Рекрут→Верховный Стратег) and Dragon classes (Обычный→Титан)

export interface RarityStyle {
  borderColor: string;
  glowColor: string;
  bgGradient: string;
  shimmer?: boolean;
  label: string;
}

const rarityStyles: Record<number, RarityStyle> = {
  1: { // Рекрут / Обычный — Gray
    borderColor: 'hsl(0, 0%, 60%)',
    glowColor: 'hsl(0, 0%, 60%, 0.4)',
    bgGradient: 'linear-gradient(135deg, hsl(0, 0%, 25%) 0%, hsl(0, 0%, 15%) 100%)',
    label: 'Обычный',
  },
  2: { // Страж / Необычный — Green
    borderColor: 'hsl(140, 70%, 50%)',
    glowColor: 'hsl(140, 70%, 50%, 0.5)',
    bgGradient: 'linear-gradient(135deg, hsl(140, 50%, 22%) 0%, hsl(140, 40%, 12%) 100%)',
    label: 'Необычный',
  },
  3: { // Ветеран / Редкий — Blue
    borderColor: 'hsl(210, 90%, 60%)',
    glowColor: 'hsl(210, 90%, 60%, 0.5)',
    bgGradient: 'linear-gradient(135deg, hsl(210, 70%, 25%) 0%, hsl(210, 50%, 14%) 100%)',
    label: 'Редкий',
  },
  4: { // Чародей / Эпический — Purple
    borderColor: 'hsl(270, 80%, 65%)',
    glowColor: 'hsl(270, 80%, 65%, 0.5)',
    bgGradient: 'linear-gradient(135deg, hsl(270, 60%, 28%) 0%, hsl(270, 50%, 16%) 100%)',
    label: 'Эпический',
  },
  5: { // Мастер Целитель / Легендарный — Gold
    borderColor: 'hsl(45, 100%, 55%)',
    glowColor: 'hsl(45, 100%, 55%, 0.6)',
    bgGradient: 'linear-gradient(135deg, hsl(45, 80%, 25%) 0%, hsl(35, 60%, 14%) 100%)',
    label: 'Легендарный',
  },
  6: { // Защитник / Мифический — Crimson Red
    borderColor: 'hsl(0, 85%, 55%)',
    glowColor: 'hsl(0, 85%, 55%, 0.6)',
    bgGradient: 'linear-gradient(135deg, hsl(0, 70%, 25%) 0%, hsl(350, 60%, 14%) 100%)',
    label: 'Мифический',
  },
  7: { // Ветеран Защитник / Этернал — Cyan/Teal
    borderColor: 'hsl(180, 90%, 55%)',
    glowColor: 'hsl(180, 90%, 55%, 0.6)',
    bgGradient: 'linear-gradient(135deg, hsl(180, 60%, 22%) 0%, hsl(190, 50%, 12%) 100%)',
    shimmer: true,
    label: 'Этернал',
  },
  8: { // Стратег / Империал — Magenta/Pink
    borderColor: 'hsl(320, 90%, 60%)',
    glowColor: 'hsl(320, 90%, 60%, 0.6)',
    bgGradient: 'linear-gradient(135deg, hsl(320, 60%, 25%) 0%, hsl(300, 50%, 14%) 100%)',
    shimmer: true,
    label: 'Империал',
  },
  9: { // Верховный Стратег / Титан — Diamond (white-rainbow shimmer)
    borderColor: 'hsl(200, 40%, 90%)',
    glowColor: 'hsl(200, 70%, 80%, 0.7)',
    bgGradient: 'linear-gradient(135deg, hsl(220, 35%, 30%) 0%, hsl(260, 25%, 22%) 50%, hsl(200, 35%, 25%) 100%)',
    shimmer: true,
    label: 'Титан',
  },
};

export function getRarityStyle(rarity: number): RarityStyle {
  return rarityStyles[Math.min(Math.max(rarity, 1), 9)] || rarityStyles[1];
}

// Map card name/class to correct rarity number
// Sorted longest-first to avoid "Ветеран" matching before "Ветеран Защитник"
const heroClassToRarity: [string, number][] = [
  ['Верховный Стратег', 9],
  ['Ветеран Защитник', 7],
  ['Мастер Целитель', 5],
  ['Стратег', 8],
  ['Защитник', 6],
  ['Чародей', 4],
  ['Ветеран', 3],
  ['Страж', 2],
  ['Рекрут', 1],
];

const dragonClassPrefixes: [string, number][] = [
  ['Титан', 9],
  ['Империал', 8],
  ['Этернал', 7],
  ['Мифический', 6],
  ['Легендарный', 5],
  ['Эпический', 4],
  ['Редкий', 3],
  ['Необычный', 2],
  ['Обычный', 1],
];

export function getCardRarityByName(name: string, type?: string): number {
  if (!name) return 1;
  
  // Check hero class names (longest first to avoid partial matches)
  for (const [className, rarity] of heroClassToRarity) {
    if (name === className || name.startsWith(className + ' ')) {
      return rarity;
    }
  }
  
  // Check dragon class prefixes (longest first)
  for (const [prefix, rarity] of dragonClassPrefixes) {
    if (name.startsWith(prefix)) {
      return rarity;
    }
  }
  
  return 1;
}

export function getRarityBorderStyle(rarity: number, isWinRevealed: boolean = false) {
  const style = getRarityStyle(rarity);
  return {
    borderColor: isWinRevealed ? 'hsl(45, 100%, 60%)' : style.borderColor,
    boxShadow: isWinRevealed
      ? `0 0 20px hsl(45, 100%, 50%, 0.5), 0 0 40px ${style.glowColor}, inset 0 0 15px ${style.glowColor}`
      : `0 0 16px ${style.glowColor}, 0 0 6px ${style.glowColor}, inset 0 0 10px ${style.glowColor}`,
    background: style.bgGradient,
    borderWidth: rarity >= 5 ? '2px' : '1.5px',
    borderStyle: 'solid' as const,
  };
}
