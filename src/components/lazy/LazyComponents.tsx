import { createLazyComponent, withLazyLoading } from '@/utils/lazyLoading';
import { ShopItemSkeleton } from '@/components/ui/skeleton';

// Lazy loading для основных страниц
export const LazyEquipment = createLazyComponent(
  () => import('@/pages/Equipment').then(module => ({ default: module.Equipment })),
  { 
    fallback: <div className="p-4">Загрузка экипировки...</div>,
    preload: false 
  }
);

export const LazyTeamStats = createLazyComponent(
  () => import('@/pages/TeamStats').then(module => ({ default: module.TeamStats })),
  { 
    fallback: <div className="p-4">Загрузка статистики команды...</div>,
    preload: false 
  }
);

export const LazyGrimoire = createLazyComponent(
  () => import('@/pages/Grimoire'),
  { 
    fallback: <div className="p-4">Загрузка гримуара...</div>,
    preload: false 
  }
);

// Lazy Battle удален - использует устаревшую механику подземелий

export const LazyDungeons = createLazyComponent(
  () => import('@/pages/Dungeons'),
  { 
    fallback: <div className="p-4">Загрузка подземелий...</div>,
    preload: false 
  }
);

export const LazyAdventuresPage = createLazyComponent(
  () => import('@/pages/AdventuresPage').then(module => ({ default: module.AdventuresPage })),
  { 
    fallback: <div className="p-4">Загрузка приключений...</div>,
    preload: false 
  }
);

export const LazyMarketplace = createLazyComponent(
  () => import('@/pages/Marketplace'),
  { 
    fallback: <div className="p-4">Загрузка торговой площадки...</div>,
    preload: false 
  }
);

export const LazyShopPage = createLazyComponent(
  () => import('@/pages/ShopPage').then(module => ({ default: module.ShopPage })),
  { 
    fallback: (
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Загрузка магазина...</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <ShopItemSkeleton key={index} />
          ))}
        </div>
      </div>
    ),
    preload: false 
  }
);

export const LazyQuestPage = createLazyComponent(
  () => import('@/pages/QuestPage').then(module => ({ default: module.QuestPage })),
  { 
    fallback: <div className="p-4">Загрузка заданий...</div>,
    preload: false 
  }
);

export const LazyShelter = createLazyComponent(
  () => import('@/pages/Shelter').then(module => ({ default: module.Shelter })),
  { 
    fallback: <div className="p-4">Загрузка убежища...</div>,
    preload: false 
  }
);

// Lazy loading для подземелий - только активные
export const LazySpiderNest = createLazyComponent(
  () => import('@/pages/dungeons/SpiderNest').then(module => ({ default: module.SpiderNest })),
  { 
    fallback: <div className="p-4">Загрузка паучьего гнезда...</div>,
    preload: false 
  }
);

export const LazyPantheonOfGods = createLazyComponent(
  () => import('@/pages/dungeons/PantheonOfGods').then(module => ({ default: module.PantheonOfGods })),
  { 
    fallback: <div className="p-4">Загрузка Пантеона Богов...</div>,
    preload: false 
  }
);

// Lazy loading для компонентов
export const LazyShop = createLazyComponent(
  () => import('@/components/Shop').then(module => ({ default: module.Shop })),
  { 
    fallback: (
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Загрузка магазина...</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <ShopItemSkeleton key={index} />
          ))}
        </div>
      </div>
    ),
    preload: false 
  }
);

export const LazyGameInterface = createLazyComponent(
  () => import('@/components/GameInterface').then(module => ({ default: module.GameInterface })),
  { 
    fallback: <div className="p-4">Загрузка игрового интерфейса...</div>,
    preload: true // Preload так как это критический компонент
  }
);

// Обертки с error handling
export const EquipmentWithLazyLoading = withLazyLoading(LazyEquipment);
export const TeamStatsWithLazyLoading = withLazyLoading(LazyTeamStats);
export const GrimoireWithLazyLoading = withLazyLoading(LazyGrimoire);
// BattleWithLazyLoading удален - использует устаревшую механику
export const DungeonsWithLazyLoading = withLazyLoading(LazyDungeons);
export const AdventuresPageWithLazyLoading = withLazyLoading(LazyAdventuresPage);
export const MarketplaceWithLazyLoading = withLazyLoading(LazyMarketplace);
export const ShopPageWithLazyLoading = withLazyLoading(LazyShopPage);
export const QuestPageWithLazyLoading = withLazyLoading(LazyQuestPage);
export const ShelterWithLazyLoading = withLazyLoading(LazyShelter);
export const ShopWithLazyLoading = withLazyLoading(LazyShop);
export const GameInterfaceWithLazyLoading = withLazyLoading(LazyGameInterface);

// Обертки для активных подземелий
export const SpiderNestWithLazyLoading = withLazyLoading(LazySpiderNest);
export const PantheonOfGodsWithLazyLoading = withLazyLoading(LazyPantheonOfGods);