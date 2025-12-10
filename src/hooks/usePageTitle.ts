import { useEffect } from 'react';

const BASE_TITLE = 'ElleonorAI - Dragon & Heroes | NFT Fantasy Card Game on NEAR';

export const usePageTitle = (title?: string) => {
  useEffect(() => {
    if (title) {
      document.title = `${title} | ElleonorAI`;
    } else {
      document.title = BASE_TITLE;
    }
    
    return () => {
      document.title = BASE_TITLE;
    };
  }, [title]);
};
