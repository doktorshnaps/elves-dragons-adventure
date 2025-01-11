export type QuestReward = {
  coins?: number;
  items?: Array<{
    id: string;
    name: string;
    type: string;
    value: number;
  }>;
};

export type Quest = {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'social';
  progress: number;
  target: number;
  reward: QuestReward;
  completed: boolean;
  claimed: boolean;
};