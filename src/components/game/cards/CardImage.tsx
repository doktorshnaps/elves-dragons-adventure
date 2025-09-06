import { useEffect, useRef } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

interface CardImageProps {
  image?: string;
  name: string;
}

export const CardImage = ({ image, name }: CardImageProps) => {
  const isMobile = useIsMobile();
  const imgRef = useRef<HTMLImageElement>(null);
  const attemptRef = useRef(0);

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

  // Построение списка альтернативных IPFS шлюзов для одного и того же ресурса
  const buildGatewayUrls = (url: string): string[] => {
    try {
      const urls = new Set<string>();
      urls.add(url);

      const addIpfsVariants = (cid: string, path: string) => {
        const suffix = path.startsWith('/') ? path : `/${path}`;
        urls.add(`https://ipfs.io/ipfs/${cid}${suffix}`);
        urls.add(`https://cloudflare-ipfs.com/ipfs/${cid}${suffix}`);
        urls.add(`https://dweb.link/ipfs/${cid}${suffix}`);
        urls.add(`https://nftstorage.link/ipfs/${cid}${suffix}`);
      };

      const u = new URL(url);
      const host = u.hostname;
      const path = u.pathname;

      // 1) Subdomain gateway like <cid>.ipfs.nftstorage.link
      const subdomainCid = host.match(/^([a-z0-9]{46,})\.ipfs\./i)?.[1];
      if (subdomainCid) {
        addIpfsVariants(subdomainCid, path);
      }

      // 2) Path gateway like /ipfs/<cid>/...
      const m = path.match(/^\/ipfs\/([a-z0-9]{46,})(\/.*)?/i);
      if (m) {
        addIpfsVariants(m[1], m[2] || '');
      }

      return Array.from(urls);
    } catch {
      return [url];
    }
  };
  useEffect(() => {
    if (!imgRef.current || !image) return;

    const normalizedUrl = normalizeImageUrl(image);
    const candidates = buildGatewayUrls(normalizedUrl);

    let isCancelled = false;

    const tryLoad = (index: number) => {
      if (isCancelled) return;
      if (index >= candidates.length) {
        if (imgRef.current) imgRef.current.src = '/placeholder.svg';
        return;
      }

      const url = candidates[index];
      attemptRef.current = index;
      console.log(`🖼️ Trying image [${index + 1}/${candidates.length}]:`, url);

      const img = new Image();
      img.crossOrigin = 'anonymous';
      (img as any).referrerPolicy = 'no-referrer';

      img.onload = () => {
        if (isCancelled) return;
        console.log('✅ Image loaded:', url);
        if (imgRef.current) imgRef.current.src = url;
      };

      img.onerror = () => {
        if (isCancelled) return;
        console.warn('⚠️ Gateway failed, trying next:', url);
        tryLoad(index + 1);
      };

      img.src = url;
      if (img.complete) {
        if (imgRef.current) imgRef.current.src = url;
      }
    };

    tryLoad(0);

    return () => {
      isCancelled = true;
    };
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
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
        onError={(e) => {
          console.error('❌ Image element error for:', image);
          e.currentTarget.src = '/placeholder.svg';
        }}
      />
    </div>
  );
};