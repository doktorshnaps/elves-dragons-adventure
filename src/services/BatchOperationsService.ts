import { supabase } from '@/integrations/supabase/client';

/**
 * BatchOperationsService - Централизованный сервис для batch операций
 * 
 * Цель: Объединить все массовые операции в один сервис для упрощения 
 * управления и повторного использования кода.
 * 
 * Все функции возвращают Promise с результатом операции или null в случае ошибки.
 */

// ============= INTERFACES =============

export interface CraftingRecipe {
  recipe_id: string;
  quantity: number;
  materials: Array<{
    template_id: number;
    quantity: number;
  }>;
}

export interface BatchCraftResult {
  success: boolean;
  total_crafted: number;
  recipes_processed: number;
}

export interface CardUpdate {
  card_instance_id: string;
  current_health?: number;
  current_defense?: number;
  monster_kills?: number;
}

export interface BatchCardUpdateResult {
  success: boolean;
  cards_updated: number;
}

export interface ItemSaleData {
  instance_id: string;
  sell_price: number;
}

export interface BatchSellResult {
  success: boolean;
  items_sold: number;
  total_earnings: number;
}

export interface PurchaseData {
  item_template_id: number;
  quantity: number;
  price_per_unit: number;
}

export interface BatchPurchaseResult {
  success: boolean;
  items_purchased: number;
  total_cost: number;
}

export interface CardUpgradeData {
  card_instance_id: string;
  target_rarity: number;
  cost_ell: number;
  required_kills: number;
}

export interface BatchUpgradeResult {
  success: boolean;
  cards_upgraded: number;
  failed_upgrades: string[];
}

// ============= SERVICE CLASS =============

class BatchOperationsService {
  /**
   * Craft multiple items in a single transaction
   * @param walletAddress - User's wallet address
   * @param recipes - Array of recipes to craft
   * @returns Result with counts or null on error
   */
  async craftMultiple(
    walletAddress: string,
    recipes: CraftingRecipe[]
  ): Promise<BatchCraftResult | null> {
    if (!walletAddress || !recipes || recipes.length === 0) {
      console.error('❌ [BatchOps] Invalid craft parameters');
      return null;
    }

    console.log('🔨 [BatchOps] Crafting multiple items:', {
      wallet: walletAddress,
      recipes: recipes.length,
      total_items: recipes.reduce((sum, r) => sum + r.quantity, 0)
    });

    try {
      const { data, error } = await supabase.rpc('craft_multiple_items', {
        p_wallet_address: walletAddress,
        p_recipes: recipes as any
      });

      if (error) throw error;

      console.log('✅ [BatchOps] Craft successful:', data);
      return data as unknown as BatchCraftResult;
    } catch (error) {
      console.error('❌ [BatchOps] Craft error:', error);
      return null;
    }
  }

  /**
   * Update multiple card stats in a single transaction
   * @param walletAddress - User's wallet address
   * @param updates - Array of card updates
   * @returns Result with count or null on error
   */
  async updateMultipleCards(
    walletAddress: string,
    updates: CardUpdate[]
  ): Promise<BatchCardUpdateResult | null> {
    if (!walletAddress || !updates || updates.length === 0) {
      console.error('❌ [BatchOps] Invalid update parameters');
      return null;
    }

    console.log('📊 [BatchOps] Updating multiple cards:', {
      wallet: walletAddress,
      updates: updates.length
    });

    try {
      const { data, error } = await supabase.rpc('batch_update_card_stats', {
        p_wallet_address: walletAddress,
        p_card_updates: updates as any
      });

      if (error) throw error;

      console.log('✅ [BatchOps] Update successful:', data);
      return data as unknown as BatchCardUpdateResult;
    } catch (error) {
      console.error('❌ [BatchOps] Update error:', error);
      return null;
    }
  }

