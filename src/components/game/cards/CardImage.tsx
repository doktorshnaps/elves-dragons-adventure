import { Card } from '@/types/cards';
import { useCardImage } from '@/hooks/useCardImage';
import { OptimizedImage } from '@/components/ui/optimized-image';

interface CardImageProps {
  image?: string;
  name: string;
  card?: Card;
}

export const CardImage = ({ image, name, card }: CardImageProps) => {
  // Единый источник изображений из card_images с подпиской на кэш
  const finalImageUrl = useCardImage(
    card
      ? {
          name: card.name,
          type: (card as any).type,
          rarity: card.rarity,
          faction: card.faction,
          image: card.image || image,
        }
      : { name, image }
  );

  return (
    <div className="w-full h-full overflow-hidden rounded-lg">
      <OptimizedImage
        src={finalImageUrl}
        alt={name}
        placeholder="/placeholder.svg"
        width={240}
        height={320}
        priority={false}
        progressive={true}
        className="w-full h-full object-cover border-none"
      />
    </div>
  );
};
