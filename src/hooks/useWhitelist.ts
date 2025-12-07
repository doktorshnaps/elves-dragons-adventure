// Whitelist is no longer used - game is open access
// This hook is kept for backward compatibility but always returns whitelisted: true
export const useWhitelist = () => {
  return { isWhitelisted: true, loading: false };
};
