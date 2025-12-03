import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Clock, Package, CheckCircle } from "lucide-react";
import { useItemTemplates } from "@/hooks/useItemTemplates";
import { formatTime } from "@/utils/timeUtils";
import { useLanguage } from "@/hooks/useLanguage";
import { t } from "@/utils/translations";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWalletContext } from "@/contexts/WalletConnectContext";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface ActiveCraft {
  id: string;
  building: string;
  startTime: number;
  duration: number;
  task: string;
  resultItemId: number;
  resultQuantity: number;
}

interface ActiveCraftsProps {
  activeWorkers: any[];
}

export const ActiveCrafts = ({ activeWorkers }: ActiveCraftsProps) => {
  const { language } = useLanguage();
  const { getItemName, getTemplate } = useItemTemplates();
  const { accountId } = useWalletContext();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [collectingId, setCollectingId] = useState<string | null>(null);

  // Обновление времени каждую секунду
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Фильтруем только крафты
  const activeCrafts = activeWorkers.filter(
    (worker) => worker.task === 'crafting' && worker.building === 'workshop'
  ) as ActiveCraft[];

  // Функция для сбора готового крафта
  const handleCollect = async (craft: ActiveCraft) => {
    if (!accountId) return;
    
    setCollectingId(craft.id);
    
    try {
      console.log('📦 [ActiveCrafts] Collecting craft:', craft.id);
      
      const { data, error } = await supabase.rpc('complete_crafting_task', {
        p_wallet_address: accountId,
        p_craft_id: craft.id
      });

      if (error) {
        console.error('❌ [ActiveCrafts] Error collecting craft:', error);
        toast({
          title: 'Ошибка',
          description: error.message || 'Не удалось забрать предмет',
          variant: 'destructive'
        });
        return;
      }

      const result = data as { success: boolean; item_name?: string; quantity?: number; error?: string };

      if (!result.success) {
        toast({
          title: 'Ошибка',
          description: result.error || 'Не удалось забрать предмет',
          variant: 'destructive'
        });
        return;
      }

      console.log('✅ [ActiveCrafts] Craft collected:', result);

      // Инвалидируем кэш для обновления UI
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['itemInstances', accountId] }),
        queryClient.invalidateQueries({ queryKey: ['item_instances'] }),
        queryClient.invalidateQueries({ queryKey: ['gameData', accountId] }),
        queryClient.invalidateQueries({ queryKey: ['gameDataByWallet'] }),
        queryClient.invalidateQueries({ queryKey: ['unifiedGameData'] })
      ]);

      toast({
        title: 'Предмет получен!',
        description: `${result.item_name} x${result.quantity} добавлен в инвентарь`
      });

    } catch (error) {
      console.error('❌ [ActiveCrafts] Error:', error);
      toast({
        title: 'Ошибка',
        description: 'Произошла ошибка при получении предмета',
        variant: 'destructive'
      });
    } finally {
      setCollectingId(null);
    }
  };

  if (activeCrafts.length === 0) {
    return (
      <Card variant="menu" style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-white">
            <Package className="w-5 h-5" />
            {t(language, 'shelter.activeCrafts')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-white/70 text-center py-4">
            Нет активных крафтов
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="menu" style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2 text-white">
          <Package className="w-5 h-5" />
          {t(language, 'shelter.activeCrafts')} ({activeCrafts.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeCrafts.map((craft) => {
          const elapsed = currentTime - craft.startTime;
          const progress = Math.min(100, (elapsed / craft.duration) * 100);
          const remaining = Math.max(0, craft.duration - elapsed);
          const isComplete = progress >= 100;
          const template = getTemplate(String(craft.resultItemId));
          const isCollecting = collectingId === craft.id;

          return (
            <div
              key={craft.id}
              className="p-3 rounded-lg bg-black/40 border border-white/20 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📦</span>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {getItemName(String(craft.resultItemId))}
                    </p>
                    <p className="text-xs text-white/60">
                      Количество: {craft.resultQuantity}
                    </p>
                  </div>
                </div>
              </div>

              <Progress value={progress} className="h-2" />

              <div className="flex items-center justify-between text-xs text-white/70">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {isComplete ? (
                    <span className="text-green-400 font-semibold">Готово!</span>
                  ) : (
                    <span>{formatTime(remaining)}</span>
                  )}
                </div>
                <span>{Math.round(progress)}%</span>
              </div>

              {/* Кнопка "Забрать" для готовых крафтов */}
              {isComplete && (
                <Button
                  variant="default"
                  size="sm"
                  className="w-full mt-2 bg-green-600 hover:bg-green-700"
                  onClick={() => handleCollect(craft)}
                  disabled={isCollecting}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {isCollecting ? 'Забираем...' : 'Забрать'}
                </Button>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
