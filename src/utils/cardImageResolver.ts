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

// Импорты изображений для героя "Стратег"
import strategistRarity1 from '@/assets/cards/strategist-rarity-1.png';
import strategistRarity2 from '@/assets/cards/strategist-rarity-2.png';
import strategistRarity3 from '@/assets/cards/strategist-rarity-3.png';
import strategistRarity4 from '@/assets/cards/strategist-rarity-4.png';
import strategistRarity5 from '@/assets/cards/strategist-rarity-5.png';
import strategistRarity6 from '@/assets/cards/strategist-rarity-6.png';
import strategistRarity7 from '@/assets/cards/strategist-rarity-7.png';
import strategistRarity8 from '@/assets/cards/strategist-rarity-8.png';

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

// Маппинг изображений по редкости для героя "Стратег"
const strategistRarityImages: Record<number, string> = {
  1: strategistRarity1,
  2: strategistRarity2,
  3: strategistRarity3,
  4: strategistRarity4,
  5: strategistRarity5,
  6: strategistRarity6,
  7: strategistRarity7,
  8: strategistRarity8,
};

/**
 * Получает URL изображения для карты на основе её редкости
 * Поддерживает специальные изображения для карт:
 * - "Рекрут" (Тэлэрион) - редкости 1-8
 * - "Стратег" (Тэлэрион) - редкости 1-8
 * @param card - карта, для которой нужно получить изображение
 * @returns URL изображения или undefined, если специального изображения нет
 */
export const getCardImageByRarity = (card: Card): string | undefined => {
  // Проверяем, является ли карта героем "Рекрут" из Тэлэриона
  if (card.name === "Рекрут" && card.faction === "Тэлэрион" && card.type === "character") {
    return recruitRarityImages[card.rarity] || card.image;
  }
  
  // Проверяем, является ли карта героем "Стратег" из Тэлэриона
  if (card.name === "Стратег" && card.faction === "Тэлэрион" && card.type === "character") {
    return strategistRarityImages[card.rarity] || card.image;
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