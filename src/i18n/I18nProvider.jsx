import { createContext, useContext, useState } from 'react';
import translations from './translations';

const I18nContext = createContext();

/**
 * I18n Provider
 * Manages language state and provides translation functions
 */
export function I18nProvider({ children, initialLanguage = 'en' }) {
  const [language, setLanguage] = useState(initialLanguage);

  /**
   * Toggle between English and Czech
   */
  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'en' ? 'cs' : 'en'));
  };

  /**
   * Set language explicitly
   * @param {string} lang - Language code ('en' or 'cs')
   */
  const setLanguageExplicit = (lang) => {
    if (lang === 'en' || lang === 'cs') {
      setLanguage(lang);
    }
  };

  /**
   * Translate a key to the current language
   * @param {string} key - Translation key
   * @returns {string} Translated text
   */
  const t = (key) => {
    const table = translations[language] || translations.en || {};
    return table[key] || (translations.en ? translations.en[key] : key) || key;
  };

  const value = {
    language,
    toggleLanguage,
    setLanguage: setLanguageExplicit,
    t,
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/**
 * Hook to use i18n context
 * @returns {{language: string, toggleLanguage: function, setLanguage: function, t: function}}
 */
export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}
