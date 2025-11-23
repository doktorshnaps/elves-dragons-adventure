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
  const contextData = useStaticGameDataContext();
  const staticData = contextData?.data;
  const loading = contextData?.isLoading ?? true;

  console.log('📚 [useItemTemplates] Context data:', {
    hasContext: !!contextData,
    isLoading: contextData?.isLoading,
    isError: contextData?.isError,
    hasData: !!contextData?.data,
    hasStaticData: !!staticData,
    hasItemTemplates: !!staticData?.item_templates,
    itemTemplatesCount: staticData?.item_templates?.length,
    firstTemplate: staticData?.item_templates?.[0]
  });

  const templates = useMemo(() => {
    if (!staticData?.item_templates) {
      console.warn('⚠️ [useItemTemplates] No item_templates in static data');
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

    console.log('✅ [useItemTemplates] Templates loaded:', {
      itemIdMapSize: itemIdMap.size,
      numericIdMapSize: numericIdMap.size,
      nameMapSize: nameMap.size,
      sampleTemplate: itemIdMap.get('spider_silk')
    });

    return { itemIdMap, numericIdMap, nameMap };
  }, [staticData?.item_templates]);

  const byItemId = useMemo(() => templates?.itemIdMap || new Map<string, ItemTemplate>(), [templates]);
  const byNumericId = useMemo(() => templates?.numericIdMap || new Map<string, ItemTemplate>(), [templates]);
  const byName = useMemo(() => templates?.nameMap || new Map<string, ItemTemplate>(), [templates]);

  const getTemplate = (idOrItemId: string): ItemTemplate | undefined => {
    const key = String(idOrItemId);
    const result = byItemId.get(key) || byNumericId.get(key) || byItemId.get(key.toLowerCase());
    
    console.log('🔍 [getTemplate] Looking for:', {
      idOrItemId,
      key,
      foundInItemId: !!byItemId.get(key),
      foundInNumericId: !!byNumericId.get(key),
      result: result ? { id: result.id, name: result.name, image_url: result.image_url } : null
    });
    
    return result;
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
