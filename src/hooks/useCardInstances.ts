// ПОЛНОСТЬЮ ОТКЛЮЧЕННЫЙ файл
// Весь функционал перенесен в useCentralizedCardInstances и cardInstanceManager

/**
 * @deprecated Используйте useCentralizedCardInstances
 */
export const useCardInstances = () => {
  console.warn('useCardInstances: This hook is DISABLED. Use useCentralizedCardInstances instead');
  
  return {
    cardInstances: [],
    loading: false,
    createCardInstance: async () => {
      console.warn('createCardInstance: DISABLED - use useCentralizedCardInstances');
      return null;
    },
    updateCardHealth: async () => {
      console.warn('updateCardHealth: DISABLED - use useCentralizedCardInstances');
      return false;
    },
    applyDamageToInstance: async () => {
      console.warn('applyDamageToInstance: DISABLED - use useCentralizedCardInstances');
      return false;
    },
    deleteCardInstance: async () => {
      console.warn('deleteCardInstance: DISABLED - use useCentralizedCardInstances');
      return false;
    },
    deleteCardInstanceByTemplate: async () => {
      console.warn('deleteCardInstanceByTemplate: DISABLED - use useCentralizedCardInstances');
      return false;
    },
    loadCardInstances: async () => {
      console.warn('loadCardInstances: DISABLED - use useCentralizedCardInstances');
      return [];
    }
  };
};