import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useWalletContext } from "@/contexts/WalletConnectContext";

export const RecalculateAllCardsButton = () => {
  const [isRecalculating, setIsRecalculating] = useState(false);
  const { toast } = useToast();
  const { accountId } = useWalletContext();

  const handleRecalculate = async () => {
    if (!accountId) {
      toast({
        title: "Ошибка",
        description: "Подключите кошелек",
        variant: "destructive",
      });
      return;
    }

    setIsRecalculating(true);
    try {
      console.log('🔄 Starting ALL cards stats recalculation...');
      
      // Вызываем edge function для пересчета всех карт
      const { data, error } = await supabase.functions.invoke('admin-recalculate-card-stats', {
        body: { wallet_address: accountId }
      });

      if (error) throw error;

      console.log('✅ Recalculation complete:', data);

      toast({
        title: "✅ Пересчет завершен",
        description: `Все характеристики карт успешно пересчитаны`,
      });

      // Перезагружаем данные
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Error recalculating card stats:', error);
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось пересчитать характеристики",
        variant: "destructive",
      });
    } finally {
      setIsRecalculating(false);
    }
  };

  return (
    <Button
      onClick={handleRecalculate}
      disabled={isRecalculating}
      variant="default"
      className="gap-2"
    >
      <RefreshCw className={`h-4 w-4 ${isRecalculating ? 'animate-spin' : ''}`} />
      {isRecalculating ? 'Пересчет всех карт...' : 'Пересчитать характеристики ВСЕХ карт'}
    </Button>
  );
};
