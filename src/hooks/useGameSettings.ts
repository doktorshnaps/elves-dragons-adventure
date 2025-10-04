import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface BaseStats {
  health: number;
  defense: number;
  power: number;
  magic: number;
}

interface ClassMultiplier {
  class_name: string;
  health_multiplier: number;
  defense_multiplier: number;
  power_multiplier: number;
  magic_multiplier: number;
}

interface RarityMultiplier {
  rarity: number;
  multiplier: number;
}

interface GameSettings {
  heroBaseStats: BaseStats;
  dragonBaseStats: BaseStats;
  rarityMultipliers: Record<number, number>;
  classMultipliers: Record<string, ClassMultiplier>;
  dragonClassMultipliers: Record<string, ClassMultiplier>;
  isLoaded: boolean;
}

const defaultSettings: GameSettings = {
  heroBaseStats: { health: 100, defense: 25, power: 20, magic: 15 },
  dragonBaseStats: { health: 80, defense: 20, power: 25, magic: 30 },
  rarityMultipliers: {
    1: 1.0, 2: 1.6, 3: 2.4, 4: 3.4,
    5: 4.8, 6: 6.9, 7: 10.0, 8: 14.5
  },
  classMultipliers: {},
  dragonClassMultipliers: {},
  isLoaded: false
};

let cachedSettings: GameSettings = defaultSettings;
let settingsPromise: Promise<GameSettings> | null = null;

export const useGameSettings = () => {
  const [settings, setSettings] = useState<GameSettings>(cachedSettings);

  useEffect(() => {
    const loadSettings = async () => {
      // Если уже загружено, используем кеш
      if (cachedSettings.isLoaded) {
        setSettings(cachedSettings);
        return;
      }

      // Если загрузка уже идет, ждем ее
      if (settingsPromise) {
        const result = await settingsPromise;
        setSettings(result);
        return;
      }

      // Начинаем новую загрузку
      settingsPromise = (async () => {
        try {
          const [heroRes, dragonRes, rarityRes, classRes, dragonClassRes] = await Promise.all([
            supabase.from('hero_base_stats').select('*').limit(1).single(),
            supabase.from('dragon_base_stats').select('*').limit(1).single(),
            supabase.from('rarity_multipliers').select('*').order('rarity'),
            supabase.from('class_multipliers').select('*'),
            supabase.from('dragon_class_multipliers').select('*')
          ]);

          const newSettings: GameSettings = {
            heroBaseStats: heroRes.data || defaultSettings.heroBaseStats,
            dragonBaseStats: dragonRes.data || defaultSettings.dragonBaseStats,
            rarityMultipliers: rarityRes.data?.reduce((acc, r: RarityMultiplier) => {
              acc[r.rarity] = r.multiplier;
              return acc;
            }, {} as Record<number, number>) || defaultSettings.rarityMultipliers,
            classMultipliers: classRes.data?.reduce((acc, c: ClassMultiplier) => {
              acc[c.class_name] = c;
              return acc;
            }, {} as Record<string, ClassMultiplier>) || {},
            dragonClassMultipliers: dragonClassRes.data?.reduce((acc, c: ClassMultiplier) => {
              acc[c.class_name] = c;
              return acc;
            }, {} as Record<string, ClassMultiplier>) || {},
            isLoaded: true
          };

          cachedSettings = newSettings;
          setSettings(newSettings);
          return newSettings;
        } catch (error) {
          console.error('Error loading game settings:', error);
          cachedSettings = { ...defaultSettings, isLoaded: true };
          setSettings(cachedSettings);
          return cachedSettings;
        } finally {
          settingsPromise = null;
        }
      })();

      await settingsPromise;
    };

    loadSettings();

    // Подписываемся на изменения в БД для автообновления
    const channel = supabase
      .channel('game-settings-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hero_base_stats' }, () => {
        cachedSettings = { ...defaultSettings, isLoaded: false };
        loadSettings();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dragon_base_stats' }, () => {
        cachedSettings = { ...defaultSettings, isLoaded: false };
        loadSettings();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rarity_multipliers' }, () => {
        cachedSettings = { ...defaultSettings, isLoaded: false };
        loadSettings();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'class_multipliers' }, () => {
        cachedSettings = { ...defaultSettings, isLoaded: false };
        loadSettings();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dragon_class_multipliers' }, () => {
        cachedSettings = { ...defaultSettings, isLoaded: false };
        loadSettings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return settings;
};

// Функция для принудительного сброса кеша (для использования в админке после сохранения)
export const invalidateGameSettingsCache = () => {
  cachedSettings = { ...defaultSettings, isLoaded: false };
  settingsPromise = null;
};
