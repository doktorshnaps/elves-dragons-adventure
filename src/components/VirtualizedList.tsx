import { memo, ReactNode, useState, useEffect, useRef } from 'react';

interface VirtualizedListProps {
  items: any[];
  height: number;
  itemHeight: number;
  width?: number | string;
  renderItem: (item: any, index: number) => ReactNode;
  className?: string;
}

const VirtualizedList = memo(({ 
  items, 
  height, 
  itemHeight, 
  width = '100%', 
  renderItem,
  className = ''
}: VirtualizedListProps) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const totalHeight = items.length * itemHeight;
  const visibleItemCount = Math.ceil(height / itemHeight);
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(startIndex + visibleItemCount + 1, items.length);

  const visibleItems = items.slice(startIndex, endIndex);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  if (items.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        <p className="text-muted-foreground">Нет элементов для отображения</p>
      </div>
    );
  }

  return (
    <div 
      className={`overflow-auto ${className}`}
      style={{ height, width }}
      onScroll={handleScroll}
      ref={containerRef}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map((item, index) => (
          <div
            key={startIndex + index}
            style={{
              position: 'absolute',
              top: (startIndex + index) * itemHeight,
              height: itemHeight,
              width: '100%'
            }}
          >
            {renderItem(item, startIndex + index)}
          </div>
        ))}
      </div>
    </div>
  );
});

VirtualizedList.displayName = 'VirtualizedList';

export { VirtualizedList };