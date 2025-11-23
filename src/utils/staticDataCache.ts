/**
 * Утилита для синхронного доступа к статическим данным из React Query кеша
 * Используется в не-React коде (например, в генераторах подземелий)
 */

import { QueryClient } from '@tanstack/react-query';
import { StaticGameData } from '@/hooks/useStaticGameData';

// Глобальная ссылка на QueryClient (будет установлена в QueryProvider)
let globalQueryClient: QueryClient | null = null;

export const setGlobalQueryClient = (client: QueryClient) => {
  globalQueryClient = client;
};

/**
 * Получить статические данные из кеша React Query синхронно
 * Используется в утилитах и генераторах, которые не могут использовать хуки
 */
export const getStaticDataFromCache = (): StaticGameData | null => {
  if (!globalQueryClient) {
    console.warn('⚠️ QueryClient not initialized yet');
    return null;
  }

  const cachedData = globalQueryClient.getQueryData(['staticGameData', 'v2']) as StaticGameData | undefined;
  
  if (!cachedData) {
    console.warn('⚠️ Static data not in cache yet');
    return null;
  }

  return cachedData;
};

/**
 * Получить монстров из кеша
 */
export const getMonstersFromCache = () => {
  const staticData = getStaticDataFromCache();
  return staticData?.monsters || [];
};

/**
 * Получить настройки подземелий из кеша
 */
export const getDungeonSettingsFromCache = () => {
  const staticData = getStaticDataFromCache();
  return staticData?.dungeon_settings || [];
};

/**
 * Найти монстра по ID (с нормализацией дефисов/подчеркиваний)
 */
export const getMonsterById = (monsterId: string) => {
  const monsters = getMonstersFromCache();
  const normalized = monsterId.toLowerCase();
  const variants = [normalized, normalized.replace(/-/g, '_'), normalized.replace(/_/g, '-')];
  
  return monsters.find(m => {
    const id = m.monster_id?.toLowerCase();
    return variants.some(v => v === id);
  });
};

/**
 * Найти монстра по имени
 */
export const getMonsterByName = (monsterName: string) => {
  const monsters = getMonstersFromCache();
  return monsters.find(m => m.monster_name === monsterName);
};

/**
 * Получить настройки конкретного подземелья по типу
 */
export const getDungeonSettingsByType = (dungeonType: string) => {
  const settings = getDungeonSettingsFromCache();
  return settings.find(s => s.dungeon_type === dungeonType) || null;
};
