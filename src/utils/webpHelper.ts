/**
 * Utility to help with WebP image loading with fallback to original format
 */

/**
 * Converts an image path to its WebP version
 * @param imagePath - Original image path
 * @returns WebP version of the path if applicable
 */
export const getWebPVersion = (imagePath: string): string => {
  if (!imagePath || imagePath === '/placeholder.svg') return imagePath;
  
  // Don't convert if already WebP
  if (imagePath.endsWith('.webp')) return imagePath;
  
  // Don't convert external URLs (IPFS, Arweave, etc.)
  if (imagePath.startsWith('http://') || 
      imagePath.startsWith('https://') || 
      imagePath.startsWith('ipfs://') || 
      imagePath.startsWith('ar://')) {
    return imagePath;
  }
  
  // Replace extension with .webp
  const lastDotIndex = imagePath.lastIndexOf('.');
  if (lastDotIndex === -1) return imagePath;
  
  return imagePath.substring(0, lastDotIndex) + '.webp';
};

/**
 * Checks if a WebP version of an image exists
 * @param imagePath - Original image path
 * @returns Promise that resolves to true if WebP exists
 */
export const webpExists = async (imagePath: string): Promise<boolean> => {
  const webpPath = getWebPVersion(imagePath);
  if (webpPath === imagePath) return false;
  
  try {
    const response = await fetch(webpPath, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
};

/**
 * Gets the best available image path (WebP if exists, original otherwise)
 * @param imagePath - Original image path
 * @returns Promise that resolves to the best available path
 */
export const getBestImagePath = async (imagePath: string): Promise<string> => {
  const webpPath = getWebPVersion(imagePath);
  
  // If no WebP version possible, return original
  if (webpPath === imagePath) return imagePath;
  
  // Check if WebP exists
  const hasWebP = await webpExists(imagePath);
  return hasWebP ? webpPath : imagePath;
};

/**
 * Preloads both WebP and original versions of an image
 * @param imagePath - Original image path
 */
export const preloadImageWithWebP = (imagePath: string): void => {
  const webpPath = getWebPVersion(imagePath);
  
  // Preload WebP if different
  if (webpPath !== imagePath) {
    const webpImg = new Image();
    webpImg.src = webpPath;
  }
  
  // Preload original
  const img = new Image();
  img.src = imagePath;
};
