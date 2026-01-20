import { QueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/config/reactQuery';

/**
 * Централизованные пресеты инвалидации кэша
 * 
 * Architectural pattern: после каждой мутации инвалидируем ВСЕ затронутые queryKeys
 * через Promise.all для параллельного выполнения
 * 
 * @see docs/STORE_HIERARCHY.md - Multi-layer cache sync enforcement
 */

export type InvalidationPreset = 
  | 'afterShopPurchase'
  | 'afterBattle'
  | 'afterCraft'
  | 'afterCardPackOpen'
  | 'afterHeroUpgrade'
  | 'afterItemUse'
  | 'afterMedicalBay'
  | 'afterForgeBay'
  | 'afterResourceCollection'
  | 'afterBuildingUpgrade'
  | 'afterTeamChange'
  | 'afterBalanceChange'
  | 'afterLogout';

/**
 * Маппинг пресетов на затронутые queryKeys
 */
const presetToKeys: Record<InvalidationPreset, (walletAddress: string) => readonly (readonly string[])[]> = {
  afterShopPurchase: (wallet) => [
    queryKeys.shopDataComplete(wallet),
    queryKeys.itemInstances(wallet),
    queryKeys.gameData(wallet), // balance
  ],
  
  afterBattle: (wallet) => [
    queryKeys.cardInstances(wallet),
    queryKeys.gameData(wallet), // balance, battleState
    queryKeys.itemInstances(wallet), // loot drops
  ],
  
  afterCraft: (wallet) => [
    queryKeys.itemInstances(wallet),
    queryKeys.gameData(wallet), // resources (wood, stone, iron)
  ],
  
  afterCardPackOpen: (wallet) => [
    queryKeys.itemInstances(wallet),
    queryKeys.cardInstances(wallet),
  ],
  
  afterHeroUpgrade: (wallet) => [
    queryKeys.cardInstances(wallet),
    queryKeys.itemInstances(wallet), // consumed materials
    queryKeys.gameData(wallet), // resources, barracksUpgrades
  ],
  
  afterItemUse: (wallet) => [
    queryKeys.itemInstances(wallet),
    queryKeys.cardInstances(wallet), // if healing/buffing cards
    queryKeys.gameData(wallet),
  ],
  
  afterMedicalBay: (wallet) => [
    queryKeys.medicalBay(wallet),
    queryKeys.cardInstances(wallet),
  ],
  
  afterForgeBay: (wallet) => [
    queryKeys.forgeBay(wallet),
    queryKeys.cardInstances(wallet),
  ],
  
  afterResourceCollection: (wallet) => [
    queryKeys.gameData(wallet), // wood, stone, iron, timestamps
  ],
  
  afterBuildingUpgrade: (wallet) => [
    queryKeys.gameData(wallet), // buildingLevels, resources
    queryKeys.itemInstances(wallet), // consumed materials
  ],
  
  afterTeamChange: (wallet) => [
    queryKeys.gameData(wallet), // selectedTeam
  ],
  
  afterBalanceChange: (wallet) => [
    queryKeys.gameData(wallet),
    queryKeys.shopDataComplete(wallet),
  ],
  
  afterLogout: (wallet) => [
    queryKeys.gameData(wallet),
    queryKeys.cardInstances(wallet),
    queryKeys.itemInstances(wallet),
    queryKeys.shopDataComplete(wallet),
    queryKeys.profile(wallet),
    queryKeys.medicalBay(wallet),
    queryKeys.forgeBay(wallet),
  ],
};

/**
 * Инвалидирует кэш по пресету - все ключи параллельно
 * 
 * @example
 * await invalidateByPreset(queryClient, walletAddress, 'afterShopPurchase');
 */
export async function invalidateByPreset(
  queryClient: QueryClient,
  walletAddress: string,
  preset: InvalidationPreset
): Promise<void> {
  const keys = presetToKeys[preset](walletAddress);
  
  console.log(`🔄 [invalidateByPreset] ${preset}:`, keys.map(k => k.join(':')));
  
  await Promise.all(
    keys.map(queryKey => 
      queryClient.invalidateQueries({ queryKey: [...queryKey] })
    )
  );
  
  console.log(`✅ [invalidateByPreset] ${preset} completed`);
}

/**
 * Инвалидирует несколько пресетов параллельно
 * 
 * @example
 * await invalidateMultiplePresets(queryClient, walletAddress, ['afterBattle', 'afterItemUse']);
 */
export async function invalidateMultiplePresets(
  queryClient: QueryClient,
  walletAddress: string,
  presets: InvalidationPreset[]
): Promise<void> {
  // Собираем все уникальные ключи из всех пресетов
  const allKeysSet = new Set<string>();
  const allKeys: (readonly string[])[] = [];
  
  for (const preset of presets) {
    const keys = presetToKeys[preset](walletAddress);
    for (const key of keys) {
      const keyStr = key.join(':');
      if (!allKeysSet.has(keyStr)) {
        allKeysSet.add(keyStr);
        allKeys.push(key);
      }
    }
  }
  
  console.log(`🔄 [invalidateMultiplePresets] ${presets.join(', ')}:`, allKeys.map(k => k.join(':')));
  
  await Promise.all(
    allKeys.map(queryKey => 
      queryClient.invalidateQueries({ queryKey: [...queryKey] })
    )
  );
  
  console.log(`✅ [invalidateMultiplePresets] completed`);
}

/**
 * Селективная инвалидация по конкретным ключам
 * 
 * @example
 * await invalidateSelective(queryClient, walletAddress, {
 *   balance: true,
 *   itemInstances: true,
 *   cardInstances: false
 * });
 */
export async function invalidateSelective(
  queryClient: QueryClient,
  walletAddress: string,
  options: {
    gameData?: boolean;
    cardInstances?: boolean;
    itemInstances?: boolean;
    shopData?: boolean;
    medicalBay?: boolean;
    forgeBay?: boolean;
    profile?: boolean;
  }
): Promise<void> {
  const invalidations: Promise<void>[] = [];
  
  if (options.gameData) {
    invalidations.push(queryClient.invalidateQueries({ queryKey: [...queryKeys.gameData(walletAddress)] }));
  }
  if (options.cardInstances) {
    invalidations.push(queryClient.invalidateQueries({ queryKey: [...queryKeys.cardInstances(walletAddress)] }));
  }
  if (options.itemInstances) {
    invalidations.push(queryClient.invalidateQueries({ queryKey: [...queryKeys.itemInstances(walletAddress)] }));
  }
  if (options.shopData) {
    invalidations.push(queryClient.invalidateQueries({ queryKey: [...queryKeys.shopDataComplete(walletAddress)] }));
  }
  if (options.medicalBay) {
    invalidations.push(queryClient.invalidateQueries({ queryKey: [...queryKeys.medicalBay(walletAddress)] }));
  }
  if (options.forgeBay) {
    invalidations.push(queryClient.invalidateQueries({ queryKey: [...queryKeys.forgeBay(walletAddress)] }));
  }
  if (options.profile) {
    invalidations.push(queryClient.invalidateQueries({ queryKey: [...queryKeys.profile(walletAddress)] }));
  }
  
  if (invalidations.length > 0) {
    console.log(`🔄 [invalidateSelective] Invalidating ${invalidations.length} keys`);
    await Promise.all(invalidations);
    console.log(`✅ [invalidateSelective] completed`);
  }
}

/**
 * Хук для использования в компонентах
 */
export function createInvalidator(queryClient: QueryClient, walletAddress: string) {
  return {
    afterShopPurchase: () => invalidateByPreset(queryClient, walletAddress, 'afterShopPurchase'),
    afterBattle: () => invalidateByPreset(queryClient, walletAddress, 'afterBattle'),
    afterCraft: () => invalidateByPreset(queryClient, walletAddress, 'afterCraft'),
    afterCardPackOpen: () => invalidateByPreset(queryClient, walletAddress, 'afterCardPackOpen'),
    afterHeroUpgrade: () => invalidateByPreset(queryClient, walletAddress, 'afterHeroUpgrade'),
    afterItemUse: () => invalidateByPreset(queryClient, walletAddress, 'afterItemUse'),
    afterMedicalBay: () => invalidateByPreset(queryClient, walletAddress, 'afterMedicalBay'),
    afterForgeBay: () => invalidateByPreset(queryClient, walletAddress, 'afterForgeBay'),
    afterResourceCollection: () => invalidateByPreset(queryClient, walletAddress, 'afterResourceCollection'),
    afterBuildingUpgrade: () => invalidateByPreset(queryClient, walletAddress, 'afterBuildingUpgrade'),
    afterTeamChange: () => invalidateByPreset(queryClient, walletAddress, 'afterTeamChange'),
    afterBalanceChange: () => invalidateByPreset(queryClient, walletAddress, 'afterBalanceChange'),
    afterLogout: () => invalidateByPreset(queryClient, walletAddress, 'afterLogout'),
    
    // Selective invalidation
    selective: (options: Parameters<typeof invalidateSelective>[2]) => 
      invalidateSelective(queryClient, walletAddress, options),
    
    // Multiple presets
    multiple: (presets: InvalidationPreset[]) => 
      invalidateMultiplePresets(queryClient, walletAddress, presets),
  };
}
