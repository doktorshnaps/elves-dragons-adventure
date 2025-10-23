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
  const [templates, setTemplates] = useState<Map<string, ItemTemplate>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const { data, error } = await supabase
          .from('item_templates')
          .select('*');

        if (error) throw error;

        const templatesMap = new Map<string, ItemTemplate>();
        data?.forEach((template) => {
          templatesMap.set(template.item_id, template as ItemTemplate);
        });

        setTemplates(templatesMap);
      } catch (error) {
        console.error('Error loading item templates:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTemplates();
  }, []);

  const getItemName = (itemId: string): string => {
    return templates.get(itemId)?.name || itemId;
  };

  return { templates, loading, getItemName };
};
