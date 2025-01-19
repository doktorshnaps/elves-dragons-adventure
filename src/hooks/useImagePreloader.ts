import { useEffect, useState } from 'react';
import { cardDatabase } from '@/data/cardDatabase';

// Создаем объект для кэширования загруженных изображений
const imageCache: { [key: string]: HTMLImageElement } = {};

// Функция для предварительной загрузки одного изображения
const preloadSingleImage = (url: string): Promise<void> => {
  return new Promise((resolve, reject) => {
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
      resolve(); // Разрешаем промис даже при ошибке, чтобы не блокировать загрузку других изображений
    };

    img.src = url;
  });
};

export const useImagePreloader = () => {
  const [imagesLoaded, setImagesLoaded] = useState(false);

  useEffect(() => {
    const imageUrls = cardDatabase
      .map(card => card.image)
      .filter((url): url is string => !!url);

    // Удаляем дубликаты URL
    const uniqueUrls = Array.from(new Set(imageUrls));

    // Загружаем изображения пакетами по 5 штук
    const batchSize = 5;
    const loadImageBatch = async (startIndex: number) => {
      const batch = uniqueUrls.slice(startIndex, startIndex + batchSize);
      await Promise.all(batch.map(preloadSingleImage));

      if (startIndex + batchSize < uniqueUrls.length) {
        // Загружаем следующий пакет через небольшую задержку
        setTimeout(() => loadImageBatch(startIndex + batchSize), 100);
      } else {
        setImagesLoaded(true);
      }
    };

    // Если все изображения уже в кэше, сразу устанавливаем флаг
    if (uniqueUrls.every(url => imageCache[url])) {
      setImagesLoaded(true);
      return;
    }

    // Начинаем загрузку первого пакета
    loadImageBatch(0).catch(error => {
      console.error('Error in batch loading:', error);
      setImagesLoaded(true); // Устанавливаем в true anyway чтобы не блокировать приложение
    });

    return () => {
      // Очистка не требуется, так как кэш сохраняется
    };
  }, []);

  return imagesLoaded;
};