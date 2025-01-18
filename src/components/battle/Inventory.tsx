import { Item } from "@/types/inventory";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";

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
    <div className="mt-4">
      <h2 className="text-xl font-bold text-game-accent mb-4">Инвентарь</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
        {groupedItems.map((group) => (
          <div
            key={group.id}
            className="bg-game-surface p-2 rounded-lg border border-game-accent flex flex-col items-center gap-2"
          >
            {group.image && (
              <img
                src={group.image}
                alt={group.name}
                className="w-12 h-12 object-contain"
              />
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
          </div>
        ))}
      </div>
    </div>
  );
};