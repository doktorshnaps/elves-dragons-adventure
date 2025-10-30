import { useEffect, useRef } from 'react';
import { useUnifiedGameState } from './useUnifiedGameState';
import { useCardInstances } from './useCardInstances';
import { supabase } from '@/integrations/supabase/client';

/**
 * Хук для синхронизации рабочих между card_instances и item_instances
 * @deprecated Legacy hook - workers are now managed via item_instances table directly
 */
export const useWorkerSync = () => {
  // No-op: worker management moved to item_instances table
  return null;
};