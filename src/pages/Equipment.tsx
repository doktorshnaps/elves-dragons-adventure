import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { EquipmentGrid } from "@/components/game/stats/EquipmentGrid";
import { InventoryDisplay } from "@/components/game/InventoryDisplay";
import { DragonEggProvider } from "@/contexts/DragonEggContext";
import { useEffect, useState } from "react";
import { useNFTCardIntegration } from "@/hooks/useNFTCardIntegration";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { NFTCardGrid } from "@/components/game/cards/NFTCardGrid";
import { useInventoryState } from "@/hooks/useInventoryState";
import { Item } from "@/types/inventory";
import { canEquipItem, getEquipmentSlot } from "@/utils/itemUtils";
import { useToast } from "@/hooks/use-toast";
export const Equipment = () => {
  const navigate = useNavigate();
  const {
    nftCards,
    isLoading
  } = useNFTCardIntegration();
  const {
    inventory,
    updateInventory
  } = useInventoryState();
  const {
    toast
  } = useToast();
  const handleUseItem = (item: Item) => {
    if (!canEquipItem(item)) {
      toast({
        title: "Ошибка",
        description: "Этот предмет нельзя экипировать",
        variant: "destructive"
      });
      return;
    }
    const slot = getEquipmentSlot(item);
    if (!slot) {
      toast({
        title: "Ошибка",
        description: "Неверный слот для предмета",
        variant: "destructive"
      });
      return;
    }

    // Если предмет уже экипирован, снимаем его
    if (item.equipped) {
      const updatedInventory = inventory.map(invItem => invItem.id === item.id ? {
        ...invItem,
        equipped: false
      } : invItem);
      updateInventory(updatedInventory);
      toast({
        title: "Готово",
        description: `${item.name} снят`
      });
      return;
    }

    // Снимаем предмет с того же слота, если он есть
    const equippedInSlot = inventory.find(invItem => invItem.equipped && invItem.slot === slot && invItem.id !== item.id);
    const updatedInventory = inventory.map(invItem => {
      if (invItem.id === item.id) {
        return {
          ...invItem,
          equipped: true,
          slot
        };
      }
      if (equippedInSlot && invItem.id === equippedInSlot.id) {
        return {
          ...invItem,
          equipped: false
        };
      }
      return invItem;
    });
    updateInventory(updatedInventory);
    toast({
      title: "Готово",
      description: `${item.name} экипирован`
    });
  };
  useEffect(() => {
    const handleEquipmentChange = () => {
      try {
        const currentInventory = localStorage.getItem('gameInventory');
        const parsedInventory = currentInventory ? JSON.parse(currentInventory) : [];
        const event = new CustomEvent('inventoryUpdate', {
          detail: {
            inventory: parsedInventory
          }
        });
        window.dispatchEvent(event);
      } catch (error) {
        console.error('Error handling equipment change:', error);
      }
    };
    window.addEventListener('equipmentChange', handleEquipmentChange);
    return () => window.removeEventListener('equipmentChange', handleEquipmentChange);
  }, []);
  return <div className="min-h-screen p-4 bg-cover bg-center bg-no-repeat" style={{
    backgroundImage: 'url("/lovable-uploads/29ea34c8-ede8-4cab-8ca2-049cdb5108c3.png")',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    backgroundBlendMode: 'multiply'
  }}>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" className="bg-game-surface/80 border-game-accent text-game-accent hover:bg-game-surface" onClick={() => navigate('/menu')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Вернуться в меню
        </Button>
        <Button variant="outline" className="bg-game-accent/20 border-game-accent text-game-accent hover:bg-game-accent/30" onClick={() => {
        // TODO: Implement NFT minting functionality
        console.log('Mint functionality will be implemented here');
      }}>
          Mint NFT
        </Button>
        <h1 className="text-2xl font-bold text-game-accent">Снаряжение</h1>
      </div>
      
      <DragonEggProvider>
        <Tabs defaultValue="equipment" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-game-surface border-game-accent">
            
            <TabsTrigger value="nft" className="text-game-accent data-[state=active]:bg-game-accent data-[state=active]:text-game-surface">
              NFT коллекция
            </TabsTrigger>
          </TabsList>

          <TabsContent value="equipment" className="space-y-6 mt-6">
            

            <div>
              <h3 className="text-xl font-bold text-game-accent mb-4">Обычные предметы (не заминченные)</h3>
              <InventoryDisplay onUseItem={handleUseItem} readonly={false} />
            </div>
          </TabsContent>

          <TabsContent value="nft" className="space-y-6 mt-6">
            <Card className="p-6 bg-game-surface border-game-accent">
              <h2 className="text-xl font-bold text-game-accent mb-4">NFT-коллекция из кошелька</h2>
              {isLoading ? <div className="text-center text-game-accent">Загрузка NFT...</div> : nftCards.length > 0 ? <NFTCardGrid cards={nftCards} /> : <div className="text-center text-game-accent/70">
                  NFT карты не найдены в подключенном кошельке
                </div>}
            </Card>
          </TabsContent>
        </Tabs>
      </DragonEggProvider>
    </div>;
};