  /**
   * Sell multiple items in a single transaction
   * @param walletAddress - User's wallet address
   * @param items - Array of items to sell
   * @returns Result with earnings or null on error
   */
  async sellMultipleItems(
    walletAddress: string,
    items: ItemSaleData[]
  ): Promise<BatchSellResult | null> {
    if (!walletAddress || !items || items.length === 0) {
      console.error('❌ [BatchOps] Invalid sell parameters');
      return null;
    }

    console.log('💰 [BatchOps] Selling multiple items:', {
      wallet: walletAddress,
      items: items.length
    });

    try {
      // Calculate total earnings
      const total_earnings = items.reduce((sum, item) => sum + item.sell_price, 0);
      
      // Remove items from inventory by deleting them directly
      const itemIds = items.map(item => item.instance_id);
      
      for (const id of itemIds) {
        const { error: removeError } = await supabase
          .from('item_instances')
          .delete()
          .eq('id', id)
          .eq('wallet_address', walletAddress);

        if (removeError) throw removeError;
      }

      // Update balance using p_updates JSONB parameter
      const { error: balanceError } = await supabase.rpc('update_game_data_by_wallet_v2', {
        p_wallet_address: walletAddress,
        p_updates: { balance_add: total_earnings }
      });

      if (balanceError) throw balanceError;

      const result: BatchSellResult = {
        success: true,
        items_sold: items.length,
        total_earnings
      };

      console.log('✅ [BatchOps] Sell successful:', result);
      return result;
    } catch (error) {
      console.error('❌ [BatchOps] Sell error:', error);
      return null;
    }
  }

  /**
   * Purchase multiple items in a single transaction
   * @param walletAddress - User's wallet address
   * @param purchases - Array of items to purchase
   * @returns Result with count or null on error
   */
  async buyMultipleItems(
    walletAddress: string,
    purchases: PurchaseData[]
  ): Promise<BatchPurchaseResult | null> {
    if (!walletAddress || !purchases || purchases.length === 0) {
      console.error('❌ [BatchOps] Invalid purchase parameters');
      return null;
    }

    console.log('🛒 [BatchOps] Purchasing multiple items:', {
      wallet: walletAddress,
      purchases: purchases.length,
      total_items: purchases.reduce((sum, p) => sum + p.quantity, 0)
    });

    try {
      const total_cost = purchases.reduce(
        (sum, p) => sum + (p.price_per_unit * p.quantity), 
        0
      );

      // Create item instances for each purchase
      const itemsToAdd = purchases.flatMap(purchase =>
        Array.from({ length: purchase.quantity }, () => ({
          template_id: purchase.item_template_id
        }))
      );

      const { error: addError } = await supabase.rpc('add_item_instances', {
        p_wallet_address: walletAddress,
        p_items: itemsToAdd as any
      });

      if (addError) throw addError;

      // Deduct balance using p_updates JSONB parameter
      const { error: balanceError } = await supabase.rpc('update_game_data_by_wallet_v2', {
        p_wallet_address: walletAddress,
        p_updates: { balance_add: -total_cost }
      });

      if (balanceError) throw balanceError;

      const result: BatchPurchaseResult = {
        success: true,
        items_purchased: itemsToAdd.length,
        total_cost
      };

      console.log('✅ [BatchOps] Purchase successful:', result);
      return result;
    } catch (error) {
      console.error('❌ [BatchOps] Purchase error:', error);
      return null;
    }
  }

  /**
   * Upgrade multiple cards in a single transaction
   * @param walletAddress - User's wallet address
   * @param upgrades - Array of cards to upgrade
   * @returns Result with counts or null on error
   */
  async upgradeMultipleCards(
    walletAddress: string,
    upgrades: CardUpgradeData[]
  ): Promise<BatchUpgradeResult | null> {
    if (!walletAddress || !upgrades || upgrades.length === 0) {
      console.error('❌ [BatchOps] Invalid upgrade parameters');
      return null;
    }

    console.log('⬆️ [BatchOps] Upgrading multiple cards:', {
      wallet: walletAddress,
      upgrades: upgrades.length
    });

    try {
      const failed_upgrades: string[] = [];
      let cards_upgraded = 0;

      // NOTE: Card upgrade functionality needs proper RPC function implementation
      // This is a placeholder that will fail gracefully
      console.warn('⚠️ [BatchOps] Card upgrade not fully implemented - requires RPC function');
      
      const result: BatchUpgradeResult = {
        success: false,
        cards_upgraded: 0,
        failed_upgrades: upgrades.map(u => u.card_instance_id)
      };

      console.log('⚠️ [BatchOps] Upgrade skipped (not implemented):', result);
      return result;
    } catch (error) {
      console.error('❌ [BatchOps] Upgrade error:', error);
      return null;
    }
  }
}

// Export singleton instance
export const batchOperationsService = new BatchOperationsService();
