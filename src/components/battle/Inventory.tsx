import { Item } from "@/types/inventory";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface InventoryProps {
  items: Item[];
  onUseItem: (item: Item) => void;
}

interface GroupedItem {
  id: string;
  name: string;
  type: string;
  value: number;
  count: number;
  image?: string;
  items: Item[];
}

export const Inventory = ({ items, onUseItem }: InventoryProps) => {
  const isMobile = useIsMobile();
  
  // Фильтруем яйца драконов из инвентаря на странице битвы
  const battleItems = items.filter(item => item.type !== 'dragon_egg');

  // Группируем одинаковые предметы
  const groupedItems = battleItems.reduce<GroupedItem[]>((acc, item) => {
    const existingGroup = acc.find(
      group => 
        group.name === item.name && 
        group.type === item.type && 
        group.value === item.value
    );

    if (existingGroup) {
      existingGroup.count += 1;
      existingGroup.items.push(item);
    } else {
      acc.push({
        id: item.id,
        name: item.name,
        type: item.type,
        value: item.value,
        count: 1,
        image: item.image,
        items: [item]
      });
    }

    return acc;
  }, []);

  return (
    <div 
      className="mt-4 relative rounded-lg overflow-hidden"
      style={{
        backgroundImage: 'url("/lovable-uploads/2eecde4e-bda9-4f8f-8105-3e6dcdff36fc.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="p-4 bg-black/50 backdrop-blur-sm">
        <h2 className="text-xl font-bold text-game-accent mb-4">Инвентарь</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {groupedItems.map((group) => (
            <Card
              key={group.id}
              className="bg-game-surface/80 p-2 rounded-lg border border-game-accent flex flex-col items-center gap-2 backdrop-blur-sm"
            >
              {group.image && (
                <div className="w-12 h-12 relative">
                  <img
                    src={group.image}
                    alt={group.name}
                    className="w-full h-full object-contain"
                    loading="eager"
                  />
                </div>
              )}
              <span className="text-xs text-center text-game-accent">
                {group.name} {group.count > 1 && `(${group.count})`}
              </span>
              <Button
                variant="default"
                size={isMobile ? "sm" : "default"}
                onClick={() => onUseItem(group.items[0])}
                className="w-full text-xs"
              >
                Использовать
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};