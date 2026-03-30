import { Card as CardType } from '@/types/cards';
import { getRarityBorderStyle, getRarityStyle, getCardRarityByName } from '@/utils/rarityColors';
import { resolveCardImageSync } from '@/utils/cardImageResolver';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { Swords, Plus, X, Shield, Heart } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { translateCardName } from '@/utils/cardTranslations';
import { calculateCardStats } from '@/utils/cardUtils';
import { useMemo } from 'react';

interface TeamSlotCardProps {
  pair?: {
    hero: CardType;
    dragon?: CardType;
  };
  index: number;
  onHeroClick?: (hero: CardType) => void;
  onDragonClick?: (index: number) => void;
  onRemove?: (index: number) => void;
  onRemoveDragon?: (index: number) => void;
  onEmptyClick?: () => void;
}

export const TeamSlotCard = ({
  pair,
  index,
  onHeroClick,
  onDragonClick,
  onRemove,
  onRemoveDragon,
  onEmptyClick,
}: TeamSlotCardProps) => {
  const { language } = useLanguage();

  const heroStats = useMemo(() => {
    if (!pair) return null;
    const card = pair.hero;
    if (card.power !== undefined && card.defense !== undefined && card.health !== undefined) {
      return { power: card.power, defense: card.defense, health: card.health, magic: card.magic ?? 0 };
    }
    return calculateCardStats(card.name, card.rarity, card.type);
  }, [pair]);

  if (!pair) {
    // Empty slot
    return (
      <button
        type="button"
        onClick={onEmptyClick}
        className="relative w-full aspect-[3/4] rounded-2xl border-2 border-dashed border-white/20 
          bg-white/5 backdrop-blur-sm flex flex-col items-center justify-center gap-2 
          hover:border-white/40 hover:bg-white/10 transition-all duration-300 cursor-pointer group"
        style={{ touchAction: 'manipulation' }}
      >
        <div className="w-10 h-10 rounded-full border-2 border-white/30 flex items-center justify-center 
          group-hover:border-white/60 group-hover:scale-110 transition-all duration-300">
          <Plus className="w-5 h-5 text-white/40 group-hover:text-white/80" />
        </div>
        <span className="text-[10px] text-white/40 group-hover:text-white/60">Слот {index + 1}</span>
      </button>
    );
  }

  const hero = pair.hero;
  const dragon = pair.dragon;
  const displayRarity = getCardRarityByName(hero.name, hero.type, hero.rarity);
  const rarityStyle = getRarityStyle(displayRarity);
  const rarityBorder = getRarityBorderStyle(displayRarity);
  const heroImageUrl = resolveCardImageSync(hero) || hero.image || '/placeholder.svg';
  const dragonImageUrl = dragon ? (resolveCardImageSync(dragon) || dragon.image || '/placeholder.svg') : null;
  const combatPower = heroStats ? heroStats.power + (heroStats.magic ?? 0) : 0;

  return (
    <div
      className={`relative w-full aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer 
        transition-all duration-300 hover:scale-[1.03] group
        ${rarityStyle.shimmer ? (displayRarity === 9 ? 'rarity-shimmer rarity-diamond' : 'rarity-shimmer') : ''}`}
      style={{
        ...rarityBorder,
        borderRadius: '1rem',
      }}
    >
      {/* Hero portrait - full card */}
      <div
        className="absolute inset-0"
        onClick={() => onHeroClick?.(hero)}
      >
        <OptimizedImage
          src={heroImageUrl}
          alt={hero.name}
          placeholder="/placeholder.svg"
          width={240}
          height={320}
          priority={false}
          progressive={false}
          className="w-full h-full object-cover"
        />
        
        {/* Bottom gradient overlay for text */}
        <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/95 via-black/60 to-transparent" />
      </div>

      {/* Remove button */}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove(index); }}
          className="absolute top-1.5 right-1.5 z-10 w-5 h-5 rounded-full bg-black/60 border border-white/30 
            flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200
            hover:bg-red-500/80 hover:border-red-400"
        >
          <X className="w-3 h-3 text-white" />
        </button>
      )}

      {/* Dragon badge - bottom right corner */}
      <div className="absolute bottom-[72px] sm:bottom-[80px] right-1.5 z-10">
        {dragon ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDragonClick?.(index);
            }}
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border-2 border-white/60 
              hover:border-white hover:scale-105 transition-all duration-200 shadow-lg shadow-black/50"
            title={dragon.name}
          >
            <OptimizedImage
              src={dragonImageUrl!}
              alt={dragon.name}
              placeholder="/placeholder.svg"
              width={96}
              height={96}
              priority={false}
              progressive={false}
              className="w-full h-full object-cover"
            />
          </button>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDragonClick?.(index);
            }}
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl border-2 border-dashed border-white/30 
              flex items-center justify-center bg-black/40 
              hover:border-white/60 hover:scale-105 transition-all duration-200"
            title="Назначить дракона"
          >
            <Plus className="w-6 h-6 text-white/50" />
          </button>
        )}
      </div>

      {/* Hero name + stats at bottom */}
      <div className="absolute inset-x-0 bottom-0 z-10 px-2 pb-2 pointer-events-none">
        <div className="text-white font-bold text-[11px] sm:text-xs leading-tight truncate drop-shadow-lg">
          {translateCardName(language, hero.name)}
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <div className="flex items-center gap-0.5">
            <Swords className="w-3 h-3 text-amber-400 flex-shrink-0" />
            <span className="text-amber-400 font-semibold text-[10px] sm:text-[11px] drop-shadow-lg">
              {combatPower}
            </span>
          </div>
          <div className="flex items-center gap-0.5">
            <Shield className="w-3 h-3 text-sky-400 flex-shrink-0" />
            <span className="text-sky-400 font-semibold text-[10px] sm:text-[11px] drop-shadow-lg">
              {hero.currentDefense !== undefined ? `${hero.currentDefense}/${heroStats?.defense ?? 0}` : heroStats?.defense ?? 0}
            </span>
          </div>
          <div className="flex items-center gap-0.5">
            <Heart className="w-3 h-3 text-red-400 flex-shrink-0" />
            <span className="text-red-400 font-semibold text-[10px] sm:text-[11px] drop-shadow-lg">
              {hero.currentHealth !== undefined ? `${hero.currentHealth}/${heroStats?.health ?? 0}` : heroStats?.health ?? 0}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
