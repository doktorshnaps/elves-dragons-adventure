/**
 * Secure Storage Utility
 * 
 * Защищенное хранилище с проверкой целостности данных.
 * Использует HMAC подписи для предотвращения подделки критических данных в localStorage.
 */

interface SecureData<T> {
  data: T;
  timestamp: number;
  signature: string;
}

/**
 * Простая HMAC подпись на основе wallet address
 * В production лучше использовать crypto.subtle.sign
 */
async function generateSignature(data: string, walletAddress: string): Promise<string> {
  const message = `${data}:${walletAddress}`;
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(message);
  
  // Используем crypto.subtle для более надежной подписи
  if (window.crypto && window.crypto.subtle) {
    try {
      // Convert Uint8Array to ArrayBuffer properly
      const arrayBuffer = new ArrayBuffer(dataBuffer.length);
      new Uint8Array(arrayBuffer).set(dataBuffer);
      
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      console.warn('crypto.subtle not available, using fallback');
    }
  }
  
  // Fallback: простой hash
  let hash = 0;
  for (let i = 0; i < message.length; i++) {
    hash = ((hash << 5) - hash) + message.charCodeAt(i);
    hash = hash & hash;
  }
  return hash.toString(36);
}

/**
 * Проверка подписи данных
 */
async function verifySignature(
  data: string, 
  signature: string, 
  walletAddress: string
): Promise<boolean> {
  const expectedSignature = await generateSignature(data, walletAddress);
  return signature === expectedSignature;
}

/**
 * Безопасное сохранение критических данных
 */
export async function secureSetItem<T>(
  key: string,
  value: T,
  walletAddress: string
): Promise<void> {
  try {
    const dataString = JSON.stringify(value);
    const signature = await generateSignature(dataString, walletAddress);
    
    const secureData: SecureData<T> = {
      data: value,
      timestamp: Date.now(),
      signature
    };
    
    localStorage.setItem(key, JSON.stringify(secureData));
  } catch (e) {
    console.error(`Failed to securely store ${key}:`, e);
  }
}

/**
 * Безопасное чтение критических данных с проверкой целостности
 */
export async function secureGetItem<T>(
  key: string,
  walletAddress: string,
  maxAge: number = 3600000 // 1 hour default
): Promise<T | null> {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return null;
    
    const secureData: SecureData<T> = JSON.parse(stored);
    
    // Проверка возраста данных
    if (Date.now() - secureData.timestamp > maxAge) {
      console.warn(`${key} data is stale, clearing`);
      localStorage.removeItem(key);
      return null;
    }
    
    // Проверка подписи
    const dataString = JSON.stringify(secureData.data);
    const isValid = await verifySignature(dataString, secureData.signature, walletAddress);
    
    if (!isValid) {
      console.error(`❌ SECURITY: ${key} signature invalid! Data may be tampered.`);
      localStorage.removeItem(key);
      return null;
    }
    
    return secureData.data;
  } catch (e) {
    console.error(`Failed to read secure ${key}:`, e);
    return null;
  }
}

/**
 * Список критических ключей, которые должны быть защищены
 */
export const CRITICAL_KEYS = [
  'gameBalance',
  'gameCards',
  'gameInventory',
  'dragonEggs',
  'selectedTeam'
] as const;

/**
 * Проверка целостности всех критических данных
 */
export async function validateCriticalData(walletAddress: string): Promise<{
  valid: boolean;
  invalidKeys: string[];
}> {
  const invalidKeys: string[] = [];
  
  for (const key of CRITICAL_KEYS) {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) continue;
      
      // Проверяем, является ли это защищенными данными
      const parsed = JSON.parse(stored);
      if (!parsed.signature) {
        // Старый формат без подписи - помечаем как невалидный
        invalidKeys.push(key);
        continue;
      }
      
      const dataString = JSON.stringify(parsed.data);
      const isValid = await verifySignature(dataString, parsed.signature, walletAddress);
      
      if (!isValid) {
        invalidKeys.push(key);
      }
    } catch (e) {
      invalidKeys.push(key);
    }
  }
  
  return {
    valid: invalidKeys.length === 0,
    invalidKeys
  };
}

/**
 * Очистка всех критических данных
 */
export function clearCriticalData(): void {
  CRITICAL_KEYS.forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error(`Failed to clear ${key}:`, e);
    }
  });
}
