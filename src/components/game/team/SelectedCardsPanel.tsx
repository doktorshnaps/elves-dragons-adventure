import { Card as CardType } from "@/types/cards";

interface SelectedCardsPanelProps {
  selectedCards: CardType[];
  onUpgrade: () => void;
}

export const SelectedCardsPanel = ({ selectedCards }: SelectedCardsPanelProps) => {
  if (selectedCards.length === 0) return null;

  return (
    <div className="flex items-center justify-between bg-game-surface p-4 rounded-lg">
      <span className="text-white">
        Выбрано карт: {selectedCards.length}/2
      </span>
    </div>
  );
};