import React from 'react';
import { useLazyImage } from '@/hooks/useIntersectionObserver';
import { cn } from '@/lib/utils';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholder?: string;
  fallback?: string;
  containerClassName?: string;
  loadingClassName?: string;
  errorClassName?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  placeholder = '',
  fallback = '/placeholder.svg',
  className,
  containerClassName,
  loadingClassName,
  errorClassName,
  onLoad,
  onError,
  ...props
}) => {
  const { elementRef, imageSrc, isLoaded, isError, isIntersecting } = useLazyImage(src, placeholder);

  const handleLoad = () => {
    onLoad?.();
  };

  const handleError = () => {
    onError?.();
  };

  return (
    <div 
      ref={elementRef as React.RefObject<HTMLDivElement>}
      className={cn("relative overflow-hidden", containerClassName)}
    >
      {!isLoaded && !isError && isIntersecting && (
        <div className={cn(
          "absolute inset-0 bg-muted animate-pulse flex items-center justify-center",
          loadingClassName
        )}>
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      
      {isError && (
        <div className={cn(
          "absolute inset-0 bg-muted flex items-center justify-center text-muted-foreground",
          errorClassName
        )}>
          <img 
            src={fallback}
            alt={alt}
            className={className}
            {...props}
          />
        </div>
      )}
      
      <img
        src={imageSrc || placeholder}
        alt={alt}
        className={cn(
          "transition-opacity duration-300",
          isLoaded ? "opacity-100" : "opacity-0",
          className
        )}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
    </div>
  );
};

// Специализированные компоненты для разных типов изображений
export const LazyGameCardImage: React.FC<LazyImageProps> = (props) => (
  <LazyImage
    {...props}
    containerClassName={cn("aspect-[3/4] rounded-lg overflow-hidden", props.containerClassName)}
    className={cn("w-full h-full object-cover", props.className)}
    placeholder="/api/placeholder/200/267"
  />
);

export const LazyShopItemImage: React.FC<LazyImageProps> = (props) => (
  <LazyImage
    {...props}
    containerClassName={cn("aspect-[4/3] rounded-lg overflow-hidden", props.containerClassName)}
    className={cn("w-full h-full object-cover", props.className)}
    placeholder="/api/placeholder/320/240"
  />
);

export const LazyAvatarImage: React.FC<LazyImageProps> = (props) => (
  <LazyImage
    {...props}
    containerClassName={cn("aspect-square rounded-full overflow-hidden", props.containerClassName)}
    className={cn("w-full h-full object-cover", props.className)}
    placeholder="/api/placeholder/80/80"
  />
);

export const LazyHeroImage: React.FC<LazyImageProps> = (props) => (
  <LazyImage
    {...props}
    containerClassName={cn("aspect-[16/9] rounded-lg overflow-hidden", props.containerClassName)}
    className={cn("w-full h-full object-cover", props.className)}
    placeholder="/api/placeholder/1920/1080"
  />
);