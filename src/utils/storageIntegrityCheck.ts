/**
 * Storage Integrity Check Utility
 * 
 * Проверяет localStorage на наличие подозрительных изменений
 * и несоответствий с серверными данными
 */

interface IntegrityCheckResult {
  passed: boolean;
  warnings: string[];
  errors: string[];
}

/**
 * Проверка разумности значений баланса
 */
function validateBalance(balance: number): string[] {
  const warnings: string[] = [];
  
  if (balance < 0) {
    warnings.push('Negative balance detected');
  }
  
  if (balance > 1000000000) {
    warnings.push('Suspiciously high balance (>1B)');
  }
  
  return warnings;
}

/**
 * Проверка валидности карт
 */
function validateCards(cards: any[]): string[] {
  const warnings: string[] = [];
  
  if (!Array.isArray(cards)) {
    warnings.push('Cards is not an array');
    return warnings;
  }
  
  // Проверка на дубликаты ID
  const ids = cards.map(c => c.id);
  const uniqueIds = new Set(ids);
  if (ids.length !== uniqueIds.size) {
    warnings.push('Duplicate card IDs detected');
  }
  
  // Проверка на подозрительные значения характеристик
  cards.forEach((card, index) => {
    if (card.power > 1000) {
      warnings.push(`Card ${index} has suspicious power: ${card.power}`);
    }
    if (card.health > 10000) {
      warnings.push(`Card ${index} has suspicious health: ${card.health}`);
    }
  });
  
  return warnings;
}

/**
 * Проверка инвентаря
 */
function validateInventory(inventory: any[]): string[] {
  const warnings: string[] = [];
  
  if (!Array.isArray(inventory)) {
    warnings.push('Inventory is not an array');
    return warnings;
  }
  
  // Проверка на дубликаты
  const ids = inventory.map(i => i.id);
  const uniqueIds = new Set(ids);
  if (ids.length !== uniqueIds.size) {
    warnings.push('Duplicate inventory items detected');
  }
  
  return warnings;
}

/**
 * Полная проверка целостности localStorage
 */
export function performIntegrityCheck(): IntegrityCheckResult {
  const result: IntegrityCheckResult = {
    passed: true,
    warnings: [],
    errors: []
  };
  
  try {
    // Проверка баланса
    const balanceStr = localStorage.getItem('gameBalance');
    if (balanceStr) {
      try {
        const balance = Number(balanceStr);
        const balanceWarnings = validateBalance(balance);
        result.warnings.push(...balanceWarnings);
      } catch (e) {
        result.errors.push('Failed to parse gameBalance');
      }
    }
    
    // Проверка карт
    const cardsStr = localStorage.getItem('gameCards');
    if (cardsStr) {
      try {
        const cards = JSON.parse(cardsStr);
        const cardWarnings = validateCards(cards);
        result.warnings.push(...cardWarnings);
      } catch (e) {
        result.errors.push('Failed to parse gameCards');
      }
    }
    
    // Проверка инвентаря - DEPRECATED (теперь используется item_instances)
    const inventoryStr = localStorage.getItem('gameInventory');
    if (inventoryStr) {
      result.warnings.push('gameInventory в localStorage устарел, используйте item_instances');
    }
    
    // Если есть критические ошибки, проверка не пройдена
    if (result.errors.length > 0) {
      result.passed = false;
    }
    
    // Логирование подозрительных находок
    if (result.warnings.length > 0 || result.errors.length > 0) {
      console.warn('🔍 Storage integrity check findings:', result);
    }
    
  } catch (e) {
    result.passed = false;
    result.errors.push(`Integrity check failed: ${e}`);
  }
  
  return result;
}

/**
 * Проверка соответствия localStorage и server данных
 */
export function compareWithServerData(
  localData: any,
  serverData: any
): { mismatch: boolean; differences: string[] } {
  const differences: string[] = [];
  
  // Сравнение баланса
  if (localData.balance !== serverData.balance) {
    const diff = localData.balance - serverData.balance;
    differences.push(`Balance mismatch: local=${localData.balance}, server=${serverData.balance}, diff=${diff}`);
  }
  
  // Сравнение количества карт
  const localCardsCount = localData.cards?.length || 0;
  const serverCardsCount = serverData.cards?.length || 0;
  if (localCardsCount !== serverCardsCount) {
    differences.push(`Cards count mismatch: local=${localCardsCount}, server=${serverCardsCount}`);
  }
  
  // Сравнение инвентаря
  const localInventoryCount = localData.inventory?.length || 0;
  const serverInventoryCount = serverData.inventory?.length || 0;
  if (localInventoryCount !== serverInventoryCount) {
    differences.push(`Inventory count mismatch: local=${localInventoryCount}, server=${serverInventoryCount}`);
  }
  
  return {
    mismatch: differences.length > 0,
    differences
  };
}
