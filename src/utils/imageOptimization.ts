// Image optimization utilities
import { preloadImage } from './performance';

// WebP detection and fallback
export const supportsWebP = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const webP = new Image();
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2);
    };
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
};

// Smart image format selection
export const getOptimalImageSrc = (baseSrc: string, isWebPSupported: boolean): string => {
  if (!baseSrc) return baseSrc;
  
  // Если поддерживается WebP и это не уже WebP
  if (isWebPSupported && !baseSrc.includes('.webp')) {
    // Заменяем расширение на .webp
    return baseSrc.replace(/\.(jpg|jpeg|png)$/i, '.webp');
  }
  
  return baseSrc;
};

// Responsive image loading
export const getResponsiveImageSrc = (
  baseSrc: string, 
  width: number, 
  devicePixelRatio: number = window.devicePixelRatio || 1
): string => {
  if (!baseSrc) return baseSrc;
  
  const targetWidth = Math.ceil(width * devicePixelRatio);
  
  // Если это внешний URL, placeholder или уже содержит параметры размера
  if (baseSrc.startsWith('http') || baseSrc.includes('?') || baseSrc.includes('placeholder')) {
    return baseSrc;
  }
  
  // Добавляем суффикс размера для локальных изображений
  const extension = baseSrc.split('.').pop();
  const nameWithoutExt = baseSrc.replace(`.${extension}`, '');
  
  return `${nameWithoutExt}_${targetWidth}w.${extension}`;
};

// Progressive image loading
export class ProgressiveImageLoader {
  private cache = new Map<string, string>();
  private loading = new Set<string>();
  
  async loadProgressive(
    placeholder: string,
    lowQuality: string,
    highQuality: string
  ): Promise<{ current: string; isLoaded: boolean }> {
    
    // Если high quality уже загружено
    if (this.cache.has(highQuality)) {
      return { current: this.cache.get(highQuality)!, isLoaded: true };
    }
    
    // Если уже загружается
    if (this.loading.has(highQuality)) {
      return { current: lowQuality, isLoaded: false };
    }
    
    this.loading.add(highQuality);
    
    try {
      // Сначала показываем low quality
      await preloadImage(lowQuality);
      
      // Затем загружаем high quality в фоне
      await preloadImage(highQuality);
      
      this.cache.set(highQuality, highQuality);
      this.loading.delete(highQuality);
      
      return { current: highQuality, isLoaded: true };
    } catch (error) {
      this.loading.delete(highQuality);
      // Fallback к low quality при ошибке
      return { current: lowQuality, isLoaded: false };
    }
  }
  
  // Preload critical images
  async preloadCritical(urls: string[]): Promise<void> {
    const criticalPromises = urls.slice(0, 5).map(url => 
      preloadImage(url).catch(() => {}) // Ignore individual failures
    );
    
    await Promise.allSettled(criticalPromises);
    
    // Preload remaining images with lower priority
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        const remainingPromises = urls.slice(5).map(url => 
          preloadImage(url).catch(() => {})
        );
        Promise.allSettled(remainingPromises);
      });
    }
  }
}

export const progressiveImageLoader = new ProgressiveImageLoader();

// Image compression utilities
export const compressImage = (
  file: File, 
  maxWidth: number = 800, 
  quality: number = 0.8
): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      
      // Draw and compress
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const compressedFile = new File([blob], file.name, {
            type: 'image/webp',
            lastModified: Date.now()
          });
          resolve(compressedFile);
        } else {
          resolve(file);
        }
      }, 'image/webp', quality);
    };
    
    img.src = URL.createObjectURL(file);
  });
};