import { useEffect, useState } from 'react';
import { cardDatabase } from '@/data/cardDatabase';
import { allMonsterImages } from '@/constants/monsterImages';
import { allWorkerImages } from '@/constants/workerImages';
import { allItemImages } from '@/constants/itemImages';

// Создаем объект для кэширования загруженных изображений
const imageCache: { [key: string]: HTMLImageElement } = {};

// Функция для предварительной загрузки одного изображения
const preloadSingleImage = (url: string): Promise<void> => {
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

    // Устанавливаем низкий приоритет для фоновой загрузки (не блокирует LCP)
    img.fetchPriority = 'low';
    img.loading = 'lazy';
    img.src = url;
  });
};

export const useImagePreloader = () => {
  const [imagesLoaded, setImagesLoaded] = useState(false);

  useEffect(() => {
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
      Promise.all(uniqueUrls.map(preloadSingleImage))
        .then(() => {
          setImagesLoaded(true);
          console.log(`All images loaded successfully (${uniqueUrls.length} images)`);
        })
        .catch(error => {
          console.error('Error loading images:', error);
          setImagesLoaded(true);
        });
    }, 1000); // Откладываем на 1 секунду после начального рендера

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  return imagesLoaded;
};