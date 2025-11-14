import { useEffect, useState } from 'react';
import { cardDatabase } from '@/data/cardDatabase';
import { allMonsterImages } from '@/constants/monsterImages';
import { allItemImages } from '@/constants/itemImages';

// Создаем объект для кэширования загруженных изображений
const imageCache: { [key: string]: HTMLImageElement } = {};

// Флаг для отслеживания завершения предзагрузки
let preloadCompleted = false;
const preloadPromise: Promise<void> | null = null;

const CACHE_NAME = 'grimoire-images-v1';

/**
 * Cache image using Cache API for persistent storage across sessions
 */
const cacheImageInBrowser = async (url: string, blob: Blob): Promise<void> => {
  if (!('caches' in window)) return;
  
  try {
    const cache = await caches.open(CACHE_NAME);
    const response = new Response(blob, {
      headers: {
        'Content-Type': blob.type,
        'Cache-Control': 'max-age=31536000' // 1 year
      }
    });
    await cache.put(url, response);
  } catch (error) {
    console.warn(`⚠️ Failed to cache image: ${url}`, error);
  }
};

/**
 * Get image from Cache API if available
 */
const getImageFromCache = async (url: string): Promise<Blob | null> => {
  if (!('caches' in window)) return null;
  
  try {
    const cache = await caches.open(CACHE_NAME);
    const response = await cache.match(url);
    if (response) {
      return await response.blob();
    }
  } catch (error) {
    console.warn(`⚠️ Failed to retrieve cached image: ${url}`, error);
  }
  return null;
};

// Функция для предварительной загрузки одного изображения
const preloadSingleImage = async (url: string, priority: 'high' | 'low' = 'low'): Promise<void> => {
  // Если изображение уже в кэше памяти, сразу возвращаем его
  if (imageCache[url]) {
    return Promise.resolve();
  }

  // Проверяем браузерный кэш
  const cachedBlob = await getImageFromCache(url);
  if (cachedBlob) {
    const img = new Image();
    img.src = URL.createObjectURL(cachedBlob);
    imageCache[url] = img;
    console.log(`📦 Loaded from cache: ${url}`);
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const img = new Image();
    
    img.onload = async () => {
      imageCache[url] = img;
      
      // Сохраняем в браузерный кэш для следующих сессий
      try {
        const response = await fetch(url);
        const blob = await response.blob();
        await cacheImageInBrowser(url, blob);
        console.log(`✅ Cached: ${url}`);
      } catch (error) {
        console.warn(`⚠️ Failed to cache: ${url}`, error);
      }
      
      resolve();
    };
    
    img.onerror = () => {
      console.error(`❌ Failed to load: ${url}`);
      resolve(); // Разрешаем промис даже при ошибке
    };

    // Устанавливаем приоритет загрузки
    img.crossOrigin = 'anonymous';
    if (priority === 'high') {
      img.fetchPriority = 'high';
      img.loading = 'eager';
    } else {
      img.fetchPriority = 'low';
      img.loading = 'lazy';
    }
    img.src = url;
  });
};

// Функция для проверки, закешировано ли изображение
export const isImageCached = (url: string): boolean => {
  return !!imageCache[url];
};

// Функция для предзагрузки изображений гримуара с высоким приоритетом
export const preloadGrimoireImages = async (): Promise<void> => {
  if (preloadCompleted) {
    console.log('✅ Grimoire images already preloaded');
    return;
  }

  const cardImageUrls = cardDatabase
    .map(card => card.image)
    .filter((url): url is string => !!url);

  const allImageUrls = [...cardImageUrls, ...allMonsterImages, ...allItemImages];
  const uniqueUrls = Array.from(new Set(allImageUrls));

  console.log(`🔄 Preloading ${uniqueUrls.length} grimoire images with high priority...`);
  
  await Promise.all(uniqueUrls.map(url => preloadSingleImage(url, 'high')));
  
  preloadCompleted = true;
  console.log(`✅ All grimoire images preloaded successfully (${uniqueUrls.length} images)`);
};

export const useImagePreloader = () => {
  const [imagesLoaded, setImagesLoaded] = useState(preloadCompleted);

  useEffect(() => {
    if (preloadCompleted) {
      setImagesLoaded(true);
      return;
    }

    // Откладываем предзагрузку изображений, чтобы не блокировать LCP
    const timeoutId = setTimeout(() => {
      const cardImageUrls = cardDatabase
        .map(card => card.image)
        .filter((url): url is string => !!url);

      // Combine card, monster, and item images
      const allImageUrls = [...cardImageUrls, ...allMonsterImages, ...allItemImages];

      // Удаляем дубликаты URL
      const uniqueUrls = Array.from(new Set(allImageUrls));

      // Загружаем все изображения в фоне с низким приоритетом
      Promise.all(uniqueUrls.map(url => preloadSingleImage(url, 'low')))
        .then(() => {
          preloadCompleted = true;
          setImagesLoaded(true);
          console.log(`All images loaded successfully (${uniqueUrls.length} images)`);
        })
        .catch(error => {
          console.error('Error loading images:', error);
          preloadCompleted = true;
          setImagesLoaded(true);
        });
    }, 1000); // Откладываем на 1 секунду после начального рендера

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  return imagesLoaded;
};

// Хук для предзагрузки изображений гримуара
export const useGrimoireImagePreloader = () => {
  const [imagesLoaded, setImagesLoaded] = useState(preloadCompleted);

  useEffect(() => {
    if (preloadCompleted) {
      setImagesLoaded(true);
      return;
    }

    preloadGrimoireImages()
      .then(() => setImagesLoaded(true))
      .catch(error => {
        console.error('Error preloading grimoire images:', error);
        setImagesLoaded(true);
      });
  }, []);

  return imagesLoaded;
};