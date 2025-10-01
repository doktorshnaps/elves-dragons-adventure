/**
 * Парсер для CSV файла с данными монстров
 * Читает monsters_balanced.csv и предоставляет доступ к характеристикам монстров
 */

export interface MonsterCSVData {
  dungeon: string;
  level: number;
  type: 'monster' | 'miniboss' | 'boss50' | 'boss100';
  sizeMob: number;
  hp: number;
  armor: number;
  attack: number;
}

// Кэш распарсенных данных
let parsedData: Map<string, Map<number, MonsterCSVData>> | null = null;

/**
 * Парсит CSV строку в объект MonsterCSVData
 */
const parseCSVLine = (line: string): MonsterCSVData | null => {
  const parts = line.split(',');
  if (parts.length < 7) return null;

  const dungeon = parts[0].trim();
  const level = parseInt(parts[1]);
  const type = parts[2].trim() as MonsterCSVData['type'];
  const sizeMob = parseFloat(parts[3]);
  const hp = parseFloat(parts[4]);
  const armor = parseFloat(parts[5]);
  const attack = parseFloat(parts[6]);

  if (isNaN(level) || isNaN(sizeMob) || isNaN(hp) || isNaN(armor) || isNaN(attack)) {
    return null;
  }

  return { dungeon, level, type, sizeMob, hp, armor, attack };
};

/**
 * Загружает и парсит CSV файл
 */
export const loadMonsterData = async (): Promise<Map<string, Map<number, MonsterCSVData>>> => {
  if (parsedData) return parsedData;

  try {
    const response = await fetch('/src/data/monsters_balanced.csv');
    const csvText = await response.text();
    
    const lines = csvText.split('\n');
    const dataMap = new Map<string, Map<number, MonsterCSVData>>();

    // Пропускаем заголовок
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const data = parseCSVLine(line);
      if (!data) continue;

      if (!dataMap.has(data.dungeon)) {
        dataMap.set(data.dungeon, new Map());
      }

      dataMap.get(data.dungeon)!.set(data.level, data);
    }

    parsedData = dataMap;
    console.log('✅ Loaded monster data for dungeons:', Array.from(dataMap.keys()));
    return dataMap;
  } catch (error) {
    console.error('❌ Failed to load monster data:', error);
    return new Map();
  }
};

/**
 * Получает данные монстра для конкретного подземелья и уровня
 */
export const getMonsterData = async (
  dungeonName: string,
  level: number
): Promise<MonsterCSVData | null> => {
  const data = await loadMonsterData();
  const dungeonData = data.get(dungeonName);
  
  if (!dungeonData) {
    console.warn(`⚠️ No data found for dungeon: ${dungeonName}`);
    return null;
  }

  const monsterData = dungeonData.get(level);
  if (!monsterData) {
    console.warn(`⚠️ No data found for ${dungeonName} level ${level}`);
    return null;
  }

  return monsterData;
};

/**
 * Маппинг внутренних названий подземелий к CSV названиям
 */
export const DUNGEON_CSV_NAMES: Record<string, string> = {
  spider_nest: 'SpiderNestGenerator',
  bone_dungeon: 'BoneDemonDungeonGenerator',
  dark_mage: 'DarkMageTowerGenerator',
  forgotten_souls: 'ForgottenSoulsCave',
  ice_throne: 'IcyThroneGenerator',
  sea_serpent: 'SeaSerpentLairGenerator',
  dragon_lair: 'BlackDragonLair',
  pantheon_gods: 'PantheonOfGodsGenerator',
};

/**
 * Получает CSV название подземелья по внутреннему названию
 */
export const getDungeonCSVName = (internalName: string): string => {
  return DUNGEON_CSV_NAMES[internalName] || internalName;
};
