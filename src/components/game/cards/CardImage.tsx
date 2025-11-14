import { useEffect, useState } from "react";
import { Card } from '@/types/cards';
import { resolveCardImage } from '@/utils/cardImageResolver';
import { OptimizedImage } from '@/components/ui/optimized-image';

interface CardImageProps {
  image?: string;
  name: string;
  card?: Card; // Добавляем опциональный пропс для полной информации о карте
}

export const CardImage = ({ image, name, card }: CardImageProps) => {
  const [resolvedImageUrl, setResolvedImageUrl] = useState<string | undefined>(undefined);

  // Асинхронно загружаем изображение из БД если передана карта
  useEffect(() => {
    if (card) {
      resolveCardImage(card).then(setResolvedImageUrl);
    }
  }, [card]);

  // Нормализация IPFS URL
  const normalizeImageUrl = (url?: string): string => {
    // Используем resolvedImageUrl если оно загружено из БД
    if (resolvedImageUrl) {
      url = resolvedImageUrl;
    }
    if (!url) return '/placeholder.svg';
    
    try {
      // IPFS URL нормализация
      if (url.startsWith('ipfs://')) {
        return url.replace('ipfs://', 'https://ipfs.io/ipfs/');
      }
      
      // Если это просто IPFS хэш
      if (/^[a-zA-Z0-9]{46,}$/.test(url)) {
        return `https://ipfs.io/ipfs/${url}`;
      }
      
      // Если это URL с ar:// (Arweave)
      if (url.startsWith('ar://')) {
        return url.replace('ar://', 'https://arweave.net/');
      }
      
      return url;
    } catch (error) {
      console.error('Error normalizing image URL:', error);
      return '/placeholder.svg';
    }
  };

  if (!image && !resolvedImageUrl) return null;

  const finalImageUrl = normalizeImageUrl(resolvedImageUrl || image);

  return (
    <div className="w-full h-full overflow-hidden rounded-lg">
      <OptimizedImage
        src={finalImageUrl}
        alt={name}
        placeholder="/placeholder.svg"
        width={240}
        height={320}
        className="w-full h-full object-contain"
        priority={false}
        progressive={true}
      />
    </div>
  );
};