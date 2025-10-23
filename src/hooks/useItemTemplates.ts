import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ItemTemplate {
  id: number;
  item_id: string;
  name: string;
  type: string;
  rarity: string;
  description?: string;
  value?: number;
  image_url?: string;
}

export const useItemTemplates = () => {
  const [byItemId, setByItemId] = useState<Map<string, ItemTemplate>>(new Map());
  const [byNumericId, setByNumericId] = useState<Map<string, ItemTemplate>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const { data, error } = await supabase
          .from('item_templates')
          .select('id, item_id, name, type, rarity, description, value, image_url');

        if (error) throw error;

        const itemIdMap = new Map<string, ItemTemplate>();
        const numericIdMap = new Map<string, ItemTemplate>();

        data?.forEach((template) => {
          const t = template as unknown as ItemTemplate;
          if (t.item_id) itemIdMap.set(String(t.item_id), t);
          if (typeof t.id !== 'undefined') numericIdMap.set(String(t.id), t);
        });

        setByItemId(itemIdMap);
        setByNumericId(numericIdMap);
      } catch (error) {
        console.error('Error loading item templates:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTemplates();
  }, []);

  const getTemplate = (idOrItemId: string): ItemTemplate | undefined => {
    const key = String(idOrItemId);
    return byItemId.get(key) || byNumericId.get(key) || byItemId.get(key.toLowerCase());
  };

  const getItemName = (idOrItemId: string): string => {
    const t = getTemplate(idOrItemId);
    return t?.name || String(idOrItemId);
  };

  // Keep a merged map for compatibility (by item_id keys)
  const templates = byItemId;

  return { templates, loading, getItemName, getTemplate };
};
