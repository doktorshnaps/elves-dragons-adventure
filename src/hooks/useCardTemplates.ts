import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CardTemplate {
  id: string;
  card_name: string;
  card_type: 'hero' | 'dragon';
  rarity: number;
  faction: string | null;
  power: number;
  defense: number;
  health: number;
  magic: number;
}

/**
 * Hook for managing card templates with pre-calculated stats
 */
export const useCardTemplates = () => {
  const { toast } = useToast();

  // Fetch all card templates
  const { data: templates, isLoading } = useQuery({
    queryKey: ['cardTemplates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('card_templates')
        .select('*')
        .order('card_name');

      if (error) throw error;
      return data as CardTemplate[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000 // 10 minutes
  });

  // Populate templates from existing multipliers
  const populateTemplates = async () => {
    try {
      const { data, error } = await supabase.rpc('populate_card_templates');

      if (error) {
        console.error('Error populating templates:', error);
        toast({
          title: 'Ошибка',
          description: 'Не удалось заполнить шаблоны карт',
          variant: 'destructive'
        });
        return null;
      }

      toast({
        title: 'Успешно',
        description: `Создано/обновлено ${data} шаблонов карт`
      });

      return data;
    } catch (err) {
      console.error('Failed to populate templates:', err);
      toast({
        title: 'Ошибка',
        description: 'Произошла ошибка при заполнении шаблонов',
        variant: 'destructive'
      });
      return null;
    }
  };

  // Recalculate all card instances from templates
  const recalculateAllInstances = async () => {
    try {
      const { data, error } = await supabase.rpc('recalculate_all_card_instances_from_templates');

      if (error) {
        console.error('Error recalculating instances:', error);
        toast({
          title: 'Ошибка',
          description: 'Не удалось пересчитать характеристики карт',
          variant: 'destructive'
        });
        return null;
      }

      toast({
        title: 'Успешно',
        description: `Пересчитано ${data} карт`
      });

      return data;
    } catch (err) {
      console.error('Failed to recalculate instances:', err);
      toast({
        title: 'Ошибка',
        description: 'Произошла ошибка при пересчете карт',
        variant: 'destructive'
      });
      return null;
    }
  };

  // Get template for specific card
  const getTemplate = (cardName: string, cardType: 'hero' | 'dragon', rarity: number) => {
    return templates?.find(
      t => t.card_name === cardName && t.card_type === cardType && t.rarity === rarity
    );
  };

  return {
    templates,
    isLoading,
    populateTemplates,
    recalculateAllInstances,
    getTemplate
  };
};
