import { createContext, useEffect, useMemo, useState, ReactNode } from 'react';

export type Language = 'ru' | 'en';

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
}

export const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('game-language') as Language | null;
    return saved === 'en' || saved === 'ru' ? saved : 'ru';
  });

  useEffect(() => {
    localStorage.setItem('game-language', language);
  }, [language]);

  const toggleLanguage = () => setLanguage((prev) => (prev === 'ru' ? 'en' : 'ru'));

  const value = useMemo(() => ({ language, setLanguage, toggleLanguage }), [language]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};