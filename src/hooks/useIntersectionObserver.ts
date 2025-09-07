import { useEffect, useRef, useState, useCallback } from 'react';

interface IntersectionOptions extends IntersectionObserverInit {
  freezeOnceVisible?: boolean;
}

export const useIntersectionObserver = (
  options: IntersectionOptions = {}
) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);
  const elementRef = useRef<HTMLElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const { freezeOnceVisible = false, ...observerOptions } = options;

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isElementIntersecting = entry.isIntersecting;
        
        setIsIntersecting(isElementIntersecting);
        
        if (isElementIntersecting && !hasBeenVisible) {
          setHasBeenVisible(true);
        }

        // Если freezeOnceVisible = true и элемент стал видимым, 
        // прекращаем наблюдение
        if (freezeOnceVisible && isElementIntersecting) {
          observer.unobserve(element);
        }
      },
      {
        threshold: 0.1,
        ...observerOptions
      }
    );

    observer.observe(element);
    observerRef.current = observer;

    return () => {
      observer.disconnect();
    };
  }, [freezeOnceVisible, hasBeenVisible, observerOptions]);

  const resetVisibility = useCallback(() => {
    setHasBeenVisible(false);
    setIsIntersecting(false);
    
    // Перезапускаем наблюдение если нужно
    const element = elementRef.current;
    if (element && observerRef.current) {
      observerRef.current.observe(element);
    }
  }, []);

  return {
    elementRef,
    isIntersecting,
    hasBeenVisible,
    resetVisibility
  };
};

// Хук для lazy loading изображений
export const useLazyImage = (src: string, placeholder?: string) => {
  const [imageSrc, setImageSrc] = useState(placeholder || '');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  
  const { elementRef, isIntersecting, hasBeenVisible } = useIntersectionObserver({
    freezeOnceVisible: true,
    threshold: 0.1
  });

  useEffect(() => {
    if (isIntersecting && !hasBeenVisible && src) {
      const img = new Image();
      
      img.onload = () => {
        setImageSrc(src);
        setIsLoaded(true);
        setIsError(false);
      };
      
      img.onerror = () => {
        setIsError(true);
        setIsLoaded(false);
      };
      
      img.src = src;
    }
  }, [isIntersecting, hasBeenVisible, src]);

  return {
    elementRef,
    imageSrc,
    isLoaded,
    isError,
    isIntersecting
  };
};

// Хук для lazy loading любого контента
export const useLazyContent = (
  loadContent: () => Promise<any>,
  dependencies: any[] = []
) => {
  const [content, setContent] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const { elementRef, isIntersecting, hasBeenVisible } = useIntersectionObserver({
    freezeOnceVisible: true
  });

  useEffect(() => {
    if (isIntersecting && !hasBeenVisible && !content) {
      setIsLoading(true);
      setError(null);
      
      loadContent()
        .then((result) => {
          setContent(result);
          setIsLoading(false);
        })
        .catch((err) => {
          setError(err);
          setIsLoading(false);
        });
    }
  }, [isIntersecting, hasBeenVisible, content, loadContent, ...dependencies]);

  return {
    elementRef,
    content,
    isLoading,
    error,
    isIntersecting
  };
};