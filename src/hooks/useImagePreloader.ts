import { useEffect, useState } from 'react';
import { cardDatabase } from '@/data/cardDatabase';

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

    // Устанавливаем максимальный приоритет загрузки
    img.fetchPriority = 'high';
    img.loading = 'eager';
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

    // Загружаем все изображения сразу
    Promise.all(uniqueUrls.map(preloadSingleImage))
      .then(() => {
        setImagesLoaded(true);
        console.log('All images loaded successfully');
      })
      .catch(error => {
        console.error('Error loading images:', error);
        setImagesLoaded(true);
      });

    return () => {
      // Кэш сохраняется между рендерами
    };
  }, []);

  return imagesLoaded;
};