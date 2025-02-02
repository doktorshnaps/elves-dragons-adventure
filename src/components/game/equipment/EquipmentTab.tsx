import { Card } from "@/components/ui/card";
import { EquipmentGrid } from "../stats/EquipmentGrid";
import { useInventoryState } from "@/hooks/useInventoryState";
import { InventoryDisplay } from "../InventoryDisplay";
import { Item } from "@/types/inventory";
import { canEquipItem, getEquipmentSlot } from "@/utils/itemUtils";
import { useToast } from "@/hooks/use-toast";

export const EquipmentTab = () => {
  const { inventory, updateInventory } = useInventoryState();
  const { toast } = useToast();

  const handleUseItem = (item: Item) => {
    if (!canEquipItem(item)) {
      toast({
        title: "Ошибка",
        description: "Этот предмет нельзя экипировать",
        variant: "destructive",
      });
      return;
    }

    const slot = getEquipmentSlot(item);
    if (!slot) {
      toast({
        title: "Ошибка",
        description: "Неверный слот для предмета",
        variant: "destructive",
      });
      return;
    }

    // Если предмет уже экипирован, снимаем его
    if (item.equipped) {
      const updatedInventory = inventory.map((invItem) =>
        invItem.id === item.id ? { ...invItem, equipped: false } : invItem
      );
      updateInventory(updatedInventory);
      toast({
        title: "Готово",
        description: `${item.name} снят`,
      });
      return;
    }

    // Снимаем предмет с того же слота, если он есть
    const equippedInSlot = inventory.find(
      (invItem) => invItem.equipped && invItem.slot === slot && invItem.id !== item.id
    );

    const updatedInventory = inventory.map((invItem) => {
      if (invItem.id === item.id) {
        return { ...invItem, equipped: true, slot };
      }
      if (equippedInSlot && invItem.id === equippedInSlot.id) {
        return { ...invItem, equipped: false };
      }
      return invItem;
    });

    updateInventory(updatedInventory);
    toast({
      title: "Готово",
      description: `${item.name} экипирован`,
    });
  };

  return (
    <div className="space-y-6">
      <Card 
        className="p-6 bg-game-surface border-game-accent relative overflow-hidden"
        style={{
          backgroundImage: `url("/lovable-uploads/29ea34c8-ede8-4cab-8ca2-049cdb5108c3.png")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="absolute inset-0 bg-game-surface/90 backdrop-blur-sm" />
        <div className="relative z-10">
          <h2 className="text-xl font-bold text-game-accent mb-6">Снаряжение игрока</h2>
          <EquipmentGrid />
        </div>
      </Card>

      <div className="mt-6">
        <h3 className="text-xl font-bold text-game-accent mb-4">Инвентарь</h3>
        <InventoryDisplay onUseItem={handleUseItem} readonly={false} />
      </div>
    </div>
  );
};