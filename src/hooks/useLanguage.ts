import { useContext } from 'react';
import { LanguageContext, Language } from '@/contexts/LanguageContext';

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    // Fallback (should not happen once LanguageProvider wraps the app)
    const saved = (localStorage.getItem('game-language') as Language) || 'ru';
    const setLanguage = (lang: Language) => localStorage.setItem('game-language', lang);
    const toggleLanguage = () => setLanguage(saved === 'ru' ? 'en' : 'ru');
    console.warn('useLanguage used outside of LanguageProvider. Wrap your app with LanguageProvider.');
    return { language: saved, setLanguage, toggleLanguage } as const;
  }
  return ctx;
};