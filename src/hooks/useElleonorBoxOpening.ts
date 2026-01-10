import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useWalletContext } from '@/contexts/WalletConnectContext';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ElleonorBoxItem {
  id: string;
  name: string;
  template_id?: number;
}

export const useElleonorBoxOpening = () => {
  const [isOpening, setIsOpening] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [currentReward, setCurrentReward] = useState<number>(0);
  const [boxQueue, setBoxQueue] = useState<ElleonorBoxItem[]>([]);
  const [currentBoxIndex, setCurrentBoxIndex] = useState(0);
  const [skipAnimations, setSkipAnimations] = useState(false);
  
  const { toast } = useToast();
  const { accountId } = useWalletContext();
  const queryClient = useQueryClient();

  // Open Elleonor Box via edge function (same pattern as card packs)
  const openElleonorBox = useCallback(async (boxItem: ElleonorBoxItem): Promise<number | null> => {
    if (!accountId) {
      toast({
        title: "Ошибка",
        description: "Кошелек не подключен",
        variant: "destructive",
      });
      return null;
    }

    if (isOpening) {
      console.log('Already opening a box, skipping...');
      return null;
    }

    try {
      setIsOpening(true);
      
      console.log(`📦 Opening Elleonor Box via edge function for ${accountId}...`);
      
      // Call edge function (handles deletion and rewards server-side)
      const { data, error } = await supabase.functions.invoke('open-elleonor-box', {
        body: {
          wallet_address: accountId,
          box_instance_id: boxItem.id,
          count: 1
        }
      });
      
      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Не удалось открыть сундук');
      }

      if (!data.success) {
        throw new Error(data.error || 'Не удалось открыть сундук');
      }

      const reward = data.rewards[0] || 0;
      setCurrentReward(reward);
      
      console.log(`✅ Box opened! Reward: ${reward} mGT`);

      // Invalidate queries to refresh data
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['itemInstances'] }),
        queryClient.invalidateQueries({ queryKey: ['gameData'] })
      ]);

      // Show animation
      if (!skipAnimations) {
        setShowAnimation(true);
      } else {
        toast({
          title: "Elleonor Box открыт!",
          description: `Вы получили ${reward.toLocaleString()} mGT токенов`,
        });
        setIsOpening(false);
      }

      return reward;
    } catch (error) {
      console.error('Error opening Elleonor Box:', error);
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось открыть сундук",
        variant: "destructive",
      });
      setIsOpening(false);
      return null;
    }
  }, [accountId, queryClient, toast, skipAnimations, isOpening]);

  // Open multiple boxes
  const openMultipleBoxes = useCallback(async (boxes: ElleonorBoxItem[]) => {
    if (boxes.length === 0) return;
    
    setBoxQueue(boxes);
    setCurrentBoxIndex(0);
    await openElleonorBox(boxes[0]);
  }, [openElleonorBox]);

  // Handle animation complete
  const handleAnimationComplete = useCallback(async () => {
    setShowAnimation(false);
    setIsOpening(false);
    
    const nextIndex = currentBoxIndex + 1;
    
    if (nextIndex < boxQueue.length && !skipAnimations) {
      setCurrentBoxIndex(nextIndex);
      await openElleonorBox(boxQueue[nextIndex]);
    } else {
      // All boxes opened
      setBoxQueue([]);
      setCurrentBoxIndex(0);
      
      if (boxQueue.length > 1) {
        toast({
          title: "Все сундуки открыты!",
          description: `Открыто ${boxQueue.length} Elleonor Box`,
        });
      }
    }
  }, [currentBoxIndex, boxQueue, skipAnimations, openElleonorBox, toast]);

  // Skip all animations
  const handleSkipAll = useCallback(async () => {
    setSkipAnimations(true);
    setShowAnimation(false);
    
    // Open remaining boxes without animation via edge function
    if (boxQueue.length > currentBoxIndex + 1) {
      const remainingCount = boxQueue.length - currentBoxIndex - 1;
      
      try {
        const { data, error } = await supabase.functions.invoke('open-elleonor-box', {
          body: {
            wallet_address: accountId,
            count: remainingCount
          }
        });

        if (!error && data.success) {
          toast({
            title: "Все сундуки открыты!",
            description: `Получено ${(currentReward + data.totalReward).toLocaleString()} mGT токенов`,
          });
        }
      } catch (e) {
        console.error('Error opening remaining boxes:', e);
      }
    }
    
    setBoxQueue([]);
    setCurrentBoxIndex(0);
    setIsOpening(false);
    setSkipAnimations(false);
    
    // Refresh data
    queryClient.invalidateQueries({ queryKey: ['itemInstances'] });
    queryClient.invalidateQueries({ queryKey: ['gameData'] });
  }, [currentBoxIndex, boxQueue, currentReward, accountId, queryClient, toast]);

  return {
    isOpening,
    showAnimation,
    currentReward,
    openElleonorBox,
    openMultipleBoxes,
    handleAnimationComplete,
    handleSkipAll,
    showSkipAll: boxQueue.length > 1,
    remainingBoxes: boxQueue.length - currentBoxIndex - 1,
  };
};
