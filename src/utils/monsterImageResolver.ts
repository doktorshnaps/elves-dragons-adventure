import { monsterImagesById, monsterImagesByName } from "@/constants/monsterImages";

interface Monster {
  monster_id: string;
  monster_name: string;
  image_url: string | null;
}

/**
 * Resolves monster image URL prioritizing imported assets over database URLs
 */
export const resolveMonsterImage = (monster: Monster): string => {
  // 1. Try to get image by monster_id from imported assets
  if (monster.monster_id && monsterImagesById[monster.monster_id]) {
    return monsterImagesById[monster.monster_id];
  }

  // 2. Try to get image by monster_name from imported assets
  if (monster.monster_name && monsterImagesByName[monster.monster_name]) {
    return monsterImagesByName[monster.monster_name];
  }

  // 3. Use database URL if it's a valid external URL (uploaded images)
  if (monster.image_url && (
    monster.image_url.startsWith('http://') || 
    monster.image_url.startsWith('https://') ||
    monster.image_url.startsWith('ipfs://') ||
    monster.image_url.startsWith('ar://')
  )) {
    return normalizeMonsterImageUrl(monster.image_url);
  }

  // 4. Fallback to placeholder
  return '/placeholder.svg';
};

/**
 * Normalizes IPFS and Arweave URLs
 */
const normalizeMonsterImageUrl = (url: string): string => {
  try {
    // IPFS URL normalization
    if (url.startsWith('ipfs://')) {
      return url.replace('ipfs://', 'https://ipfs.io/ipfs/');
    }
    
    // If it's just an IPFS hash
    if (/^[a-zA-Z0-9]{46,}$/.test(url)) {
      return `https://ipfs.io/ipfs/${url}`;
    }
    
    // Arweave URL
    if (url.startsWith('ar://')) {
      return url.replace('ar://', 'https://arweave.net/');
    }
    
    return url;
  } catch (error) {
    console.error('Error normalizing monster image URL:', error);
    return '/placeholder.svg';
  }
};
