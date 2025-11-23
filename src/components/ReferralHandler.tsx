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
    const existingRef = localStorage.getItem('pendingReferrer');
    
    console.log('🔗 [ReferralHandler] Mounted:', {
      refParam,
      existingRef,
      allParams: Object.fromEntries(searchParams.entries()),
      href: window.location.href
    });
    
    if (refParam) {
      localStorage.setItem('pendingReferrer', refParam);
      console.log('✅ [ReferralHandler] Saved ref to localStorage:', refParam);
    } else {
      console.log('⚠️ [ReferralHandler] No ref parameter found');
    }
  }, [searchParams]);

  return null;
};
