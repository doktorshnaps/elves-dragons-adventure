import { useEffect, useState } from 'react';
import { cardDatabase } from '@/data/cardDatabase';

// Import monster images for preloading
import spiderSkeleton from "@/assets/monsters/spider-skeleton.png";
import spiderJumper from "@/assets/monsters/spider-jumper.png";
import spiderWeaver from "@/assets/monsters/spider-weaver.png";
import spiderHunter from "@/assets/monsters/spider-hunter.png";
import spiderQueenLarva from "@/assets/monsters/spider-queen-larva.png";
import spiderCorpseEater from "@/assets/monsters/spider-corpse-eater.png";
import spiderGuardian from "@/assets/monsters/spider-guardian.png";
import spiderWyvern from "@/assets/monsters/spider-wyvern.png";
import shadowSpiderCatcher from "@/assets/monsters/shadow-spider-catcher.png";
import ancientSpiderHermit from "@/assets/monsters/ancient-spider-hermit.png";
import spiderBerserker from "@/assets/monsters/spider-berserker.png";
import spiderIllusionist from "@/assets/monsters/spider-illusionist.png";
import spiderMotherGuardian from "@/assets/monsters/spider-mother-guardian.png";
import spiderParasite from "@/assets/monsters/spider-parasite.png";
import spiderTitan from "@/assets/monsters/spider-titan.png";
import arachnidArchmage from "@/assets/monsters/arachnid-archmage.png";
import arachnaProgenitor from "@/assets/monsters/arachna-progenitor.png";

// Monster images for preloading
const monsterImages = [
  spiderSkeleton,
  spiderJumper,
  spiderWeaver,
  spiderHunter,
  spiderQueenLarva,
  spiderCorpseEater,
  spiderGuardian,
  spiderWyvern,
  shadowSpiderCatcher,
  ancientSpiderHermit,
  spiderBerserker,
  spiderIllusionist,
  spiderMotherGuardian,
  spiderParasite,
  spiderTitan,
  arachnidArchmage,
  arachnaProgenitor
];

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
    const cardImageUrls = cardDatabase
      .map(card => card.image)
      .filter((url): url is string => !!url);

    // Объединяем изображения карт и монстров
    const allImageUrls = [...cardImageUrls, ...monsterImages];

    // Удаляем дубликаты URL
    const uniqueUrls = Array.from(new Set(allImageUrls));

    // Загружаем все изображения сразу
    Promise.all(uniqueUrls.map(preloadSingleImage))
      .then(() => {
        setImagesLoaded(true);
        console.log(`All images loaded successfully (${uniqueUrls.length} images)`);
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