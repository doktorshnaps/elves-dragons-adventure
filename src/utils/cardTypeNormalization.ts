/**
 * Normalizes card types between DB format (hero/dragon) and app format (character/pet).
 * 
 * The database stores card_type as 'hero' | 'dragon' | 'workers'
 * but the frontend app uses 'character' | 'pet' | 'workers' in filters and UI.
 * 
 * This utility ensures consistent type mapping across all components.
 */

/** Convert DB card type to app card type */
export const normalizeCardType = (rawType: string | undefined | null): string => {
  if (!rawType) return 'character';
  if (rawType === 'hero') return 'character';
  if (rawType === 'dragon') return 'pet';
  return rawType;
};

/** Convert app card type to DB card type */
export const toDbCardType = (appType: string | undefined | null): string => {
  if (!appType) return 'hero';
  if (appType === 'character') return 'hero';
  if (appType === 'pet') return 'dragon';
  return appType;
};
