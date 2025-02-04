import { Card as CardType } from "@/types/cards";
import { Card } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { CardImage } from "./cards/CardImage";
import { CardHeader } from "./cards/CardHeader";
import { CardStats } from "./cards/CardStats";
import { CardActions } from "./cards/CardActions";

interface CardDisplayProps {
  card: CardType;
  showSellButton?: boolean;
  onSell?: (card: CardType) => void;
  className?: string;
  isActive?: boolean;
  isSelected?: boolean;
  onUpgrade?: () => void;
}

export const CardDisplay = ({ 
  card, 
  showSellButton, 
  onSell, 
  className = "", 
  isActive = true,
  isSelected = false,
  onUpgrade
}: CardDisplayProps) => {
  const isMobile = useIsMobile();

  return (
    <Card className={`p-0.5 bg-game-background border-game-accent hover:border-game-primary transition-all duration-300 h-full flex flex-col ${
      !isActive && card.type === 'pet' ? 'opacity-50' : ''
    } ${className}`}>
      <div className="flex flex-col gap-0.5 flex-grow">
        <CardImage image={card.image} name={card.name} />
        <CardHeader name={card.name} rarity={card.rarity} />

        <div className={`text-purple-400 px-0.5 ${isMobile ? 'text-[8px]' : 'text-xs'}`}>
          ({card.type === 'character' ? 'Герой' : 'Питомец'})
        </div>

        {card.faction && (
          <div className={`flex items-center gap-0.5 px-0.5 ${isMobile ? 'text-[8px]' : 'text-xs'} ${
            !isActive && card.type === 'pet' ? 'text-red-400' : 'text-purple-400'
          }`}>
            <Sparkles className={`${isMobile ? 'w-2 h-2' : 'w-3 h-3'}`} />
            <span className="break-words">{card.faction}</span>
          </div>
        )}
        
        <CardStats 
          health={card.health}
          power={card.power}
          defense={card.defense}
        />

        {card.magicResistance && (
          <div className={`text-blue-400 px-0.5 ${isMobile ? 'text-[8px]' : 'text-xs'} break-words mt-0.5`}>
            Защита от {card.magicResistance.type} магии: {card.magicResistance.value}%
          </div>
        )}

        {!isActive && card.type === 'pet' && (
          <div className="text-red-400 text-[8px] mt-0.5 break-words px-0.5">
            Требуется герой {card.faction} {card.rarity} или выше
          </div>
        )}
      </div>

      <CardActions
        card={card}
        showSellButton={showSellButton}
        onSell={onSell}
        isSelected={isSelected}
        onUpgrade={onUpgrade}
      />
    </Card>
  );
};