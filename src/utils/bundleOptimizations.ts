// Bundle optimization utilities
import { lazy } from 'react';

// Dynamic imports для библиотек
export const loadLucideIcons = () => import('lucide-react');
export const loadFramerMotion = () => import('framer-motion');
export const loadReactHookForm = () => import('react-hook-form');
export const loadDateFns = () => import('date-fns');

// Preload critical libraries на idle время
export const preloadCriticalLibs = () => {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      loadLucideIcons();
      loadFramerMotion();
    });
  } else {
    setTimeout(() => {
      loadLucideIcons();
      loadFramerMotion();
    }, 100);
  }
};

// Tree shaking helper для lucide icons
export const createIconLoader = (iconNames: string[]) => {
  return iconNames.reduce((acc, iconName) => {
    acc[iconName] = lazy(() => 
      import('lucide-react').then(module => ({ 
        default: module[iconName as keyof typeof module] 
      }))
    );
    return acc;
  }, {} as Record<string, React.LazyExoticComponent<any>>);
};

// Chunk splitting для карт и изображений
export const loadCardChunk = (chunkName: string) => {
  return import(/* webpackChunkName: "[request]" */ `@/data/cards/${chunkName}`);
};

export const loadImageChunk = (chunkName: string) => {
  return import(/* webpackChunkName: "[request]" */ `@/assets/images/${chunkName}`);
};