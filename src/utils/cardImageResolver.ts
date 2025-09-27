import { Card } from '@/types/cards';

// Импорты изображений для героя "Рекрут"
import recruitRarity1 from '@/assets/cards/recruit-rarity-1.png';
import recruitRarity2 from '@/assets/cards/recruit-rarity-2.png';
import recruitRarity3 from '@/assets/cards/recruit-rarity-3.png';
import recruitRarity4 from '@/assets/cards/recruit-rarity-4.png';
import recruitRarity5 from '@/assets/cards/recruit-rarity-5.png';
import recruitRarity6 from '@/assets/cards/recruit-rarity-6.png';
import recruitRarity7 from '@/assets/cards/recruit-rarity-7.png';
import recruitRarity8 from '@/assets/cards/recruit-rarity-8.png';

// Маппинг изображений по редкости для героя "Рекрут"
const recruitRarityImages: Record<number, string> = {
  1: recruitRarity1,
  2: recruitRarity2,
  3: recruitRarity3,
  4: recruitRarity4,
  5: recruitRarity5,
  6: recruitRarity6,
  7: recruitRarity7,
  8: recruitRarity8,
};

/**
 * Получает URL изображения для карты на основе её редкости
 * @param card - карта, для которой нужно получить изображение
 * @returns URL изображения или undefined, если специального изображения нет
 */
export const getCardImageByRarity = (card: Card): string | undefined => {
  // Проверяем, является ли карта героем "Рекрут" из Тэлэриона
  if (card.name === "Рекрут" && card.faction === "Тэлэрион" && card.type === "character") {
    return recruitRarityImages[card.rarity] || card.image;
  }
  
  // Для всех остальных карт возвращаем стандартное изображение
  return card.image;
};

/**
 * Получает приоритетное изображение для карты
 * Сначала проверяет наличие изображения по редкости, затем стандартное
 * @param card - карта, для которой нужно получить изображение
 * @returns URL изображения
 */
export const resolveCardImage = (card: Card): string | undefined => {
  const rarityImage = getCardImageByRarity(card);
  return rarityImage || card.image;
};