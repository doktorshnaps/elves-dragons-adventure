import { Card } from '@/types/cards';
import { resolveCardImageSync } from '@/utils/cardImageResolver';
import { OptimizedImage } from '@/components/ui/optimized-image';

interface CardImageProps {
  image?: string;
  name: string;
  card?: Card;
}

export const CardImage = ({
  image,
  name,
  card
}: CardImageProps) => {
  // УПРОЩЕННАЯ ЛОГИКА: используем тот же подход что и в бою
  // Синхронное разрешение изображения без асинхронной загрузки из БД
  const resolvedImageUrl = card ? (resolveCardImageSync(card) || card.image || image) : image;

  // Используем приоритет: resolvedImageUrl (из card.image)
  const finalImageUrl = resolvedImageUrl || '/placeholder.svg';
  
  return <div className="w-full h-full overflow-hidden rounded-lg">
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
    </div>;
};