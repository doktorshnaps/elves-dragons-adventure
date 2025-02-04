import { useEffect, useRef } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

interface CardImageProps {
  image?: string;
  name: string;
}

export const CardImage = ({ image, name }: CardImageProps) => {
  const isMobile = useIsMobile();
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (imgRef.current && image) {
      const img = new Image();
      img.src = image;
      
      if (img.complete) {
        imgRef.current.src = image;
      } else {
        img.onload = () => {
          if (imgRef.current) {
            imgRef.current.src = image;
          }
        };
      }
    }
  }, [image]);

  if (!image) return null;

  return (
    <div className={`w-full ${isMobile ? 'aspect-[3/4]' : 'aspect-square'} mb-0.5 rounded-lg overflow-hidden`}>
      <img 
        ref={imgRef}
        alt={name}
        className="w-full h-full object-cover"
        loading="eager"
        decoding="async"
      />
    </div>
  );
};