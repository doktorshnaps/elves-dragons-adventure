import { Card as CardType } from "@/types/cards";
import { Card } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { CardImage } from "./cards/CardImage";
import { CardHeader } from "./cards/CardHeader";
import { CardStats } from "./cards/CardStats";
import { CardHealthBar } from "./cards/CardHealthBar";
import { CardActions } from "./cards/CardActions";
interface CardDisplayProps {
  card: CardType;
  showSellButton?: boolean;
  onSell?: (card: CardType) => void;
  className?: string;
  isActive?: boolean;
  isSelected?: boolean;
  onUpgrade?: () => void;
  onClick?: (e: React.MouseEvent) => void;
}
export const CardDisplay = ({
  card,
  showSellButton,
  onSell,
  className = "",
  isActive = true,
  isSelected = false,
  onUpgrade,
  onClick
}: CardDisplayProps) => {
  const isMobile = useIsMobile();
  return <Card onClick={onClick} className={`relative w-[90px] h-[180px] sm:w-[120px] sm:h-[240px] md:w-[130px] md:h-[260px] lg:w-[140px] lg:h-[280px]
        p-0.5 bg-game-background border-game-accent hover:border-game-primary transition-all duration-300 
        ${!isActive && card.type === 'pet' ? 'opacity-50' : ''} ${onClick ? 'cursor-pointer' : ''} ${className}`}>
      <div className="flex flex-col h-full">
        <div className="w-full h-[75px] sm:h-[100px] md:h-[110px] lg:h-[120px] flex-shrink-0">
          <CardImage image={card.image} name={card.name} />
        </div>
        
        <div className="flex flex-col flex-grow justify-between gap-0 p-0.5 h-[105px] sm:h-[140px] md:h-[150px] lg:h-[160px]">
          <div className="flex flex-col gap-0">
            <CardHeader name={card.name} rarity={card.rarity} />

            <div className={`text-purple-400 leading-none ${isMobile ? 'text-[6px]' : 'text-[10px]'}`}>
              ({card.type === 'character' ? 'Герой' : 'Питомец'})
            </div>

            {card.faction && <div className={`flex items-center gap-0.5 leading-none ${isMobile ? 'text-[6px]' : 'text-[10px]'} ${!isActive && card.type === 'pet' ? 'text-red-400' : 'text-purple-400'}`}>
                <Sparkles className={`${isMobile ? 'w-1.5 h-1.5' : 'w-2.5 h-2.5'}`} />
                <span className="break-words tracking-tighter">{card.faction}</span>
              </div>}
            
            <CardStats health={card.health} power={card.power} defense={card.defense} />
            
            <div className="mt-1">
              <CardHealthBar currentHealth={card.currentHealth ?? card.health} maxHealth={card.health} size="small" />
            </div>

            {card.magicResistance}

            {!isActive && card.type === 'pet' && <div className="text-red-400 text-[6px] mt-0.5 break-words leading-none tracking-tighter">
                Требуется герой {card.faction} {card.rarity} или выше
              </div>}
          </div>

          <div className="mt-auto">
            <CardActions card={card} showSellButton={showSellButton} onSell={onSell} isSelected={isSelected} onUpgrade={onUpgrade} />
          </div>
        </div>
      </div>
    </Card>;
};