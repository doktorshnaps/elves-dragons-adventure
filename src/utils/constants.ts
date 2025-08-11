// Игровые константы
export const GAME_CONFIG = {
  // Баланс и экономика
  STARTING_BALANCE: 100,
  CARD_PACK_PRICE: 1,
  HEALTH_POTION_SMALL_PRICE: 100,
  HEALTH_POTION_LARGE_PRICE: 250,
  
  // Энергия
  MAX_ENERGY: 10,
  ENERGY_REGEN_TIME_MS: 6 * 60 * 1000, // 6 минут
  
  // Команда
  MAX_TEAM_SIZE: 5,
  
  // Опыт и уровни
  BASE_EXPERIENCE_REQUIREMENT: 100,
  EXPERIENCE_MULTIPLIER: 1.5,
  
  // Битва
  CRITICAL_HIT_CHANCE: 0.1,
  CRITICAL_HIT_MULTIPLIER: 1.5,
  
  // Подземелья
  BOSS_LEVEL_INTERVAL: 5,
  ELITE_LEVEL_INTERVAL: 3,
  
  // Инкубация яиц (в миллисекундах)
  EGG_INCUBATION_TIMES: {
    1: 10 * 60 * 1000,        // 10 минут
    2: 30 * 60 * 1000,        // 30 минут  
    3: 10 * 60 * 60 * 1000,   // 10 часов
    4: 72 * 60 * 60 * 1000,   // 72 часа
    5: 150 * 60 * 60 * 1000,  // 150 часов
    6: 200 * 60 * 60 * 1000,  // 200 часов
    7: 300 * 60 * 60 * 1000,  // 300 часов
  } as Record<number, number>
} as const;

// Типы ошибок
export const ERROR_TYPES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  ITEM_NOT_FOUND: 'ITEM_NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED'
} as const;

// Сообщения об ошибках
export const ERROR_MESSAGES = {
  [ERROR_TYPES.NETWORK_ERROR]: 'Проблемы с подключением к серверу',
  [ERROR_TYPES.VALIDATION_ERROR]: 'Неверные данные',
  [ERROR_TYPES.INSUFFICIENT_FUNDS]: 'Недостаточно ELL',
  [ERROR_TYPES.ITEM_NOT_FOUND]: 'Предмет не найден',
  [ERROR_TYPES.UNAUTHORIZED]: 'Требуется авторизация'
} as const;