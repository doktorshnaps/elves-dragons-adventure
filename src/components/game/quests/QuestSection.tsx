import { Quest } from "@/types/quests";
import { QuestItem } from "./QuestItem";

interface QuestSectionProps {
  title: string;
  quests: Quest[];
  onClaimReward: (quest: Quest) => void;
}

export const QuestSection = ({ title, quests, onClaimReward }: QuestSectionProps) => {
  if (quests.length === 0) return null;
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-game-primary">{title}</h3>
      {quests.map((quest) => (
        <QuestItem
          key={quest.id}
          quest={quest}
          onClaimReward={onClaimReward}
        />
      ))}
    </div>
  );
};