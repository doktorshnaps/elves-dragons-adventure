import { Card } from '@/types/cards';
import { supabase } from '@/integrations/supabase/client';

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

// Кэш для изображений из базы данных
let dbImagesCache: Map<string, string> | null = null;
let cacheLoadPromise: Promise<void> | null = null;

/**
 * Загружает изображения карт из базы данных
 */
const loadDatabaseImages = async (): Promise<Map<string, string>> => {
  if (dbImagesCache) {
    return dbImagesCache;
  }

  if (cacheLoadPromise) {
    await cacheLoadPromise;
    return dbImagesCache!;
  }

  cacheLoadPromise = (async () => {
    try {
      const { data, error } = await supabase
        .from('card_images')
        .select('card_name, card_type, rarity, image_url, faction');

      if (error) throw error;

      const cache = new Map<string, string>();
      data?.forEach(img => {
        // Используем faction в ключе, если она указана
        const key = img.faction 
          ? `${img.card_name}|${img.card_type}|${img.rarity}|${img.faction}`
          : `${img.card_name}|${img.card_type}|${img.rarity}`;
        cache.set(key, img.image_url);
      });

      dbImagesCache = cache;
    } catch (error) {
      console.error('Error loading card images from database:', error);
      dbImagesCache = new Map();
    }
  })();

  await cacheLoadPromise;
  return dbImagesCache!;
};

/**
 * Сбрасывает кэш изображений карт
 */
export const invalidateCardImagesCache = () => {
  dbImagesCache = null;
  cacheLoadPromise = null;
};

/**
 * Получает URL изображения для карты на основе её редкости
 * Приоритет:
 * 1. Изображение из базы данных (с фракцией)
 * 2. Специальные hardcoded изображения (Рекрут, Стратег)
 * 3. Стандартное изображение карты
 * @param card - карта, для которой нужно получить изображение
 * @returns URL изображения или undefined, если специального изображения нет
 */
export const getCardImageByRarity = async (card: Card): Promise<string | undefined> => {
  // Пытаемся загрузить изображение из базы данных
  try {
    const dbImages = await loadDatabaseImages();
    const cardType = card.type === 'pet' ? 'dragon' : 'hero';
    
    // Сначала пытаемся найти с фракцией
    if (card.faction) {
      const keyWithFaction = `${card.name}|${cardType}|${card.rarity}|${card.faction}`;
      const dbImageWithFaction = dbImages.get(keyWithFaction);
      
      if (dbImageWithFaction) {
        return dbImageWithFaction;
      }
    }
    
    // Затем пытаемся найти без фракции (для обратной совместимости)
    const keyWithoutFaction = `${card.name}|${cardType}|${card.rarity}`;
    const dbImage = dbImages.get(keyWithoutFaction);
    
    if (dbImage) {
      return dbImage;
    }
  } catch (error) {
    console.error('Error getting card image from database:', error);
  }

  // Проверяем hardcoded изображения для "Рекрут" из Тэлэриона
  if (card.name === "Рекрут" && card.faction === "Тэлэрион" && card.type === "character") {
    return recruitRarityImages[card.rarity] || card.image;
  }
  
  // Проверяем hardcoded изображения для "Стратег" из Тэлэриона
  if (card.name === "Стратег" && card.faction === "Тэлэрион" && card.type === "character") {
    return strategistRarityImages[card.rarity] || card.image;
  }
  
  // Для всех остальных карт возвращаем стандартное изображение
  return card.image;
};

/**
 * Синхронная версия getCardImageByRarity для обратной совместимости
 * Использует только hardcoded изображения и стандартное изображение карты
 */
export const getCardImageByRaritySync = (card: Card): string | undefined => {
  // Проверяем hardcoded изображения для "Рекрут" из Тэлэриона
  if (card.name === "Рекрут" && card.faction === "Тэлэрион" && card.type === "character") {
    return recruitRarityImages[card.rarity] || card.image;
  }
  
  // Проверяем hardcoded изображения для "Стратег" из Тэлэриона
  if (card.name === "Стратег" && card.faction === "Тэлэрион" && card.type === "character") {
    return strategistRarityImages[card.rarity] || card.image;
  }
  
  // Для всех остальных карт возвращаем стандартное изображение
  return card.image;
};

/**
 * Получает приоритетное изображение для карты (асинхронная версия)
 * Сначала проверяет наличие изображения по редкости, затем стандартное
 * @param card - карта, для которой нужно получить изображение
 * @returns Promise с URL изображения
 */
export const resolveCardImage = async (card: Card): Promise<string | undefined> => {
  const rarityImage = await getCardImageByRarity(card);
  return rarityImage || card.image;
};

/**
 * Синхронная версия resolveCardImage для обратной совместимости
 */
export const resolveCardImageSync = (card: Card): string | undefined => {
  const rarityImage = getCardImageByRaritySync(card);
  return rarityImage || card.image;
};