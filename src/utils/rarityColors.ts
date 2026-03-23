// Rarity color scheme for card visual effects
// Rarity 1-9 maps to Hero classes (Рекрут→Верховный Стратег) and Dragon classes (Обычный→Титан)

export interface RarityStyle {
  borderColor: string;
  glowColor: string;
  bgGradient: string;
  shimmer?: boolean; // for ultra-rare animated shimmer
  label: string;
}

const rarityStyles: Record<number, RarityStyle> = {
  1: { // Рекрут / Обычный — Gray
    borderColor: 'hsl(0, 0%, 55%)',
    glowColor: 'hsl(0, 0%, 55%, 0.3)',
    bgGradient: 'linear-gradient(135deg, hsl(0, 0%, 30%) 0%, hsl(0, 0%, 20%) 100%)',
    label: 'Обычный',
  },
  2: { // Страж / Необычный — Green
    borderColor: 'hsl(140, 60%, 50%)',
    glowColor: 'hsl(140, 60%, 50%, 0.3)',
    bgGradient: 'linear-gradient(135deg, hsl(140, 40%, 28%) 0%, hsl(140, 30%, 18%) 100%)',
    label: 'Необычный',
  },
  3: { // Ветеран / Редкий — Blue
    borderColor: 'hsl(210, 80%, 60%)',
    glowColor: 'hsl(210, 80%, 60%, 0.4)',
    bgGradient: 'linear-gradient(135deg, hsl(210, 60%, 30%) 0%, hsl(210, 40%, 18%) 100%)',
    label: 'Редкий',
  },
  4: { // Чародей / Эпический — Purple
    borderColor: 'hsl(270, 70%, 65%)',
    glowColor: 'hsl(270, 70%, 65%, 0.4)',
    bgGradient: 'linear-gradient(135deg, hsl(270, 50%, 32%) 0%, hsl(270, 40%, 20%) 100%)',
    label: 'Эпический',
  },
  5: { // Мастер Целитель / Легендарный — Gold
    borderColor: 'hsl(45, 100%, 55%)',
    glowColor: 'hsl(45, 100%, 55%, 0.5)',
    bgGradient: 'linear-gradient(135deg, hsl(45, 70%, 30%) 0%, hsl(35, 50%, 18%) 100%)',
    label: 'Легендарный',
  },
  6: { // Защитник / Мифический — Crimson Red
    borderColor: 'hsl(0, 80%, 55%)',
    glowColor: 'hsl(0, 80%, 55%, 0.5)',
    bgGradient: 'linear-gradient(135deg, hsl(0, 60%, 30%) 0%, hsl(350, 50%, 18%) 100%)',
    label: 'Мифический',
  },
  7: { // Ветеран Защитник / Этернал — Cyan/Teal
    borderColor: 'hsl(180, 80%, 55%)',
    glowColor: 'hsl(180, 80%, 55%, 0.5)',
    bgGradient: 'linear-gradient(135deg, hsl(180, 50%, 28%) 0%, hsl(190, 40%, 16%) 100%)',
    shimmer: true,
    label: 'Этернал',
  },
  8: { // Стратег / Империал — Magenta/Pink
    borderColor: 'hsl(320, 80%, 60%)',
    glowColor: 'hsl(320, 80%, 60%, 0.5)',
    bgGradient: 'linear-gradient(135deg, hsl(320, 50%, 30%) 0%, hsl(300, 40%, 18%) 100%)',
    shimmer: true,
    label: 'Империал',
  },
  9: { // Верховный Стратег / Титан — Diamond (white-rainbow shimmer)
    borderColor: 'hsl(200, 30%, 90%)',
    glowColor: 'hsl(200, 60%, 80%, 0.6)',
    bgGradient: 'linear-gradient(135deg, hsl(220, 30%, 35%) 0%, hsl(260, 20%, 25%) 50%, hsl(200, 30%, 30%) 100%)',
    shimmer: true,
    label: 'Титан',
  },
};

export function getRarityStyle(rarity: number): RarityStyle {
  return rarityStyles[Math.min(Math.max(rarity, 1), 9)] || rarityStyles[1];
}

export function getRarityBorderStyle(rarity: number, isWinRevealed: boolean = false) {
  const style = getRarityStyle(rarity);
  return {
    borderColor: isWinRevealed ? 'hsl(45, 100%, 60%)' : style.borderColor,
    boxShadow: isWinRevealed
      ? `0 0 20px hsl(45, 100%, 50%, 0.5), 0 0 40px ${style.glowColor}`
      : `0 0 12px ${style.glowColor}, 0 2px 8px hsl(0, 0%, 0%, 0.3)`,
    background: style.bgGradient,
  };
}
