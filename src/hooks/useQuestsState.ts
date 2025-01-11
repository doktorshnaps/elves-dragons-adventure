import { useState, useEffect } from 'react';
import { Quest } from '@/types/quests';

export const useQuestsState = () => {
  const [quests, setQuests] = useState<Quest[]>(() => {
    const savedQuests = localStorage.getItem('gameQuests');
    return savedQuests ? JSON.parse(savedQuests) : [];
  });

  useEffect(() => {
    localStorage.setItem('gameQuests', JSON.stringify(quests));
  }, [quests]);

  const updateQuestProgress = (questId: string, progress: number) => {
    setQuests(currentQuests =>
      currentQuests.map(quest => {
        if (quest.id === questId) {
          const newProgress = Math.min(quest.target, progress);
          const completed = newProgress >= quest.target;
          return {
            ...quest,
            progress: newProgress,
            completed: completed
          };
        }
        return quest;
      })
    );
  };

  const claimReward = (questId: string) => {
    setQuests(currentQuests =>
      currentQuests.map(quest =>
        quest.id === questId && quest.completed && !quest.claimed
          ? { ...quest, claimed: true }
          : quest
      )
    );
  };

  return {
    quests,
    setQuests,
    updateQuestProgress,
    claimReward
  };
};