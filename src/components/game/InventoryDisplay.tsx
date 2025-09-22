
import { Item } from "@/types/inventory";
import { useDragonEggs } from "@/contexts/DragonEggContext";
import { useInventoryLogic } from "./inventory/useInventoryLogic";
import { InventoryHeader } from "./inventory/InventoryHeader";
import { DragonEggsList } from "./inventory/DragonEggsList";
import { InventoryGrid } from "./inventory/InventoryGrid";
import { CardRevealModal } from "./dialogs/CardRevealModal";
import { useGameData } from "@/hooks/useGameData";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import { t } from "@/utils/translations";
import { GroupedItem } from "./inventory/types";
import { cardDatabase } from "@/data/cardDatabase";
import { useCardInstances } from "@/hooks/useCardInstances";

interface InventoryDisplayProps {
  onUseItem?: (item: Item) => void;
  onSellItem?: (item: Item) => void;
  readonly?: boolean;
  showOnlyPotions?: boolean;
}

export const InventoryDisplay = ({ 
  onUseItem, 
  onSellItem,
  readonly = false,
  showOnlyPotions = false
}: InventoryDisplayProps) => {
  const { eggs, addEgg } = useDragonEggs();
  const { gameData, updateGameData } = useGameData();
  const { language } = useLanguage();
  const inventory = gameData.inventory || [];
  const { toast } = useToast();
  const {
    balance,
    groupItems,
    handleSellItem,
    handleOpenCardPack,
    isOpening,
    revealedCard,
    showRevealModal,
    closeRevealModal,
    showNextCard,
    currentCardIndex,
    totalCards
  } = useInventoryLogic(inventory);

  // Включаем карточки рабочих из card_instances и из колоды карт в общий список инвентаря
  const { cardInstances } = useCardInstances();

  const workerItemsFromInstances: Item[] = (cardInstances || [])
    .filter((ci) => ci.card_type === 'workers')
    .map((ci) => ({
      id: ci.id,
      name: (ci.card_data as any)?.name || 'Рабочий',
      type: 'worker',
      value: (ci.card_data as any)?.stats?.speedBoost ?? (ci.card_data as any)?.value ?? 0,
      description: (ci.card_data as any)?.description,
      image: (ci.card_data as any)?.image,
      stats: { workDuration: (ci.card_data as any)?.stats?.workDuration }
    }));

  const workerItemsFromCards: Item[] = (gameData.cards || [])
    .filter((c: any) => c?.type === 'worker' || c?.type === 'workers')
    .map((c: any) => ({
      id: c.id,
      name: c.name || 'Рабочий',
      type: 'worker',
      value: c.stats?.speedBoost ?? c.value ?? 0,
      description: c.description,
      image: c.image,
      stats: { workDuration: c.stats?.workDuration }
    }));

  const allInventoryItems: Item[] = [
    ...inventory,
    ...(showOnlyPotions ? [] : workerItemsFromInstances),
    ...(showOnlyPotions ? [] : workerItemsFromCards)
  ];


  const handleUseItem = async (groupedItem: GroupedItem): Promise<boolean | void> => {
    if (readonly || groupedItem.items.length === 0) return false;

    // Обработка яиц драконов: перенос в инкубатор
    if (groupedItem.type === 'dragon_egg') {
      const eggItem: any = groupedItem.items[0];
      const petName: string | undefined = eggItem.petName || (typeof eggItem.name === 'string' ? eggItem.name.split(' — ')[0] : undefined);
      const basePet = petName ? cardDatabase.find(c => c.type === 'pet' && c.name === petName) : undefined;
      const faction = (basePet as any)?.faction || 'Каледор';

      // Добавляем яйцо в контекст яиц и удаляем предмет из инвентаря
      await addEgg({
        id: String(eggItem.id),
        petName: petName || 'Неизвестный питомец',
        rarity: Number(eggItem.value) as any,
        createdAt: new Date().toISOString(),
        faction,
        incubationStarted: false,
      }, faction);

      const newInventory = inventory.filter(item => item.id !== eggItem.id);
      await updateGameData({ inventory: newInventory });

      toast({
        title: t(language, 'inventory.eggMoved'),
        description: t(language, 'inventory.eggMovedDescription'),
      });
      return false;
    }

    // Колоды карт открываются всегда (без внешнего обработчика)
    if (groupedItem.type === 'cardPack') {
      const shouldRemove = await handleOpenCardPack(groupedItem.items[0]);
      if (shouldRemove) {
        // Немедленно убираем группу из UI, чтобы не оставалась видимой после открытия всех колод
        const currentInventory = gameData.inventory || [];
        const newInventory = currentInventory.filter(i => !(i.type === 'cardPack' && i.name === groupedItem.name));
        await updateGameData({ inventory: newInventory });
      }
      return shouldRemove;
    }

    // Остальные предметы — через внешний обработчик, если он передан
    if (onUseItem) {
      const itemToUse = groupedItem.items[0];
      onUseItem(itemToUse);

      // Обновляем инвентарь после использования предмета
      const newInventory = inventory.filter(item => item.id !== itemToUse.id);
      await updateGameData({ inventory: newInventory });

      // Если это была последняя копия предмета в стопке
      if (groupedItem.count === 1) {
        toast({
          title: t(language, 'inventory.itemUsed'),
          description: `${groupedItem.name} ${t(language, 'inventory.itemUsedDescription')}`
        });
      } else {
        toast({
          title: t(language, 'inventory.itemUsed'),
          description: `${groupedItem.name} ${t(language, 'inventory.itemUsedDescription')} ${t(language, 'inventory.itemUsedDescriptionRemaining')} ${groupedItem.count - 1})`
        });
      }
    }
  };

  const handleGroupedSellItem = async (groupedItem: GroupedItem) => {
    // Verify the item(s) still exist in current inventory before selling
    const currentInv = (gameData.inventory || []).filter(item => item != null);
    const existingItem = groupedItem.items.find(it => 
      currentInv.some(ci => ci && ci.id === it.id)
    );
    const packsLeft = currentInv.filter(i => 
      i && i.type === 'cardPack' && i.name === groupedItem.name
    ).length;

    if (!existingItem) {
      toast({
        title: t(language, 'inventory.cannotSell'),
        description: t(language, 'inventory.itemNotInInventory'),
        variant: 'destructive'
      });
      return;
    }

    if (groupedItem.type === 'cardPack' && packsLeft < 1) {
      toast({
        title: t(language, 'inventory.noPacks'),
        description: t(language, 'inventory.noPacksToSell'),
        variant: 'destructive'
      });
      return;
    }

    if (onSellItem) {
      onSellItem(existingItem);
    } else {
      await handleSellItem(existingItem);
      const newInventory = currentInv.filter(item => item.id !== existingItem.id);
      await updateGameData({ inventory: newInventory });
    }
  };
  const filteredInventory = showOnlyPotions 
    ? allInventoryItems.filter(item => item.type === 'healthPotion')
    : allInventoryItems;

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
      <div className="p-4">
        <div className="space-y-4">
          <InventoryHeader balance={balance} />
          {!showOnlyPotions && <DragonEggsList eggs={eggs} />}
          <InventoryGrid
            groupedItems={groupItems(filteredInventory)}
            readonly={readonly}
            onUseItem={handleUseItem}
            onSellItem={handleGroupedSellItem}
          />
        </div>
      </div>
      
      <CardRevealModal
        isOpen={showRevealModal}
        onClose={closeRevealModal}
        revealedCard={revealedCard}
        onNextCard={showNextCard}
        currentIndex={currentCardIndex}
        totalCards={totalCards}
      />
    </div>
  );
};
