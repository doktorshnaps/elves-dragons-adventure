import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2, Database, CheckCircle2 } from "lucide-react";
import { useWalletContext } from "@/contexts/WalletConnectContext";

export const InventorySyncManager = () => {
  const { toast } = useToast();
  const { accountId } = useWalletContext();
  const [targetWallet, setTargetWallet] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    gameDataInventoryCount: number;
    itemInstancesCount: number;
    removedCount: number;
    addedCount: number;
  } | null>(null);

  const handleSync = async () => {
    if (!targetWallet.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите адрес кошелька",
        variant: "destructive",
      });
      return;
    }

    setIsSyncing(true);
    setSyncResult(null);

    try {
      console.log('🔄 Starting inventory sync for wallet:', targetWallet);

      // 1. Get game_data inventory
      const { data: gameData, error: gameDataError } = await supabase
        .from('game_data')
        .select('inventory')
        .eq('wallet_address', targetWallet)
        .single();

      if (gameDataError) throw gameDataError;

      const inventoryJson = (gameData?.inventory || []) as any[];
      console.log('📦 Game data inventory count:', inventoryJson.length);

      // 2. Get item_instances via RPC
      const { data: instances, error: instancesError } = await supabase
        .rpc('get_item_instances_by_wallet', { p_wallet_address: targetWallet });

      if (instancesError) throw instancesError;

      const itemInstances = (instances || []) as any[];
      console.log('💾 Item instances count:', itemInstances.length);

      // 3. Build a map of inventory items by item_id
      const { data: templates } = await supabase
        .from('item_templates')
        .select('*');

      const templateMap = new Map<string, any>();
      (templates || []).forEach(tpl => {
        templateMap.set(tpl.name, tpl);
        templateMap.set(tpl.item_id, tpl);
      });

      // Count inventory items by item_id
      const inventoryByItemId = new Map<string, number>();
      for (const item of inventoryJson) {
        const tpl = templateMap.get(item.name);
        const key = tpl?.item_id || item.name;
        inventoryByItemId.set(key, (inventoryByItemId.get(key) || 0) + 1);
      }

      console.log('📊 Inventory counts by item_id:', Object.fromEntries(inventoryByItemId));

      // Count instances by item_id
      const instancesByItemId = new Map<string, string[]>();
      for (const inst of itemInstances) {
        const key = inst.item_id || inst.name || 'unknown';
        if (!instancesByItemId.has(key)) {
          instancesByItemId.set(key, []);
        }
        instancesByItemId.get(key)!.push(inst.id);
      }

      console.log('💾 Instance counts by item_id:', 
        Object.fromEntries(Array.from(instancesByItemId.entries()).map(([k, v]) => [k, v.length]))
      );

      // 4. Determine which instances to remove (excess instances)
      const idsToRemove: string[] = [];
      for (const [itemId, instanceIds] of instancesByItemId.entries()) {
        const shouldHave = inventoryByItemId.get(itemId) || 0;
        const actuallyHave = instanceIds.length;
        
        if (actuallyHave > shouldHave) {
          const excess = actuallyHave - shouldHave;
          console.log(`⚠️ Excess instances for ${itemId}: have ${actuallyHave}, should have ${shouldHave}, removing ${excess}`);
          // Remove excess instances
          idsToRemove.push(...instanceIds.slice(0, excess));
        }
      }

      // 5. Determine which instances to add (missing instances)
      const itemsToAdd: any[] = [];
      for (const [itemId, count] of inventoryByItemId.entries()) {
        const instanceIds = instancesByItemId.get(itemId) || [];
        if (instanceIds.length < count) {
          const missing = count - instanceIds.length;
          console.log(`➕ Missing instances for ${itemId}: have ${instanceIds.length}, should have ${count}, adding ${missing}`);
          
          const tpl = templateMap.get(itemId);
          for (let i = 0; i < missing; i++) {
            itemsToAdd.push({
              item_id: itemId,
              template_id: tpl?.id,
              name: tpl?.name,
              type: tpl?.type || 'material'
            });
          }
        }
      }

      let removedCount = 0;
      let addedCount = 0;

      // 6. Remove excess instances
      if (idsToRemove.length > 0) {
        console.log('🗑️ Removing', idsToRemove.length, 'excess instances:', idsToRemove);
        const { data: removed, error: removeError } = await supabase.rpc('remove_item_instances', {
          p_wallet_address: targetWallet,
          p_instance_ids: idsToRemove
        });

        if (removeError) throw removeError;
        removedCount = removed || 0;
        console.log('✅ Removed', removedCount, 'instances');
      }

      // 7. Add missing instances
      if (itemsToAdd.length > 0) {
        console.log('➕ Adding', itemsToAdd.length, 'missing instances');
        const { data: added, error: addError } = await supabase.rpc('add_item_instances', {
          p_wallet_address: targetWallet,
          p_items: itemsToAdd
        });

        if (addError) throw addError;
        addedCount = added || 0;
        console.log('✅ Added', addedCount, 'instances');
      }

      setSyncResult({
        gameDataInventoryCount: inventoryJson.length,
        itemInstancesCount: itemInstances.length,
        removedCount,
        addedCount
      });

      toast({
        title: "Синхронизация завершена",
        description: `Удалено: ${removedCount}, Добавлено: ${addedCount}`,
      });

    } catch (error: any) {
      console.error('❌ Sync error:', error);
      toast({
        title: "Ошибка синхронизации",
        description: error.message || "Не удалось синхронизировать инвентарь",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncCurrentUser = () => {
    if (accountId) {
      setTargetWallet(accountId);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Синхронизация инвентаря
        </CardTitle>
        <CardDescription>
          Синхронизация JSON инвентаря (game_data) с таблицей item_instances
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Адрес кошелька"
            value={targetWallet}
            onChange={(e) => setTargetWallet(e.target.value)}
          />
          <Button
            variant="outline"
            onClick={handleSyncCurrentUser}
            disabled={!accountId}
          >
            Мой кошелек
          </Button>
        </div>

        <Button
          onClick={handleSync}
          disabled={isSyncing || !targetWallet.trim()}
          className="w-full"
        >
          {isSyncing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Синхронизация...
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Синхронизировать
            </>
          )}
        </Button>

        {syncResult && (
          <Card className="bg-secondary/20">
            <CardContent className="pt-4 space-y-2">
              <div className="text-sm">
                <strong>Результаты синхронизации:</strong>
              </div>
              <div className="text-sm space-y-1">
                <div>📦 Предметов в JSON инвентаре: {syncResult.gameDataInventoryCount}</div>
                <div>💾 Было записей в item_instances: {syncResult.itemInstancesCount}</div>
                <div className="text-destructive">
                  <Trash2 className="inline h-3 w-3 mr-1" />
                  Удалено лишних записей: {syncResult.removedCount}
                </div>
                <div className="text-primary">
                  ➕ Добавлено недостающих записей: {syncResult.addedCount}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p>⚠️ Эта операция:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Сравнит JSON инвентарь игрока с записями в item_instances</li>
            <li>Удалит лишние записи из item_instances</li>
            <li>Добавит недостающие записи в item_instances</li>
            <li>Использует item_id для сопоставления предметов</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
