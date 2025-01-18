import { Card as CardType } from "@/types/cards";
import { Button } from "@/components/ui/button";
import { ArrowUpCircle } from "lucide-react";

interface SelectedCardsPanelProps {
  selectedCards: CardType[];
  onUpgrade: () => void;
}

export const SelectedCardsPanel = ({ selectedCards, onUpgrade }: SelectedCardsPanelProps) => {
  if (selectedCards.length === 0) return null;

  return (
    <div className="flex items-center justify-between bg-game-surface p-4 rounded-lg">
      <span className="text-white">
        Выбрано карт: {selectedCards.length}/2
      </span>
      {selectedCards.length === 2 && (
        <Button
          onClick={onUpgrade}
          className="bg-game-accent hover:bg-game-accent/80"
        >
          <ArrowUpCircle className="w-4 h-4 mr-2" />
          Улучшить
        </Button>
      )}
    </div>
  );
};