import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

const DEV = import.meta.env.DEV;

/**
 * Global referral parameter handler
 * Captures 'ref' parameter from URL on ANY page and saves to localStorage
 * This ensures referral links work regardless of which page users land on
 */
export const ReferralHandler = () => {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const refParam = searchParams.get('ref');
    if (!refParam) {
      if (DEV) console.log('⚠️ [ReferralHandler] No ref parameter');
      return;
    }
    localStorage.setItem('pendingReferrer', refParam);
    if (DEV) console.log('✅ [ReferralHandler] Saved ref:', refParam);
  }, [searchParams]);

  return null;
};
