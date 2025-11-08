import { Card as CardType } from "@/types/cards";
import { Card } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLanguage } from "@/hooks/useLanguage";
import { translateCardName, translateFaction, translateCardType } from "@/utils/cardTranslations";
import { CardImage } from "./cards/CardImage";
import { CardHeader } from "./cards/CardHeader";
import { CardStats } from "./cards/CardStats";
import { CardHealthBar } from "./cards/CardHealthBar";
import { CardActions } from "./cards/CardActions";
import { calculateCardStats } from "@/utils/cardUtils";
import { useMemo } from "react";
import { t } from "@/utils/translations";
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
  const { language } = useLanguage();
  
  // Пересчитываем характеристики с учётом класса и редкости
  const stats = useMemo(() => 
    calculateCardStats(card.name, card.rarity, card.type), 
    [card.name, card.rarity, card.type]
  );
  return <Card onClick={onClick} className={`mx-auto w-[90px] h-[180px] sm:w-[120px] sm:h-[240px] md:w-[130px] md:h-[260px] lg:w-[140px] lg:h-[280px]
        p-0.5 bg-black/50 border-2 border-white backdrop-blur-sm transition-all duration-300 overflow-hidden 
        ${!isActive && card.type === 'pet' ? 'opacity-50' : ''} ${onClick ? 'cursor-pointer' : ''} ${className}`}>
      <div className="flex flex-col h-full">
        <div className="w-full h-[75px] sm:h-[100px] md:h-[110px] lg:h-[120px] flex-shrink-0">
          <CardImage image={card.image} name={card.name} card={card} />
        </div>
        
        <div className="flex flex-col flex-grow justify-between gap-0 p-0.5 h-[105px] sm:h-[140px] md:h-[150px] lg:h-[160px] min-h-0 overflow-hidden">
          <div className="flex flex-col gap-0 overflow-hidden flex-1 min-h-0">
            <CardHeader name={translateCardName(language, card.name)} rarity={card.rarity} />

            <div className={`text-white leading-none truncate ${isMobile ? 'text-[6px]' : 'text-[10px]'}`}>
              ({translateCardType(language, card.type === 'character' ? t(language, 'cardDisplay.hero') : t(language, 'cardDisplay.pet'))})
            </div>

            {card.faction && <div className={`flex items-center gap-0.5 leading-none ${isMobile ? 'text-[6px]' : 'text-[10px]'} ${!isActive && card.type === 'pet' ? 'text-red-400' : 'text-white'} overflow-hidden`}>
                <Sparkles className={`${isMobile ? 'w-1.5 h-1.5' : 'w-2.5 h-2.5'} flex-shrink-0`} />
                <span className="truncate">{translateFaction(language, card.faction)}</span>
              </div>}
            
            <div className="shrink-0">
              <CardStats health={stats.health} power={stats.power} defense={stats.defense} />
            </div>
            
            <div className="mt-0.5 shrink-0">
              <CardHealthBar currentHealth={card.currentHealth ?? stats.health} maxHealth={stats.health} size="small" />
            </div>

            {card.magicResistance && (
              <div className={`text-white leading-none truncate ${isMobile ? 'text-[6px]' : 'text-[8px]'} mt-0.5`}>
                {card.magicResistance.type}: {card.magicResistance.value}
              </div>
            )}

            {!isActive && card.type === 'pet' && <div className="text-red-400 text-[6px] mt-0.5 break-words leading-none tracking-tighter truncate">
                {t(language, 'cardDisplay.requiresHero')} {translateFaction(language, card.faction)} {card.rarity}+
              </div>}
          </div>

          <div className="mt-auto shrink-0 pt-0.5">
            <CardActions card={card} showSellButton={showSellButton} onSell={onSell} isSelected={isSelected} onUpgrade={onUpgrade} />
          </div>
        </div>
      </div>
    </Card>;
};