import { useEffect, useState } from 'react';
import { cardDatabase } from '@/data/cardDatabase';
import { allMonsterImages } from '@/constants/monsterImages';
import { allWorkerImages } from '@/constants/workerImages';
import { allItemImages } from '@/constants/itemImages';

// Создаем объект для кэширования загруженных изображений
const imageCache: { [key: string]: HTMLImageElement } = {};

// Флаг для отслеживания завершения предзагрузки
let preloadCompleted = false;
const preloadPromise: Promise<void> | null = null;

// Функция для предварительной загрузки одного изображения
const preloadSingleImage = (url: string, priority: 'high' | 'low' = 'low'): Promise<void> => {
  return new Promise((resolve) => {
    // Если изображение уже в кэше, сразу возвращаем его
    if (imageCache[url]) {
      resolve();
      return;
    }

    const img = new Image();
    
    img.onload = () => {
      imageCache[url] = img;
      resolve();
    };
    
    img.onerror = () => {
      console.error(`Failed to load image: ${url}`);
      resolve(); // Разрешаем промис даже при ошибке
    };

    // Устанавливаем приоритет загрузки
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

  const allImageUrls = [...cardImageUrls, ...allMonsterImages, ...allWorkerImages, ...allItemImages];
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

      // Объединяем изображения карт, монстров, рабочих и предметов
      const allImageUrls = [...cardImageUrls, ...allMonsterImages, ...allWorkerImages, ...allItemImages];

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