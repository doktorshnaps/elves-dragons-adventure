import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { shopItems } from '@/data/shopItems';
import { ShopItem } from '@/components/shop/types';

/**
 * Hook to enrich shop items with images from database (item_templates)
 * This is especially important for workers and materials
 */
export const useEnrichedShopItems = () => {
  const [enrichedItems, setEnrichedItems] = useState<ShopItem[]>(shopItems);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const enrichShopItems = async () => {
      try {
        // Fetch all item templates from database
        const { data: templates, error } = await supabase
          .from('item_templates')
          .select('id, name, image_url, type');

        if (error) {
          console.error('Error fetching item templates:', error);
          setEnrichedItems(shopItems);
          return;
        }

        // Create a map for quick lookup by name and type
        const templateMap = new Map<string, string>();
        templates?.forEach(template => {
          const key = `${template.name}-${template.type}`;
          if (template.image_url) {
            templateMap.set(key, template.image_url);
          }
        });

        // Enrich shop items with database images
        const enriched = shopItems.map(item => {
          const key = `${item.name}-${item.type}`;
          const imageUrl = templateMap.get(key);
          
          if (imageUrl) {
            return {
              ...item,
              image: imageUrl, // Override with database image_url
            };
          }
          
          return item;
        });

        setEnrichedItems(enriched);
      } catch (error) {
        console.error('Error enriching shop items:', error);
        setEnrichedItems(shopItems);
      } finally {
        setLoading(false);
      }
    };

    enrichShopItems();
  }, []);

  return { items: enrichedItems, loading };
};
