import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

export { Skeleton }

// Готовые skeleton компоненты для разных частей UI
export const CardSkeleton = () => (
  <div className="p-4 border rounded-lg space-y-3">
    <Skeleton className="h-[120px] w-full" />
    <Skeleton className="h-4 w-[60%]" />
    <Skeleton className="h-4 w-[40%]" />
    <div className="flex justify-between items-center">
      <Skeleton className="h-4 w-[30%]" />
      <Skeleton className="h-8 w-20 rounded-md" />
    </div>
  </div>
);

export const ListSkeleton = ({ items = 5 }: { items?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: items }).map((_, index) => (
      <div key={index} className="flex items-center space-x-3 p-3 border rounded">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-[70%]" />
          <Skeleton className="h-4 w-[40%]" />
        </div>
        <Skeleton className="h-6 w-15 rounded" />
      </div>
    ))}
  </div>
);

export const TableSkeleton = ({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) => (
  <div className="space-y-3">
    {/* Header */}
    <div className="flex space-x-3 p-3 border-b">
      {Array.from({ length: columns }).map((_, index) => (
        <Skeleton key={index} className="h-5 w-full" />
      ))}
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="flex space-x-3 p-3">
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton key={colIndex} className="h-4 w-full" />
        ))}
      </div>
    ))}
  </div>
);

export const GameCardSkeleton = () => (
  <div className="p-4 bg-game-surface border border-game-accent rounded-lg space-y-3">
    <Skeleton className="h-40 w-full rounded-lg" />
    <div className="space-y-2">
      <Skeleton className="h-5 w-[80%]" />
      <Skeleton className="h-4 w-[60%]" />
    </div>
    <div className="flex justify-between items-center">
      <div className="flex space-x-2">
        <Skeleton className="h-6 w-6 rounded-full" />
        <Skeleton className="h-6 w-6 rounded-full" />
        <Skeleton className="h-6 w-6 rounded-full" />
      </div>
      <Skeleton className="h-4 w-[30%]" />
    </div>
  </div>
);

export const ShopItemSkeleton = () => (
  <div className="p-4 bg-game-background border border-game-accent rounded-lg space-y-3">
    <Skeleton className="h-[120px] w-full rounded-lg" />
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Skeleton className="h-[18px] w-[60%]" />
        <Skeleton className="h-4 w-[20%]" />
      </div>
      <Skeleton className="h-[14px] w-full" />
      <Skeleton className="h-4 w-[40%]" />
    </div>
    <Skeleton className="h-9 w-full rounded" />
  </div>
);

export const MarketplaceListingSkeleton = () => (
  <div className="p-4 border rounded-lg space-y-3">
    <div className="flex space-x-3">
      <Skeleton className="h-20 w-20 rounded" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-[18px] w-[70%]" />
        <Skeleton className="h-[14px] w-[50%]" />
        <Skeleton className="h-4 w-[30%]" />
      </div>
    </div>
    <div className="flex justify-between items-center">
      <Skeleton className="h-5 w-[40%]" />
      <Skeleton className="h-9 w-25 rounded" />
    </div>
  </div>
);