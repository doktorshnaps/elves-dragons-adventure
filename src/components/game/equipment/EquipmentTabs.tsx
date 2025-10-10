import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { InventoryDisplay } from "@/components/game/InventoryDisplay";
import { NFTCardGrid } from "@/components/game/cards/NFTCardGrid";
import { Item } from "@/types/inventory";
import { Card as NFTCard } from "@/types/cards";

interface EquipmentTabsProps {
  onUseItem: (item: Item) => void;
  nftCards: NFTCard[];
  isLoadingNFT: boolean;
}

export const EquipmentTabs = ({ onUseItem, nftCards, isLoadingNFT }: EquipmentTabsProps) => {
  return (
    <Tabs defaultValue="equipment" className="w-full">
      <TabsList className="grid w-full grid-cols-2 bg-black/40 border-2 border-white/50 backdrop-blur-sm rounded-3xl">
        <TabsTrigger 
          value="equipment" 
          className="text-white data-[state=active]:bg-white/20 data-[state=active]:text-white rounded-3xl"
        >
          Инвентарь
        </TabsTrigger>
        <TabsTrigger 
          value="nft" 
          className="text-white data-[state=active]:bg-white/20 data-[state=active]:text-white rounded-3xl"
        >
          NFT коллекция
        </TabsTrigger>
      </TabsList>

      <TabsContent value="equipment" className="space-y-6 mt-6">
        <div>
          <h3 className="text-xl font-bold text-white mb-4">
            Обычные предметы (не заминченные)
          </h3>
          <InventoryDisplay onUseItem={onUseItem} readonly={false} />
        </div>
      </TabsContent>

      <TabsContent value="nft" className="space-y-6 mt-6">
      <Card className="p-6 bg-black/50 border-2 border-white rounded-3xl backdrop-blur-sm" style={{ boxShadow: '0 15px 10px rgba(0, 0, 0, 0.6)' }}>
        <h2 className="text-xl font-bold text-white mb-4">
          NFT-коллекция из кошелька
        </h2>
        {isLoadingNFT ? (
          <div className="text-center text-white">Загрузка NFT...</div>
        ) : nftCards.length > 0 ? (
          <NFTCardGrid cards={nftCards} />
        ) : (
          <div className="text-center text-white/70">
            NFT карты не найдены в подключенном кошельке
          </div>
        )}
      </Card>
      </TabsContent>
    </Tabs>
  );
};
