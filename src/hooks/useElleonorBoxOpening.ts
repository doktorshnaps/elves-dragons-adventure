import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useWalletContext } from '@/contexts/WalletConnectContext';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Possible reward amounts with their weights
const REWARD_CONFIG = [
  { amount: 1, weight: 35 },
  { amount: 5, weight: 25 },
  { amount: 10, weight: 15 },
  { amount: 15, weight: 10 },
  { amount: 20, weight: 7 },
  { amount: 50, weight: 4 },
  { amount: 100, weight: 2.5 },
  { amount: 1000, weight: 1 },
  { amount: 6666, weight: 0.5 },
];

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

  // Calculate reward based on weighted random
  const calculateReward = useCallback((): number => {
    const totalWeight = REWARD_CONFIG.reduce((sum, r) => sum + r.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const reward of REWARD_CONFIG) {
      random -= reward.weight;
      if (random <= 0) {
        return reward.amount;
      }
    }
    
    return REWARD_CONFIG[0].amount; // Fallback to lowest amount
  }, []);

  // Open a single Elleonor Box
  const openElleonorBox = useCallback(async (boxItem: ElleonorBoxItem): Promise<number | null> => {
    if (!accountId) {
      toast({
        title: "Ошибка",
        description: "Кошелек не подключен",
        variant: "destructive",
      });
      return null;
    }

    try {
      setIsOpening(true);
      
      // Calculate reward
      const reward = calculateReward();
      setCurrentReward(reward);
      
      // Remove box from inventory
      const { error: removeError } = await supabase
        .from('item_instances')
        .delete()
        .eq('id', boxItem.id);

      if (removeError) {
        throw new Error('Не удалось открыть сундук');
      }

      // Add mGT tokens to balance
      const { data: gameData, error: fetchError } = await supabase
        .from('game_data')
        .select('mgt_balance')
        .eq('wallet_address', accountId)
        .maybeSingle();

      // If no game_data record exists or error, use 0 as starting balance
      const currentBalance = Number(gameData?.mgt_balance) || 0;
      const newBalance = currentBalance + reward;

      // Update or insert mgt_balance
      if (gameData) {
        const { error: updateError } = await supabase
          .from('game_data')
          .update({ mgt_balance: newBalance })
          .eq('wallet_address', accountId);

        if (updateError) {
          console.error('Error updating mgt_balance:', updateError);
          throw new Error('Не удалось обновить баланс mGT');
        }
      } else {
        // Game data doesn't exist - this shouldn't happen normally
        // but handle gracefully by just logging the claim
        console.warn('No game_data found for wallet, proceeding with claim logging only');
      }

      // Log the claim
      await supabase
        .from('mgt_claims')
        .insert({
          wallet_address: accountId,
          amount: reward,
          claim_type: 'box_opening',
          source_item_id: boxItem.id,
        });

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['itemInstances'] });
      queryClient.invalidateQueries({ queryKey: ['gameData'] });

      // Show animation
      if (!skipAnimations) {
        setShowAnimation(true);
      } else {
        toast({
          title: "Elleonor Box открыт!",
          description: `Вы получили ${reward.toLocaleString()} mGT токенов`,
        });
      }

      return reward;
    } catch (error) {
      console.error('Error opening Elleonor Box:', error);
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось открыть сундук",
        variant: "destructive",
      });
      return null;
    } finally {
      if (skipAnimations) {
        setIsOpening(false);
      }
    }
  }, [accountId, calculateReward, queryClient, toast, skipAnimations]);

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
    
    // Open remaining boxes without animation
    let totalReward = currentReward;
    
    for (let i = currentBoxIndex + 1; i < boxQueue.length; i++) {
      const reward = await openElleonorBox(boxQueue[i]);
      if (reward) {
        totalReward += reward;
      }
    }
    
    setBoxQueue([]);
    setCurrentBoxIndex(0);
    setIsOpening(false);
    setSkipAnimations(false);
    
    if (boxQueue.length > 1) {
      toast({
        title: "Все сундуки открыты!",
        description: `Получено ${totalReward.toLocaleString()} mGT токенов`,
      });
    }
  }, [currentBoxIndex, boxQueue, currentReward, openElleonorBox, toast]);

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
