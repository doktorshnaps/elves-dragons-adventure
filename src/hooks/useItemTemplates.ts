import { useMemo } from "react";
import { useStaticGameDataContext } from '@/contexts/StaticGameDataContext';

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
  const { data: staticData, isLoading: loading } = useStaticGameDataContext();

  const templates = useMemo(() => {
    if (!staticData?.item_templates) {
      return { itemIdMap: new Map<string, ItemTemplate>(), numericIdMap: new Map<string, ItemTemplate>(), nameMap: new Map<string, ItemTemplate>() };
    }

    const itemIdMap = new Map<string, ItemTemplate>();
    const numericIdMap = new Map<string, ItemTemplate>();
    const nameMap = new Map<string, ItemTemplate>();

    staticData.item_templates.forEach((template: any) => {
      const t = template as ItemTemplate;
      if (t.item_id) itemIdMap.set(String(t.item_id), t);
      if (typeof t.id !== 'undefined') numericIdMap.set(String(t.id), t);
      if (t.name) nameMap.set(t.name, t);
    });

    return { itemIdMap, numericIdMap, nameMap };
  }, [staticData?.item_templates]);

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
