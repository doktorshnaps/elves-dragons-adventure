import { useEffect, useState } from "react";
import { Card } from '@/types/cards';
import { resolveCardImage, resolveCardImageSync } from '@/utils/cardImageResolver';
import { OptimizedImage } from '@/components/ui/optimized-image';
interface CardImageProps {
  image?: string;
  name: string;
  card?: Card; // Добавляем опциональный пропс для полной информации о карте
}
export const CardImage = ({
  image,
  name,
  card
}: CardImageProps) => {
  const initialResolved = card ? resolveCardImageSync(card) || card.image || image : image;
  const [resolvedImageUrl, setResolvedImageUrl] = useState<string | undefined>(initialResolved);

  // Асинхронно загружаем изображение из БД если передана карта
  useEffect(() => {
    if (card) {
      console.log(`🖼️ [CardImage] Resolving image for ${card.name} (faction: ${card.faction})`);
      resolveCardImage(card).then(url => {
        console.log(`✅ [CardImage] Resolved image for ${card.name}: ${url?.substring(0, 50)}...`);
        setResolvedImageUrl(url);
      });
    }
  }, [card]);

  // Нормализация IPFS URL
  const normalizeImageUrl = (url?: string): string => {
    if (!url) return '/placeholder.svg';
    try {
      let normalized = url.trim();

      // IPFS URL нормализация
      if (normalized.startsWith('ipfs://')) {
        normalized = normalized.replace('ipfs://', 'https://ipfs.io/ipfs/');
      }

      // Если это просто IPFS хэш
      if (/^[a-zA-Z0-9]{46,}$/.test(normalized)) {
        normalized = `https://ipfs.io/ipfs/${normalized}`;
      }

      // Если это URL с ar:// (Arweave)
      if (normalized.startsWith('ar://')) {
        normalized = normalized.replace('ar://', 'https://arweave.net/');
      }

      // Маршрут изображений: переводим удалённые PNG в WEBP (все PNG заменены на WEBP)
      // Работает и для относительных, и для абсолютных путей, содержащих "/lovable-uploads/"
      if (normalized.includes('/lovable-uploads/') && /\.png(\?|$)/i.test(normalized)) {
        normalized = normalized.replace(/\.png(\?|$)/i, '.webp$1');
      }
      return normalized || '/placeholder.svg';
    } catch (error) {
      console.error('Error normalizing image URL:', error);
      return '/placeholder.svg';
    }
  };

  // Используем приоритет: resolvedImageUrl -> image из карты -> image prop
  const finalImageUrl = normalizeImageUrl(resolvedImageUrl || card?.image || image);
  return <div className="w-full h-full overflow-hidden rounded-lg">
      <OptimizedImage src={finalImageUrl} alt={name} placeholder="/placeholder.svg" width={240} height={320} priority={false} progressive={true} className="w-full h-full object-cover border-none" />
    </div>;
};