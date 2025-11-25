import { Card } from '@/types/cards';
import { supabase } from '@/integrations/supabase/client';

// Карты Рекрута по редкости
const recruitRarity1 = "/lovable-uploads/27831c0a-e7a0-4ac4-84d9-642b6fa0e31c.webp";
const recruitRarity2 = "/lovable-uploads/6f418524-f8c0-444e-aac7-dc60d548275a.webp";
const recruitRarity3 = "/lovable-uploads/2e357adf-59ac-4ebc-8f34-fb77d085801d.webp";
const recruitRarity4 = "/lovable-uploads/5aa39f4e-18e2-4514-b338-2871069ebde3.webp";
const recruitRarity5 = "/lovable-uploads/e2726d02-61d0-49f8-88cd-5eb5d7412563.webp";
const recruitRarity6 = "/lovable-uploads/c9a16f25-86df-4d19-8e29-6e9784d21cc0.webp";
const recruitRarity7 = "/lovable-uploads/7472b221-f5e0-4f77-8fce-96b9cd408d98.webp";
const recruitRarity8 = "/lovable-uploads/27f02bff-5707-40b9-a94e-77669bd08bde.webp";

// Карты Стратега по редкости
const strategistRarity1 = "/lovable-uploads/27f02bff-5707-40b9-a94e-77669bd08bde.webp";
const strategistRarity2 = "/lovable-uploads/6f852396-ab0a-42af-8b0b-a19fad23fe91.webp";
const strategistRarity3 = "/lovable-uploads/27f02bff-5707-40b9-a94e-77669bd08bde.webp";
const strategistRarity4 = "/lovable-uploads/6f852396-ab0a-42af-8b0b-a19fad23fe91.webp";
const strategistRarity5 = "/lovable-uploads/27f02bff-5707-40b9-a94e-77669bd08bde.webp";
const strategistRarity6 = "/lovable-uploads/6f852396-ab0a-42af-8b0b-a19fad23fe91.webp";
const strategistRarity7 = "/lovable-uploads/27f02bff-5707-40b9-a94e-77669bd08bde.webp";
const strategistRarity8 = "/lovable-uploads/6f852396-ab0a-42af-8b0b-a19fad23fe91.webp";

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
  // ПРИОРИТЕТ 1: Пытаемся загрузить изображение из базы данных
  try {
    const dbImages = await loadDatabaseImages();
    
    // Пробуем несколько вариантов типа карты для совместимости (hero/character/pet/dragon)
    const normalizedName = (card.name || '').trim();
    const normalizedFaction = (card.faction || '').trim();
    const typeStr = String((card as any).type || '');
    const candidateTypes = Array.from(
      new Set(
        [
          typeStr,
          typeStr === 'hero' ? 'character' : undefined,
          typeStr === 'character' ? 'hero' : undefined,
          typeStr === 'pet' ? 'pet' : undefined,
          typeStr === 'dragon' ? 'dragon' : undefined,
          typeStr === 'dragon' ? 'pet' : undefined,
        ].filter(Boolean)
      )
    ) as string[];

    // Сначала пытаемся найти с фракцией, затем без фракции, перебирая варианты типов
    for (const t of candidateTypes) {
      if (normalizedFaction) {
        const keyWithFaction = `${normalizedName}|${t}|${card.rarity}|${normalizedFaction}`;
        const dbImageWithFaction = dbImages.get(keyWithFaction);
        console.log(`🔍 Looking for image with faction: ${keyWithFaction}`, dbImageWithFaction ? '✅ Found' : '❌ Not found');
        if (dbImageWithFaction) {
          return dbImageWithFaction;
        }
      }

      const keyWithoutFaction = `${normalizedName}|${t}|${card.rarity}`;
      const dbImage = dbImages.get(keyWithoutFaction);
      console.log(`🔍 Looking for image without faction: ${keyWithoutFaction}`, dbImage ? '✅ Found' : '❌ Not found');
      if (dbImage) {
        return dbImage;
      }
    }
  } catch (error) {
    console.error('Error getting card image from database:', error);
  }

  // ПРИОРИТЕТ 2: Проверяем hardcoded изображения для "Рекрут" из Тэлэриона
  if (card.name === "Рекрут" && card.faction === "Тэлэрион" && card.type === "character") {
    const hardcodedImage = recruitRarityImages[card.rarity];
    if (hardcodedImage) {
      console.log(`✅ Using hardcoded Recruit image for rarity ${card.rarity}`);
      return hardcodedImage;
    }
  }
  
  // ПРИОРИТЕТ 2: Проверяем hardcoded изображения для "Стратег" из Тэлэриона
  if (card.name === "Стратег" && card.faction === "Тэлэрион" && card.type === "character") {
    const hardcodedImage = strategistRarityImages[card.rarity];
    if (hardcodedImage) {
      console.log(`✅ Using hardcoded Strategist image for rarity ${card.rarity}`);
      return hardcodedImage;
    }
  }
  
  // ПРИОРИТЕТ 3: Для всех остальных карт возвращаем стандартное изображение из карты
  console.log(`📷 Using standard image for ${card.name} (rarity ${card.rarity}):`, card.image);
  return card.image;
};

/**
 * Нормализует URL изображения карты (IPFS, Arweave, data URLs, PNG->WEBP)
 */
const normalizeCardImageUrl = (url: string | undefined): string | undefined => {
  if (!url) return undefined;
  
  try {
    let normalized = url;
    
    // IPFS URL normalization
    if (normalized.startsWith('ipfs://')) {
      normalized = normalized.replace('ipfs://', 'https://ipfs.io/ipfs/');
    }
    
    // If it's just an IPFS hash
    if (/^Qm[a-zA-Z0-9]{44,}$/.test(normalized)) {
      normalized = `https://ipfs.io/ipfs/${normalized}`;
    }
    
    // Arweave URL
    if (normalized.startsWith('ar://')) {
      normalized = normalized.replace('ar://', 'https://arweave.net/');
    }
    
    // Конвертируем PNG в WEBP для lovable-uploads путей
    if (normalized.includes('/lovable-uploads/') && /\.png(\?|$)/i.test(normalized)) {
      normalized = normalized.replace(/\.png(\?|$)/i, '.webp$1');
    }
    
    return normalized;
  } catch (error) {
    console.error('Error normalizing card image URL:', error);
    return url;
  }
};

/**
 * Синхронная версия getCardImageByRarity для обратной совместимости
 * КРИТИЧНО: приоритет card.image (где уже должно быть правильное изображение с учетом фракции)
 */
export const getCardImageByRaritySync = (card: Card): string | undefined => {
  // ПРИОРИТЕТ 1: Используем card.image если есть (там уже правильное изображение)
  if (card.image) {
    return normalizeCardImageUrl(card.image);
  }
  
  // ПРИОРИТЕТ 2: Hardcoded изображения для "Рекрут" из Тэлэриона (fallback)
  if (card.name === "Рекрут" && card.faction === "Тэлэрион" && card.type === "character") {
    return recruitRarityImages[card.rarity];
  }
  
  // ПРИОРИТЕТ 3: Hardcoded изображения для "Стратег" из Тэлэриона (fallback)
  if (card.name === "Стратег" && card.faction === "Тэлэрион" && card.type === "character") {
    return strategistRarityImages[card.rarity];
  }
  
  // Fallback: placeholder
  return '/placeholder.svg';
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
  return rarityImage || normalizeCardImageUrl(card.image);
};