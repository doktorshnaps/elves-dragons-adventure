import { Card as CardType } from "@/types/cards";
import { CardDisplay } from "../CardDisplay";
import { Badge } from "@/components/ui/badge";

interface CardGroupProps {
  card: CardType;
  count: number;
  isSelected: boolean;
  isActive: boolean;
  onSelect: () => void;
  onSell: (card: CardType) => void;
  onUpgrade: () => void;
}

export const CardGroup = ({ 
  card, 
  count, 
  isSelected, 
  isActive, 
  onSelect, 
  onSell,
  onUpgrade
}: CardGroupProps) => {
  return (
    <div
      className={`relative w-full max-w-[160px] cursor-pointer transition-all duration-300 ${
        isSelected ? 'ring-2 ring-game-accent rounded-lg' : ''
      }`}
      onClick={onSelect}
    >
      <CardDisplay
        card={card}
        showSellButton={true}
        onSell={onSell}
        isActive={isActive}
        isSelected={isSelected}
        onUpgrade={onUpgrade}
      />
      {count > 1 && (
        <Badge 
          className="absolute top-1 right-1 bg-game-accent text-white"
          variant="default"
        >
          x{count}
        </Badge>
      )}
    </div>
  );
};