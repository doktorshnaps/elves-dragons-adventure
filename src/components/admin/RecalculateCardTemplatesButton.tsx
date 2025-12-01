import { Button } from "@/components/ui/button";
import { Database, RefreshCw } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const RecalculateCardTemplatesButton = () => {
  const [isRecalculating, setIsRecalculating] = useState(false);
  const { toast } = useToast();

  const handleRecalculate = async () => {
    setIsRecalculating(true);
    try {
      console.log('🔄 Starting card_templates recalculation...');
      
      const { data, error } = await supabase.rpc('recalculate_card_templates');

      if (error) throw error;

      console.log('✅ Recalculation complete. Updated templates:', data);

      toast({
        title: "✅ Пересчет завершен",
        description: `Обновлено шаблонов карт: ${data || 0}`,
      });
    } catch (error) {
      console.error('Error recalculating card templates:', error);
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось пересчитать шаблоны",
        variant: "destructive",
      });
    } finally {
      setIsRecalculating(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleRecalculate}
      disabled={isRecalculating}
      className="gap-2"
    >
      {isRecalculating ? (
        <RefreshCw className="h-4 w-4 animate-spin" />
      ) : (
        <Database className="h-4 w-4" />
      )}
      {isRecalculating ? 'Пересчет...' : 'Пересчитать card_templates'}
    </Button>
  );
};
