import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Coins, ArrowUpCircle } from "lucide-react";
import { Card } from "@/types/cards";
import { getCardPrice } from "@/utils/cardUtils";

interface CardActionsProps {
  card: Card;
  showSellButton?: boolean;
  onSell?: (card: Card) => void;
  isSelected?: boolean;
  onUpgrade?: () => void;
}

export const CardActions = ({ 
  card, 
  showSellButton, 
  onSell, 
  isSelected, 
  onUpgrade 
}: CardActionsProps) => {
  const isMobile = useIsMobile();

  if (!showSellButton) return null;

  return (
    <Button
      variant="outline"
      size={isMobile ? "sm" : "default"}
      className={`mt-0.5 w-full text-[8px] h-4 ${
        isSelected ? 'bg-game-accent hover:bg-game-accent/80' : 'text-yellow-500 hover:text-yellow-600'
      }`}
      onClick={isSelected ? onUpgrade : () => onSell?.(card)}
    >
      {isSelected ? (
        <>
          <ArrowUpCircle className={`${isMobile ? 'w-1.5 h-1.5' : 'w-3 h-3'} mr-0.5`} />
          Улучшить
        </>
      ) : (
        <>
          <Coins className={`${isMobile ? 'w-1.5 h-1.5' : 'w-3 h-3'} mr-0.5`} />
          Продать ({getCardPrice(card.rarity)})
        </>
      )}
    </Button>
  );
};