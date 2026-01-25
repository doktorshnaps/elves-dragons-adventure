import { useState, useEffect, useSyncExternalStore } from 'react';
import {
  getCardImageByRarity,
  normalizeCardImageUrl,
  subscribeCardImagesCache,
  getCardImagesCacheVersion,
  preloadCardImagesCache,
} from '@/utils/cardImageResolver';
import { Card } from '@/types/cards';

/**
 * Подписываемся на кэш card_images, чтобы при загрузке/обновлении
 * компоненты автоматически перерисовывались.
 */
const subscribeToCacheVersion = (callback: () => void) => subscribeCardImagesCache(callback);
const getCacheSnapshot = () => getCardImagesCacheVersion();

/**
 * Хук для получения изображения карты из единственного источника card_images.
 * Автоматически перерисовывается при загрузке кэша.
 */
export const useCardImage = (
  card: Pick<Card, 'name' | 'image'> & { type?: string; rarity?: number; faction?: string } | null | undefined
): string => {
  const placeholder = '/placeholder.svg';

  // Ререндерим компонент, когда кэш card_images загрузится/обновится
  useSyncExternalStore(subscribeToCacheVersion, getCacheSnapshot, getCacheSnapshot);

  const [src, setSrc] = useState<string>(() => {
    if (!card) return placeholder;
    return normalizeCardImageUrl(card.image) || placeholder;
  });

  useEffect(() => {
    if (!card) {
      setSrc(placeholder);
      return;
    }

    let cancelled = false;

    const resolve = async () => {
      try {
        const resolved = await getCardImageByRarity({
          name: card.name,
          faction: card.faction,
          type: card.type as any,
          rarity: card.rarity ?? 1,
          image: card.image,
        } as Card);

        if (!cancelled) {
          setSrc(resolved || normalizeCardImageUrl(card.image) || placeholder);
        }
      } catch {
        if (!cancelled) {
          setSrc(normalizeCardImageUrl(card.image) || placeholder);
        }
      }
    };

    resolve();

    return () => {
      cancelled = true;
    };
  }, [card?.name, card?.type, card?.rarity, card?.faction, card?.image]);

  return src;
};

/**
 * Запускает предзагрузку кэша card_images при старте приложения.
 * Вызывать один раз в AppInitializer или провайдере.
 */
export { preloadCardImagesCache };
