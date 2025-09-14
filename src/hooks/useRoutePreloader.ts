import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { usePreloader } from '@/utils/lazyLoading';
import {
  LazyEquipment,
  LazyTeamStats,
  LazyGrimoire,
  // LazyBattle удален - использует устаревшую механику
  LazyDungeons,
  LazyMarketplace,
  LazyShopPage,
  LazyQuestPage,
  LazyShelter,
  LazyAdventuresPage,
  LazySpiderNest
} from '@/components/lazy/LazyComponents';

// Маппинг роутов к компонентам для preloading
const routeComponentMap = {
  '/equipment': LazyEquipment,
  '/team': LazyTeamStats,
  '/statistics': LazyTeamStats,
  '/grimoire': LazyGrimoire,
  // '/battle': LazyBattle, // удален - использует устаревшую механику
  '/dungeons': LazyDungeons,
  '/dungeons/spider-nest': LazySpiderNest,
  '/marketplace': LazyMarketplace,
  '/shop': LazyShopPage,
  '/quest': LazyQuestPage,
  '/shelter': LazyShelter,
  '/adventure': LazyAdventuresPage
};

// Связанные компоненты для интеллектуального preloading
const relatedComponents = {
  '/': [LazyEquipment, LazyTeamStats], // На главной preload основные разделы
  '/menu': [LazyEquipment, LazyTeamStats, LazyShopPage, LazySpiderNest],
  '/dungeons': [LazyAdventuresPage, LazySpiderNest], // убрали LazyBattle
  '/equipment': [LazyTeamStats, LazyShopPage],
  '/marketplace': [LazyShopPage],
  '/shop': [LazyMarketplace],
  // '/battle': [LazyDungeons], // удален
  '/team': [LazyEquipment] // убрали LazyBattle
};

export const useRoutePreloader = () => {
  const location = useLocation();
  const { preloadComponent, preloadMultiple } = usePreloader();

  // Preload компонента для текущего роута
  const preloadCurrentRoute = useCallback(() => {
    const currentComponent = routeComponentMap[location.pathname as keyof typeof routeComponentMap];
    if (currentComponent) {
      preloadComponent(currentComponent);
    }
  }, [location.pathname, preloadComponent]);

  // Preload связанных компонентов
  const preloadRelatedComponents = useCallback(() => {
    const related = relatedComponents[location.pathname as keyof typeof relatedComponents];
    if (related) {
      preloadMultiple(related);
    }
  }, [location.pathname, preloadMultiple]);

  // Preload на основе пользовательского поведения
  const preloadOnHover = useCallback((targetRoute: string) => {
    const component = routeComponentMap[targetRoute as keyof typeof routeComponentMap];
    if (component) {
      preloadComponent(component);
    }
  }, [preloadComponent]);

  // Preload критически важных компонентов при старте
  const preloadCritical = useCallback(() => {
    // Preload самых часто используемых компонентов
    preloadMultiple([LazyEquipment, LazyTeamStats, LazyShopPage]);
  }, [preloadMultiple]);

  // Автоматический preload при изменении роута
  useEffect(() => {
    // Небольшая задержка чтобы не блокировать загрузку текущей страницы
    const timer = setTimeout(() => {
      preloadCurrentRoute();
      preloadRelatedComponents();
    }, 100);

    return () => clearTimeout(timer);
  }, [preloadCurrentRoute, preloadRelatedComponents]);

  // Preload критических компонентов при первой загрузке
  useEffect(() => {
    const timer = setTimeout(preloadCritical, 2000); // Через 2 секунды после загрузки
    return () => clearTimeout(timer);
  }, [preloadCritical]);

  return {
    preloadOnHover,
    preloadCritical,
    preloadCurrentRoute,
    preloadRelatedComponents
  };
};