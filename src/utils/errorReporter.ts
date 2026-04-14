import { supabase } from '@/integrations/supabase/client';

const DEDUP_WINDOW_MS = 10_000;
const MAX_REPORTS_PER_MINUTE = 5;

let recentErrors: Map<string, number> = new Map();
let reportCount = 0;
let minuteStart = Date.now();

function getWalletAddress(): string | null {
  try {
    const raw = localStorage.getItem('wallet-storage');
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed?.state?.accountId || null;
    }
  } catch {}
  return null;
}

export async function reportError(
  error: Error | string,
  source: 'error_boundary' | 'unhandled_rejection' | 'window_error' | 'api_error',
  metadata?: Record<string, unknown>
) {
  try {
    const message = typeof error === 'string' ? error : error.message;
    const stack = typeof error === 'string' ? undefined : error.stack;

    // Dedup: skip if same message reported within window
    const now = Date.now();
    const lastSeen = recentErrors.get(message);
    if (lastSeen && now - lastSeen < DEDUP_WINDOW_MS) return;
    recentErrors.set(message, now);

    // Rate limit
    if (now - minuteStart > 60_000) {
      reportCount = 0;
      minuteStart = now;
    }
    if (reportCount >= MAX_REPORTS_PER_MINUTE) return;
    reportCount++;

    // Cleanup old dedup entries
    if (recentErrors.size > 50) {
      for (const [key, ts] of recentErrors) {
        if (now - ts > DEDUP_WINDOW_MS) recentErrors.delete(key);
      }
    }

    await supabase.from('client_error_logs').insert([{
      wallet_address: getWalletAddress(),
      error_message: message.substring(0, 2000),
      error_stack: stack?.substring(0, 5000) || null,
      error_source: source,
      page_url: window.location.href,
      user_agent: navigator.userAgent.substring(0, 500),
      metadata: metadata || {},
    }]);
  } catch {
    // Silent fail - don't create error loops
  }
}
