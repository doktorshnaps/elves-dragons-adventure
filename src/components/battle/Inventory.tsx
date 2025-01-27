import { Item } from "@/types/inventory";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Coins } from "lucide-react";

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
              className="bg-game-surface/80 p-2 rounded-lg border border-game-accent flex flex-col h-[180px]"
            >
              <div className="flex flex-col gap-1 flex-grow">
                {group.image && (
                  <div className="relative w-full h-20 mb-1 rounded-lg overflow-hidden">
                    <img 
                      src={group.image} 
                      alt={group.name}
                      className="w-full h-full object-contain"
                      loading="eager"
                    />
                  </div>
                )}
                <div className="flex flex-col gap-1">
                  <h4 className="font-bold text-game-accent text-xs">
                    {group.name} {group.count > 1 && `(${group.count})`}
                  </h4>
                </div>
                <div className="mt-auto space-y-1">
                  <Button 
                    onClick={() => onUseItem(group.items[0])} 
                    variant="outline" 
                    size="sm"
                    className="w-full text-xs bg-game-surface/50 hover:bg-game-surface/70"
                  >
                    Использовать
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};