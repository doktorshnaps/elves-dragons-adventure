/**
 * ОТКЛЮЧЕН: Хук для синхронизации рабочих между card_instances и game_data.inventory
 * Теперь рабочие хранятся ТОЛЬКО в card_instances и не синхронизируются с inventory
 */
export const useWorkerSync = () => {
  console.log('⚠️ useWorkerSync is disabled - workers are now stored only in card_instances');
  return null;
};