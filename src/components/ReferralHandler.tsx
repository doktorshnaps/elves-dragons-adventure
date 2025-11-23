import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Global referral parameter handler
 * Captures 'ref' parameter from URL on ANY page and saves to localStorage
 * This ensures referral links work regardless of which page users land on
 */
export const ReferralHandler = () => {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const refParam = searchParams.get('ref');
    if (refParam) {
      localStorage.setItem('pendingReferrer', refParam);
      console.log('🔗 Global: Referral link detected and saved:', refParam);
    }
  }, [searchParams]);

  return null; // This component doesn't render anything
};
