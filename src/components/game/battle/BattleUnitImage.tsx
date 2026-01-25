import React from 'react';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { useCardImage } from '@/hooks/useCardImage';

interface BattleUnitImageProps {
  unit: {
    name: string;
    type?: string;
    rarity?: number;
    faction?: string;
    image?: string;
  };
  unitType: 'hero' | 'dragon';
  alt: string;
  className?: string;
}

/**
 * Компонент для отображения изображения карты в бою.
 * Использует единый хук useCardImage для резолва из card_images.
 */
export const BattleUnitImage: React.FC<BattleUnitImageProps> = ({
  unit,
  unitType,
  alt,
  className
}) => {
  const src = useCardImage({
    name: unit.name,
    type: unit.type ?? (unitType === 'hero' ? 'character' : 'pet'),
    rarity: unit.rarity ?? 1,
    faction: unit.faction,
    image: unit.image,
  });

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={96}
      height={96}
      placeholder="/placeholder.svg"
      priority={false}
      progressive={false}
      className={className}
    />
  );
};
