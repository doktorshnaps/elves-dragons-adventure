import { useEffect, useRef } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

interface CardImageProps {
  image?: string;
  name: string;
}

export const CardImage = ({ image, name }: CardImageProps) => {
  const isMobile = useIsMobile();
  const imgRef = useRef<HTMLImageElement>(null);

  // Нормализация IPFS URL
  const normalizeImageUrl = (url?: string): string => {
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

  useEffect(() => {
    if (imgRef.current && image) {
      const normalizedUrl = normalizeImageUrl(image);
      console.log('🖼️ Loading image:', normalizedUrl);
      
      const img = new Image();
      img.crossOrigin = 'anonymous'; // Для IPFS изображений
      
      img.onload = () => {
        console.log('✅ Image loaded successfully:', normalizedUrl);
        if (imgRef.current) {
          imgRef.current.src = normalizedUrl;
        }
      };
      
      img.onerror = (error) => {
        console.error('❌ Failed to load image:', normalizedUrl, error);
        if (imgRef.current) {
          imgRef.current.src = '/placeholder.svg';
        }
      };
      
      img.src = normalizedUrl;
      
      // Если изображение уже загружено из кэша
      if (img.complete) {
        if (imgRef.current) {
          imgRef.current.src = normalizedUrl;
        }
      }
    }
  }, [image]);

  if (!image) return null;

  return (
    <div className="w-full h-full overflow-hidden rounded-lg">
      <img 
        ref={imgRef}
        alt={name}
        className="w-full h-full object-cover"
        loading="eager"
        decoding="async"
        onError={(e) => {
          console.error('❌ Image element error for:', image);
          e.currentTarget.src = '/placeholder.svg';
        }}
      />
    </div>
  );
};