import { z } from 'zod';

/**
 * Runtime validation для JSONB полей из базы данных
 * Использует Zod для type-safe валидации
 */

// ============= Card Data Schema =============
export const CardDataSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  type: z.enum(['hero', 'dragon', 'pet', 'worker']),
  rarity: z.string(),
  faction: z.string().optional(),
  value: z.number().optional(),
  sell_price: z.number().optional(),
  stats: z.object({
    health: z.number().optional(),
    power: z.number().optional(),
    defense: z.number().optional(),
    magic: z.number().optional(),
  }).optional(),
  image: z.string().optional(),
  templateId: z.string().optional(),
});

export type CardData = z.infer<typeof CardDataSchema>;

// ============= Building Levels Schema =============
export const BuildingLevelsSchema = z.object({
  main_hall: z.number().default(0),
  workshop: z.number().default(0),
  storage: z.number().default(0),
  sawmill: z.number().default(0),
  quarry: z.number().default(0),
  barracks: z.number().default(0),
  dragon_lair: z.number().default(0),
  medical: z.number().default(0),
  forge: z.number().default(0),
}).passthrough(); // Разрешаем дополнительные поля

export type BuildingLevels = z.infer<typeof BuildingLevelsSchema>;

// ============= Active Worker Schema =============
export const ActiveWorkerSchema = z.object({
  building: z.string(),
  cardId: z.string(),
  cardName: z.string(),
  timeRemaining: z.number(),
  endTime: z.number(),
  productionBonus: z.number().optional(),
});

export type ActiveWorker = z.infer<typeof ActiveWorkerSchema>;

// ============= Building Upgrade Schema =============
export const BuildingUpgradeSchema = z.object({
  buildingId: z.string(),
  buildingName: z.string(),
  currentLevel: z.number(),
  targetLevel: z.number(),
  startTime: z.number(),
  endTime: z.number(),
  timeRemaining: z.number().optional(),
});

export type BuildingUpgrade = z.infer<typeof BuildingUpgradeSchema>;

// ============= Battle State Schema =============
export const BattleStateSchema = z.object({
  currentLevel: z.number(),
  monstersDefeated: z.number(),
  playerHealth: z.number(),
  playerMaxHealth: z.number(),
  rewards: z.object({
    ell: z.number(),
    items: z.array(z.any()),
  }).optional(),
}).passthrough();

export type BattleState = z.infer<typeof BattleStateSchema>;

// ============= Selected Team Schema =============
export const SelectedTeamSchema = z.array(
  z.object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
    faction: z.string().optional(),
    rarity: z.number(),
    health: z.number(),
    defense: z.number(),
    power: z.number(),
    magic: z.number(),
  }).passthrough()
);

export type SelectedTeam = z.infer<typeof SelectedTeamSchema>;

// ============= Dragon Eggs Schema =============
export const DragonEggSchema = z.object({
  id: z.string(),
  eggType: z.string(),
  hatchProgress: z.number(),
  startTime: z.number(),
  endTime: z.number(),
}).passthrough();

export type DragonEgg = z.infer<typeof DragonEggSchema>;

// ============= Social Quest Schema =============
export const SocialQuestSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  reward: z.number(),
  completed: z.boolean(),
  claimed: z.boolean(),
  type: z.string(),
  link: z.string().optional(),
}).passthrough();

export type SocialQuest = z.infer<typeof SocialQuestSchema>;

// ============= Validation Helpers =============

/**
 * Валидировать и парсить JSONB поле
 */
export function validateJSONB<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  fieldName: string
): T | null {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(`❌ [JSONB Validation] Invalid ${fieldName}:`, {
        issues: error.issues,
        data
      });
    } else {
      console.error(`❌ [JSONB Validation] Error validating ${fieldName}:`, error);
    }
    return null;
  }
}

/**
 * Валидировать массив JSONB объектов
 */
export function validateJSONBArray<T>(
  schema: z.ZodSchema<T>,
  data: unknown[],
  fieldName: string
): T[] {
  const validated: T[] = [];
  
  data.forEach((item, index) => {
    const result = validateJSONB(schema, item, `${fieldName}[${index}]`);
    if (result !== null) {
      validated.push(result);
    }
  });

  return validated;
}

/**
 * Безопасно получить JSONB поле с fallback значением
 */
export function safeGetJSONB<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  fieldName: string,
  fallback: T
): T {
  const validated = validateJSONB(schema, data, fieldName);
  return validated !== null ? validated : fallback;
}

/**
 * Валидировать card_data из card_instances
 */
export function validateCardData(cardData: unknown): CardData | null {
  return validateJSONB(CardDataSchema, cardData, 'card_data');
}

/**
 * Валидировать building_levels из game_data
 */
export function validateBuildingLevels(buildingLevels: unknown): BuildingLevels {
  return safeGetJSONB(
    BuildingLevelsSchema,
    buildingLevels,
    'building_levels',
    {
      main_hall: 0,
      workshop: 0,
      storage: 0,
      sawmill: 0,
      quarry: 0,
      barracks: 0,
      dragon_lair: 0,
      medical: 0,
      forge: 0,
    }
  );
}

/**
 * Валидировать active_workers из game_data
 */
export function validateActiveWorkers(activeWorkers: unknown): ActiveWorker[] {
  if (!Array.isArray(activeWorkers)) {
    console.warn('❌ [JSONB Validation] active_workers is not an array');
    return [];
  }
  return validateJSONBArray(ActiveWorkerSchema, activeWorkers, 'active_workers');
}

/**
 * Валидировать active_building_upgrades из game_data
 */
export function validateBuildingUpgrades(upgrades: unknown): BuildingUpgrade[] {
  if (!Array.isArray(upgrades)) {
    console.warn('❌ [JSONB Validation] active_building_upgrades is not an array');
    return [];
  }
  return validateJSONBArray(BuildingUpgradeSchema, upgrades, 'active_building_upgrades');
}
