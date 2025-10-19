import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InventoryDisplay } from "@/components/game/InventoryDisplay";
import { Item } from "@/types/inventory";
import { useCardInstances } from "@/hooks/useCardInstances";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface EquipmentTabsProps {
  onUseItem: (item: Item) => void;
}

export const EquipmentTabs = ({ onUseItem }: EquipmentTabsProps) => {
  const { cardInstances, loading } = useCardInstances();
  
  const workers = cardInstances.filter(instance => 
    instance.card_type === 'workers' || (instance.card_data as any)?.type === 'worker'
  );

  return (
    <div className="w-full">
      <Tabs defaultValue="inventory" className="w-full">
        <TabsList className="w-full grid grid-cols-2 bg-black/30">
          <TabsTrigger value="inventory" className="data-[state=active]:bg-white/20">
            Инвентарь
          </TabsTrigger>
          <TabsTrigger value="workers" className="data-[state=active]:bg-white/20">
            Рабочие ({workers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="mt-4">
          <div>
            <h3 className="text-xl font-bold text-white mb-4">
              Инвентарь
            </h3>
            <p className="text-sm text-white/70 mb-4">
              Обычные предметы (не заминченные)
            </p>
            <InventoryDisplay onUseItem={onUseItem} readonly={false} />
          </div>
        </TabsContent>

        <TabsContent value="workers" className="mt-4">
          <div className="max-h-[calc(100vh-16rem)] overflow-y-auto pr-2">
            <h3 className="text-xl font-bold text-white mb-4">
              Доступные рабочие
            </h3>
            <p className="text-sm text-white/70 mb-4">
              Рабочие из card_instances
            </p>
            
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
              </div>
            ) : workers.length === 0 ? (
              <div className="text-center py-12 text-white/70">
                Нет доступных рабочих
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-4">
                {workers.map((worker) => {
                  const data = worker.card_data as any;
                  return (
                    <Card key={worker.id} className="bg-black/50 border-white/20 overflow-hidden">
                      <CardHeader className="p-3">
                        <CardTitle className="text-sm text-white truncate">
                          {data?.name || 'Рабочий'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-3 pt-0">
                        {data?.image && (
                          <img 
                            src={data.image} 
                            alt={data.name || 'Worker'} 
                            className="w-full h-32 object-contain mb-2 rounded"
                          />
                        )}
                        <div className="text-xs text-white/70 space-y-1">
                          <div className="flex justify-between">
                            <span>Редкость:</span>
                            <span className="text-white capitalize">{data?.rarity || 'common'}</span>
                          </div>
                          {data?.stats?.speedBoost && (
                            <div className="flex justify-between">
                              <span>Ускорение:</span>
                              <span className="text-green-400">+{data.stats.speedBoost}%</span>
                            </div>
                          )}
                          {data?.stats?.workDuration && (
                            <div className="flex justify-between">
                              <span>Длительность:</span>
                              <span className="text-blue-400">
                                {Math.floor(data.stats.workDuration / 3600000)}ч
                              </span>
                            </div>
                          )}
                          <div className="text-xs text-white/50 mt-2">
                            ID: {worker.id.slice(0, 8)}...
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
