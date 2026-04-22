import { useEffect, useState, useCallback } from 'react';

const STORAGE_KEY = 'card-animations-enabled';
const CHANGE_EVENT = 'card-animations-changed';
const HTML_CLASS = 'no-card-animations';

const readInitial = (): boolean => {
  if (typeof window === 'undefined') return true;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === null) {
      // Respect prefers-reduced-motion as default
      const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      return !prefersReduced;
    }
    return stored !== 'false';
  } catch {
    return true;
  }
};

const applyHtmlClass = (enabled: boolean) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (enabled) {
    root.classList.remove(HTML_CLASS);
  } else {
    root.classList.add(HTML_CLASS);
  }
};

/**
 * Initialize the card-animations class on <html> as early as possible.
 * Call once at app startup (main.tsx).
 */
export const initCardAnimationsSetting = () => {
  applyHtmlClass(readInitial());
};

export const useCardAnimationsSetting = () => {
  const [enabled, setEnabledState] = useState<boolean>(readInitial);

  useEffect(() => {
    applyHtmlClass(enabled);
  }, [enabled]);

  useEffect(() => {
    const sync = () => setEnabledState(readInitial());
    window.addEventListener('storage', sync);
    window.addEventListener(CHANGE_EVENT, sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener(CHANGE_EVENT, sync);
    };
  }, []);

  const setEnabled = useCallback((next: boolean) => {
    try {
      localStorage.setItem(STORAGE_KEY, next ? 'true' : 'false');
    } catch {
      // ignore
    }
    setEnabledState(next);
    applyHtmlClass(next);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  const toggle = useCallback(() => setEnabled(!enabled), [enabled, setEnabled]);

  return { enabled, setEnabled, toggle };
};