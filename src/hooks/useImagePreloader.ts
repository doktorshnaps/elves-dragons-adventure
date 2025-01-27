import { useEffect, useState } from 'react';
import { cardDatabase } from '@/data/cardDatabase';

// Создаем объект для кэширования загруженных изображений
const imageCache: { [key: string]: HTMLImageElement } = {};

export const useImagePreloader = () => {
  const [imagesLoaded, setImagesLoaded] = useState(false);

  useEffect(() => {
    const imageUrls = cardDatabase
      .map(card => card.image)
      .filter((url): url is string => !!url);

    const uniqueUrls = Array.from(new Set(imageUrls));
    let loadedImages = 0;
    const totalImages = uniqueUrls.length;

    const preloadImage = (url: string) => {
      // Если изображение уже в кэше, возвращаем его
      if (imageCache[url]) {
        loadedImages++;
        if (loadedImages === totalImages) {
          setImagesLoaded(true);
        }
        return Promise.resolve();
      }

      return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = url;
        img.onload = () => {
          imageCache[url] = img; // Сохраняем в кэш
          loadedImages++;
          if (loadedImages === totalImages) {
            setImagesLoaded(true);
          }
          resolve(img);
        };
        img.onerror = reject;
      });
    };

    // Если все изображения уже в кэше, сразу устанавливаем флаг
    if (uniqueUrls.every(url => imageCache[url])) {
      setImagesLoaded(true);
      return;
    }

    Promise.all(uniqueUrls.map(preloadImage))
      .then(() => {
        setImagesLoaded(true);
        console.log('All images preloaded and cached successfully');
      })
      .catch(error => {
        console.error('Error preloading images:', error);
        setImagesLoaded(true); // Устанавливаем в true anyway чтобы не блокировать приложение
      });
  }, []);

  return imagesLoaded;
};