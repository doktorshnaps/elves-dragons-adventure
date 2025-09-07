import { useState, useEffect } from 'react';

export type Language = 'ru' | 'en';

export const useLanguage = () => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('game-language');
    return (saved as Language) || 'ru';
  });

  const toggleLanguage = () => {
    const newLang: Language = language === 'ru' ? 'en' : 'ru';
    setLanguage(newLang);
    localStorage.setItem('game-language', newLang);
  };

  useEffect(() => {
    localStorage.setItem('game-language', language);
  }, [language]);

  return {
    language,
    toggleLanguage,
    setLanguage
  };
};