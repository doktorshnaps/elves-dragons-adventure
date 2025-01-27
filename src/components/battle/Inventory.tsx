import { Item } from "@/types/inventory";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";

interface InventoryProps {
  items: Item[];
  onUseItem: (item: Item) => void;
}

export const Inventory = ({ items, onUseItem }: InventoryProps) => {
  const isMobile = useIsMobile();
  
  // Фильтруем яйца драконов из инвентаря на странице битвы
  const battleItems = items.filter(item => item.type !== 'dragon_egg');

  return (
    <div className="mt-4">
      <h2 className="text-xl font-bold text-game-accent mb-4">Инвентарь</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
        {battleItems.map((item) => (
          <div
            key={item.id}
            className="bg-game-surface p-2 rounded-lg border border-game-accent flex flex-col items-center gap-2"
          >
            {item.image && (
              <img
                src={item.image}
                alt={item.name}
                className="w-12 h-12 object-contain"
              />
            )}
            <span className="text-xs text-center text-game-accent">{item.name}</span>
            <Button
              variant="default"
              size={isMobile ? "sm" : "default"}
              onClick={() => onUseItem(item)}
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