
import { Item } from "@/types/inventory";
import { useDragonEggs } from "@/contexts/DragonEggContext";
import { useInventoryLogic } from "./inventory/useInventoryLogic";
import { InventoryHeader } from "./inventory/InventoryHeader";
import { DragonEggsList } from "./inventory/DragonEggsList";
import { InventoryGrid } from "./inventory/InventoryGrid";
import { CardRevealModal } from "./dialogs/CardRevealModal";
import { CardPackQuantityModal } from "./dialogs/CardPackQuantityModal";
import { useGameData } from "@/hooks/useGameData";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import { t } from "@/utils/translations";
import { GroupedItem } from "./inventory/types";
import { cardDatabase } from "@/data/cardDatabase";
import { useIsMobile } from "@/hooks/use-mobile";
import { useCardInstances } from "@/hooks/useCardInstances";
import { useItemInstances } from "@/hooks/useItemInstances";
import { useItemTemplates } from "@/hooks/useItemTemplates";

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
  const isMobile = useIsMobile();
  const { eggs, addEgg } = useDragonEggs();
  const { language } = useLanguage();
  const { toast } = useToast();
  
  // Очистка рабочих из inventory больше не нужна - они хранятся только в card_instances
  // useInventoryCleanup был удален

  // Источник истины: используем ТОЛЬКО item_instances для всех предметов
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
    totalCards,
    showQuantityModal,
    setShowQuantityModal,
    selectedPackItem,
    handleQuantityConfirm,
    skipAnimations,
    skipAllAnimations
  } = useInventoryLogic([]);  // inventory больше не используется

// Источник истины: используем ТОЛЬКО item_instances для всех предметов
const { cardInstances, loading: cardInstancesLoading } = useCardInstances();
const { instances: itemInstances, refetch: refetchItemInstances, loading: itemInstancesLoading } = useItemInstances();
const { getTemplate } = useItemTemplates();

const isInventoryLoading = cardInstancesLoading || itemInstancesLoading;

// Рабочие из card_instances
const workerItems: Item[] = (cardInstances || [])
  .filter(ci => ci.card_type === 'workers')
  .map(ci => ({
    id: ci.id,
    name: (ci.card_data as any)?.name || 'Рабочий',
    type: 'worker',
    value: (ci.card_data as any)?.value || 0,
    description: (ci.card_data as any)?.description,
    image: (ci.card_data as any)?.image,
    stats: (ci.card_data as any)?.stats || {}
  } as Item));

// ВСЕ предметы из item_instances (включая колоды и материалы)
const instanceItems: Item[] = (itemInstances || [])
  .map(inst => {
    // Получаем шаблон предмета из БД по template_id
    const template = inst.template_id ? getTemplate(String(inst.template_id)) : null;
    
    const item = {
      id: inst.id,
      name: inst.name || template?.name || 'Предмет',
      type: inst.type || template?.type || 'material',
      value: template?.value || 1,
      sell_price: template?.sell_price,
      description: inst.type === 'cardPack' ? 'Содержит 1 случайную карту' : template?.description,
      image: inst.type === 'cardPack' 
        ? '/lovable-uploads/e523dce0-4cda-4d32-b4e2-ecec40b1eb39.png'
        : template?.image_url, // ИСПРАВЛЕНО: используем image_url из template для обычных предметов
      image_url: template?.image_url,
      item_id: inst.item_id || template?.item_id, // Добавляем item_id для маппинга изображений
      template_id: inst.template_id
    } as Item;
    
    console.log('🔍 [InventoryDisplay] Creating item:', {
      name: item.name,
      type: item.type,
      image_url: item.image_url,
      item_id: item.item_id,
      template_id: item.template_id,
      inst_item_id: inst.item_id,
      template_image_url: template?.image_url
    });
    
    return item;
  });

// Объединяем только instance-based предметы
const allInventoryItems: Item[] = [
  ...workerItems,
  ...instanceItems,
];


  const handleUseItem = async (groupedItem: GroupedItem): Promise<boolean | void> => {
    if (readonly || groupedItem.items.length === 0) return false;

    // Обработка яиц драконов: перенос в инкубатор
    if (groupedItem.type === 'dragon_egg') {
      const eggItem: any = groupedItem.items[0];
      const petName: string | undefined = eggItem.petName || (typeof eggItem.name === 'string' ? eggItem.name.split(' — ')[0] : undefined);
      const basePet = petName ? cardDatabase.find(c => c.type === 'pet' && c.name === petName) : undefined;
      const faction = (basePet as any)?.faction || 'Каледор';

      // Добавляем яйцо в контекст яиц
      await addEgg({
        id: String(eggItem.id),
        petName: petName || 'Неизвестный питомец',
        rarity: Number(eggItem.value) as any,
        createdAt: new Date().toISOString(),
        faction,
        incubationStarted: false,
      }, faction);

      // Яйца НЕ хранятся в item_instances, только в контексте DragonEggContext
      // Ничего не удаляем из instances

      toast({
        title: t(language, 'inventory.eggMoved'),
        description: t(language, 'inventory.eggMovedDescription'),
      });
      return false;
    }

    // Колоды карт открываются всегда (без внешнего обработчика)
    if (groupedItem.type === 'cardPack') {
      const shouldRemove = await handleOpenCardPack(groupedItem.items[0]);
      // Принудительно обновляем список предметов после открытия колоды
      await refetchItemInstances();
      return shouldRemove;
    }

    // Остальные предметы — через внешний обработчик, если он передан
    if (onUseItem) {
      const itemToUse = groupedItem.items[0];
      onUseItem(itemToUse);
      // Предмет будет удален из item_instances внутри onUseItem

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

  const handleGroupedSellItem = async (groupedItem: GroupedItem, quantity: number = 1) => {
    // Берем первый предмет из группы
    const existingItem = groupedItem.items[0];

    if (!existingItem) {
      toast({
        title: t(language, 'inventory.cannotSell'),
        description: t(language, 'inventory.itemNotInInventory'),
        variant: 'destructive'
      });
      return;
    }

    if (onSellItem) {
      onSellItem(existingItem);
    } else {
      // handleSellItem работает с item_instances напрямую
      await handleSellItem(existingItem, quantity);
      // Принудительно обновляем список предметов после продажи
      await refetchItemInstances();
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
      <div className={`p-4 overflow-y-auto ${isMobile ? 'max-h-[calc(100vh-300px)]' : 'max-h-[calc(100vh-200px)]'}`}>
        <div className="space-y-4">
          <InventoryHeader balance={balance} />
          {!showOnlyPotions && <DragonEggsList eggs={eggs} />}
          <InventoryGrid
            groupedItems={groupItems(filteredInventory)}
            readonly={readonly}
            onUseItem={handleUseItem}
            onSellItem={handleGroupedSellItem}
            isLoading={isInventoryLoading}
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
        skipAnimations={skipAnimations}
        onSkipAll={skipAllAnimations}
      />
      
      <CardPackQuantityModal
        isOpen={showQuantityModal}
        onClose={() => setShowQuantityModal(false)}
        onConfirm={handleQuantityConfirm}
        item={selectedPackItem}
        availableCount={selectedPackItem ? itemInstances.filter(i => i.type === 'cardPack' && i.name === selectedPackItem.name).length : 0}
      />
    </div>
  );
};
