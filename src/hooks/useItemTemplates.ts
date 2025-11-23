import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo } from "react";

export interface ItemTemplate {
  id: number;
  item_id: string;
  name: string;
  type: string;
  rarity: string;
  description?: string;
  value?: number;
  image_url?: string;
  sell_price?: number;
}

export const useItemTemplates = () => {
  const { data: templates, isLoading: loading } = useQuery({
    queryKey: ['itemTemplates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('item_templates')
        .select('id, item_id, name, type, rarity, description, value, image_url, sell_price');

      if (error) throw error;

      const itemIdMap = new Map<string, ItemTemplate>();
      const numericIdMap = new Map<string, ItemTemplate>();
      const nameMap = new Map<string, ItemTemplate>();

      data?.forEach((template) => {
        const t = template as unknown as ItemTemplate;
        if (t.item_id) itemIdMap.set(String(t.item_id), t);
        if (typeof t.id !== 'undefined') numericIdMap.set(String(t.id), t);
        if (t.name) nameMap.set(t.name, t);
      });

      return { itemIdMap, numericIdMap, nameMap };
    },
    staleTime: Infinity, // Шаблоны предметов редко меняются, кешируем навсегда до перезагрузки страницы
    gcTime: 1000 * 60 * 60, // 1 час в памяти
    refetchOnMount: false, // Не перезапрашивать при монтировании
    refetchOnWindowFocus: false, // Не перезапрашивать при фокусе окна
  });

  const byItemId = useMemo(() => templates?.itemIdMap || new Map<string, ItemTemplate>(), [templates]);
  const byNumericId = useMemo(() => templates?.numericIdMap || new Map<string, ItemTemplate>(), [templates]);
  const byName = useMemo(() => templates?.nameMap || new Map<string, ItemTemplate>(), [templates]);

  const getTemplate = (idOrItemId: string): ItemTemplate | undefined => {
    const key = String(idOrItemId);
    return byItemId.get(key) || byNumericId.get(key) || byItemId.get(key.toLowerCase());
  };

  const getTemplateByName = (name: string): ItemTemplate | undefined => {
    return byName.get(name);
  };

  const getItemName = (idOrItemId: string): string => {
    const t = getTemplate(idOrItemId);
    return t?.name || String(idOrItemId);
  };

  return { templates: byItemId, loading, getItemName, getTemplate, getTemplateByName };
};
