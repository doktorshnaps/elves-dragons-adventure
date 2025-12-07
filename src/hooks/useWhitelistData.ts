// Whitelist is no longer used - game is open access
// This hook is kept for backward compatibility but returns empty array
export const useWhitelistData = () => {
  return {
    data: [],
    isLoading: false,
    error: null,
    refetch: () => Promise.resolve({ data: [], isLoading: false, error: null }),
  };
};
