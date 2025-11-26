/**
 * Store Hierarchy Architecture
 * 
 * Архитектура: БД → React Query → Zustand → Components
 * 
 * Уровень 1 (База данных): Supabase PostgreSQL
 * - Источник истины для всех данных
 * - RPC функции для агрегированных запросов
 * - Real-time subscriptions для синхронизации
 * 
 * Уровень 2 (React Query): Кеширование и синхронизация
 * - Управление состоянием сервера
 * - Агрессивное кеширование (staleTime, gcTime)
 * - Автоматическая инвалидация через Real-time
 * - Оптимистичные обновления
 * 
 * Уровень 3 (Zustand): Глобальное состояние приложения
 * - UI состояние (модальные окна, навигация)
 * - Временное состояние (бои, анимации)
 * - Derived state из React Query
 * - НЕ хранит серверные данные напрямую
 * 
 * Уровень 4 (Components): Представление
 * - Читают из React Query через хуки
 * - Используют Zustand для UI состояния
 * - Оптимистичные обновления для UX
 * - Не содержат бизнес-логики
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// ============= UI Store (Zustand) =============
// Только для UI состояния, НЕ для серверных данных

interface UIState {
  // Модальные окна
  isShopOpen: boolean;
  isInventoryOpen: boolean;
  isTeamModalOpen: boolean;
  
  // Навигация
  currentPage: string;
  
  // Временное состояние
  isLoading: boolean;
  errorMessage: string | null;
  
  // Actions
  openShop: () => void;
  closeShop: () => void;
  openInventory: () => void;
  closeInventory: () => void;
  openTeamModal: () => void;
  closeTeamModal: () => void;
  setCurrentPage: (page: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useUIStore = create<UIState>()(
  devtools(
    (set) => ({
      isShopOpen: false,
      isInventoryOpen: false,
      isTeamModalOpen: false,
      currentPage: 'menu',
      isLoading: false,
      errorMessage: null,
      
      openShop: () => set({ isShopOpen: true }),
      closeShop: () => set({ isShopOpen: false }),
      openInventory: () => set({ isInventoryOpen: true }),
      closeInventory: () => set({ isInventoryOpen: false }),
      openTeamModal: () => set({ isTeamModalOpen: true }),
      closeTeamModal: () => set({ isTeamModalOpen: false }),
      setCurrentPage: (page) => set({ currentPage: page }),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ errorMessage: error }),
    }),
    { name: 'UIStore' }
  )
);

// ============= Battle Store (Zustand) =============
// Для временного состояния боя (не синхронизируется с БД до завершения)

interface BattleState {
  isActive: boolean;
  currentLevel: number;
  monstersKilled: number;
  damageDealt: number;
  damageTaken: number;
  
  // Actions
  startBattle: (level: number) => void;
  endBattle: () => void;
  incrementKills: () => void;
  addDamage: (damage: number) => void;
  takeDamage: (damage: number) => void;
  reset: () => void;
}

export const useBattleStore = create<BattleState>()(
  devtools(
    (set) => ({
      isActive: false,
      currentLevel: 1,
      monstersKilled: 0,
      damageDealt: 0,
      damageTaken: 0,
      
      startBattle: (level) => set({ 
        isActive: true, 
        currentLevel: level,
        monstersKilled: 0,
        damageDealt: 0,
        damageTaken: 0
      }),
      endBattle: () => set({ isActive: false }),
      incrementKills: () => set((state) => ({ monstersKilled: state.monstersKilled + 1 })),
      addDamage: (damage) => set((state) => ({ damageDealt: state.damageDealt + damage })),
      takeDamage: (damage) => set((state) => ({ damageTaken: state.damageTaken + damage })),
      reset: () => set({
        isActive: false,
        currentLevel: 1,
        monstersKilled: 0,
        damageDealt: 0,
        damageTaken: 0
      })
    }),
    { name: 'BattleStore' }
  )
);

// ============= Паттерны использования =============

/**
 * ПРАВИЛЬНО: Читать серверные данные через React Query
 * 
 * const { gameData } = useGameDataContext();
 * const { cardInstances } = useCardInstancesContext();
 * const balance = gameData?.balance || 0;
 */

/**
 * НЕПРАВИЛЬНО: Хранить серверные данные в Zustand
 * 
 * // ❌ НЕ ДЕЛАТЬ ТАК:
 * interface GameStore {
 *   balance: number;
 *   cards: Card[];
 *   setBalance: (balance: number) => void;
 * }
 */

/**
 * ПРАВИЛЬНО: Использовать Zustand для UI состояния
 * 
 * const { openShop, isShopOpen } = useUIStore();
 * 
 * <Button onClick={openShop}>Open Shop</Button>
 * {isShopOpen && <ShopModal />}
 */

/**
 * ПРАВИЛЬНО: Оптимистичные обновления в React Query
 * 
 * const mutation = useMutation({
 *   mutationFn: purchaseItem,
 *   onMutate: (variables) => {
 *     // Оптимистичное обновление
 *     queryClient.setQueryData(['balance'], (old) => old - variables.price);
 *   },
 *   onError: (error, variables, context) => {
 *     // Откат при ошибке
 *     queryClient.setQueryData(['balance'], context.previousBalance);
 *   }
 * });
 */

/**
 * ПРАВИЛЬНО: Временное состояние боя в Zustand
 * 
 * const { startBattle, incrementKills, endBattle } = useBattleStore();
 * 
 * // Начало боя
 * startBattle(5);
 * 
 * // Во время боя (локально)
 * incrementKills();
 * 
 * // Завершение боя - отправка в БД
 * await claimBattleRewards({ monstersKilled: useBattleStore.getState().monstersKilled });
 * endBattle();
 */

// ============= Экспорт =============

export const stores = {
  ui: useUIStore,
  battle: useBattleStore,
} as const;

export type StoreType = keyof typeof stores;
