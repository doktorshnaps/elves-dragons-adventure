import React from 'react';
import { cn } from '@/lib/utils';

// Base skeleton component
interface SkeletonProps {
  className?: string;
  animate?: boolean;
}

const Skeleton: React.FC<SkeletonProps> = ({ 
  className, 
  animate = true 
}) => (
  <div
    className={cn(
      'bg-muted rounded-md',
      animate && 'animate-pulse',
      className
    )}
  />
);

// Card skeleton
export const CardSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('space-y-3', className)}>
    <Skeleton className="h-40 w-full" />
    <div className="space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  </div>
);

// Team stats skeleton
export const TeamStatsSkeleton: React.FC = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  </div>
);

// Shop skeleton
export const ShopSkeleton: React.FC = () => (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-10 w-24" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-8 w-full" />
        </div>
      ))}
    </div>
  </div>
);

// Game header skeleton
export const GameHeaderSkeleton: React.FC = () => (
  <div className="flex justify-between items-center p-4">
    <Skeleton className="h-8 w-40" />
    <div className="flex space-x-4">
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-8 w-8 rounded-full" />
    </div>
  </div>
);

// Equipment skeleton
export const EquipmentSkeleton: React.FC = () => (
  <div className="space-y-6">
    <GameHeaderSkeleton />
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-24 w-full aspect-square" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ))}
    </div>
  </div>
);

// Adventure skeleton
export const AdventureSkeleton: React.FC = () => (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-6 w-32" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-32 w-full" />
        <div className="flex space-x-2">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-32 w-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    </div>
  </div>
);

// Loading screen with game branding
export const GameLoadingSkeleton: React.FC<{ 
  title?: string;
  subtitle?: string;
}> = ({ 
  title = "Загрузка игры...",
  subtitle = "Подготавливаем ваши данные"
}) => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-12 w-64 mx-auto" />
        <Skeleton className="h-6 w-48 mx-auto" />
      </div>
      <div className="space-y-4">
        <div className="w-64 h-2 bg-muted rounded-full overflow-hidden mx-auto">
          <div className="h-full bg-primary/30 rounded-full animate-pulse" />
        </div>
        <div className="text-sm text-muted-foreground">
          {title}
          <div className="text-xs mt-1">{subtitle}</div>
        </div>
      </div>
    </div>
  </div>
);

export { Skeleton };