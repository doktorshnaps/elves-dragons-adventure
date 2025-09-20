// ПОЛНОСТЬЮ ОТКЛЮЧЕННЫЙ файл
// Весь функционал перенесен в centralizedCardInstances и cardInstanceManager

export const useOptimizedCardInstances = () => {
  console.warn('useOptimizedCardInstances: This hook is DISABLED. Use useCentralizedCardInstances instead');
  
  return {
    cardInstances: [],
    loading: false,
    createCardInstance: async () => null,
    updateCardHealth: async () => false,
    deleteCardInstance: async () => false,
    deleteCardInstanceByTemplate: async () => false,
    loadCardInstances: async () => []
  };
};