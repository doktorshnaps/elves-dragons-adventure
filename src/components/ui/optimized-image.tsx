import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { 
  supportsWebP, 
  getOptimalImageSrc, 
  getResponsiveImageSrc, 
  progressiveImageLoader 
} from '@/utils/imageOptimization';

interface OptimizedImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string;
  alt: string;
  lowQualitySrc?: string;
  placeholder?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  progressive?: boolean;
  responsive?: boolean;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  lowQualitySrc,
  placeholder,
  width,
  height,
  priority = false,
  progressive = false,
  responsive = true,
  className,
  ...props
}) => {
  const [currentSrc, setCurrentSrc] = useState(placeholder || src);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [webPSupported, setWebPSupported] = useState(false);

  // Check WebP support
  useEffect(() => {
    supportsWebP().then(setWebPSupported);
  }, []);

  // Progressive loading
  useEffect(() => {
    if (!progressive || !lowQualitySrc) return;

    const loadProgressive = async () => {
      try {
        const result = await progressiveImageLoader.loadProgressive(
          placeholder || src,
          lowQualitySrc,
          src
        );
        setCurrentSrc(result.current);
        setIsLoaded(result.isLoaded);
      } catch (error) {
        setHasError(true);
        console.warn('Progressive image loading failed:', error);
      }
    };

    loadProgressive();
  }, [src, lowQualitySrc, placeholder, progressive]);

  // Get optimal src
  const optimizedSrc = React.useMemo(() => {
    if (hasError) return placeholder || src;
    
    let targetSrc = currentSrc;
    
    // Apply WebP optimization
    if (webPSupported) {
      targetSrc = getOptimalImageSrc(targetSrc, true);
    }
    
    // Apply responsive sizing
    if (responsive && width) {
      targetSrc = getResponsiveImageSrc(targetSrc, width);
    }
    
    return targetSrc;
  }, [currentSrc, webPSupported, responsive, width, hasError, placeholder, src]);

  const handleLoad = () => {
    setIsLoaded(true);
    setHasError(false);
  };

  const handleError = () => {
    setHasError(true);
    if (placeholder && currentSrc !== placeholder) {
      setCurrentSrc(placeholder);
    }
  };

  return (
    <img
      src={optimizedSrc}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      onLoad={handleLoad}
      onError={handleError}
      className={cn(
        'transition-opacity duration-300',
        {
          'opacity-0': !isLoaded && !hasError,
          'opacity-100': isLoaded || hasError,
        },
        className
      )}
      {...props}
    />
  );
};

// Optimized variants for specific use cases
export const OptimizedGameCardImage: React.FC<Omit<OptimizedImageProps, 'responsive' | 'width' | 'height'>> = (props) => (
  <OptimizedImage
    {...props}
    width={240}
    height={320}
    responsive={true}
    className={cn('aspect-[3/4] object-cover', props.className)}
  />
);

export const OptimizedAvatarImage: React.FC<Omit<OptimizedImageProps, 'responsive' | 'width' | 'height'>> = (props) => (
  <OptimizedImage
    {...props}
    width={64}
    height={64}
    responsive={true}
    className={cn('aspect-square rounded-full object-cover', props.className)}
  />
);

export const OptimizedHeroImage: React.FC<Omit<OptimizedImageProps, 'responsive' | 'width' | 'height'>> = (props) => (
  <OptimizedImage
    {...props}
    width={1200}
    height={675}
    responsive={true}
    priority={true}
    className={cn('aspect-video object-cover', props.className)}
  />
);