import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";

export const GameSkeleton = () => {
  const isMobile = useIsMobile();
  
  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      <div className={`max-w-7xl mx-auto ${isMobile ? 'px-2' : 'px-6'} py-4`}>
        <div className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-48 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};