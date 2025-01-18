import { useEffect, useState } from 'react';
import { cardDatabase } from '@/data/cardDatabase';

export const useImagePreloader = () => {
  const [imagesLoaded, setImagesLoaded] = useState(false);

  useEffect(() => {
    const imageUrls = cardDatabase
      .map(card => card.image)
      .filter((url): url is string => !!url);

    const uniqueUrls = Array.from(new Set(imageUrls));
    let loadedImages = 0;

    const preloadImage = (url: string) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = url;
        img.onload = resolve;
        img.onerror = reject;
      });
    };

    Promise.all(uniqueUrls.map(preloadImage))
      .then(() => {
        setImagesLoaded(true);
        console.log('All images preloaded successfully');
      })
      .catch(error => {
        console.error('Error preloading images:', error);
        setImagesLoaded(true); // Set to true anyway to not block the app
      });
  }, []);

  return imagesLoaded;
};