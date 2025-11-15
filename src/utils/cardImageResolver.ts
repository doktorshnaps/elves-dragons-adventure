import { Card } from '@/types/cards';
import { supabase } from '@/integrations/supabase/client';

// Temporarily using placeholders until webp files are uploaded
const recruitRarity1 = "/placeholder.svg";
const recruitRarity2 = "/placeholder.svg";
const recruitRarity3 = "/placeholder.svg";
const recruitRarity4 = "/placeholder.svg";
const recruitRarity5 = "/placeholder.svg";
const recruitRarity6 = "/placeholder.svg";
const recruitRarity7 = "/placeholder.svg";
const recruitRarity8 = "/placeholder.svg";

const strategistRarity1 = "/placeholder.svg";
const strategistRarity2 = "/placeholder.svg";
const strategistRarity3 = "/placeholder.svg";
const strategistRarity4 = "/placeholder.svg";
const strategistRarity5 = "/placeholder.svg";
const strategistRarity6 = "/placeholder.svg";
const strategistRarity7 = "/placeholder.svg";
const strategistRarity8 = "/placeholder.svg";

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
  // Если карта уже содержит конкретное изображение (например, из edge-функции), используем его приоритетно
  if (card.cardClass && card.image) {
    return card.image;
  }
  // Пытаемся загрузить изображение из базы данных
  try {
    const dbImages = await loadDatabaseImages();
    
    // Используем тип карты напрямую, без преобразования
    const cardType = card.type === 'pet' ? 'pet' : 'character';
    
    // Сначала пытаемся найти с фракцией
    if (card.faction) {
      const keyWithFaction = `${card.name}|${cardType}|${card.rarity}|${card.faction}`;
      const dbImageWithFaction = dbImages.get(keyWithFaction);
      
      console.log(`🔍 Looking for image with faction: ${keyWithFaction}`, dbImageWithFaction ? '✅ Found' : '❌ Not found');
      
      if (dbImageWithFaction) {
        return dbImageWithFaction;
      }
    }
    
    // Затем пытаемся найти без фракции (для обратной совместимости)
    const keyWithoutFaction = `${card.name}|${cardType}|${card.rarity}`;
    const dbImage = dbImages.get(keyWithoutFaction);
    
    console.log(`🔍 Looking for image without faction: ${keyWithoutFaction}`, dbImage ? '✅ Found' : '❌ Not found');
    
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
  console.log(`📷 Using standard image for ${card.name}:`, card.image);
  return card.image;
};

/**
 * Синхронная версия getCardImageByRarity для обратной совместимости
 * Использует только hardcoded изображения и стандартное изображение карты
 */
export const getCardImageByRaritySync = (card: Card): string | undefined => {
  // Если карта уже содержит конкретное изображение (например, из edge-функции), используем его приоритетно
  if (card.cardClass && card.image) {
    return card.image;
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