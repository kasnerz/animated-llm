import { createContext, useContext, useState } from 'react';
import translations from './translations';

const I18nContext = createContext();

/**
 * I18n Provider
 * Manages language state and provides translation functions
 *
 * Translation fallback behavior:
 * 1. Try requested language
 * 2. If key not found, fallback to English
 * 3. If still not found, return the key itself
 */
export function I18nProvider({ children, initialLanguage = 'en' }) {
  const [language, setLanguage] = useState(initialLanguage);

  // Get available languages from translations
  const availableLanguages = Object.keys(translations);

  /**
   * Cycle through available languages
   */
  const toggleLanguage = () => {
    setLanguage((prev) => {
      const currentIndex = availableLanguages.indexOf(prev);
      const nextIndex = (currentIndex + 1) % availableLanguages.length;
      return availableLanguages[nextIndex];
    });
  };

  /**
   * Set language explicitly
   * @param {string} lang - Language code
   */
  const setLanguageExplicit = (lang) => {
    if (availableLanguages.includes(lang)) {
      setLanguage(lang);
    }
  };

  /**
   * Translate a key to the current language
   * Fallback chain: current language → English → key itself
   * @param {string} key - Translation key
   * @returns {string} Translated text
   */
  const t = (key) => {
    // Try current language
    const currentLangTable = translations[language];
    if (currentLangTable && currentLangTable[key]) {
      return currentLangTable[key];
    }

    // Fallback to English
    const englishTable = translations.en;
    if (englishTable && englishTable[key]) {
      return englishTable[key];
    }

    // Last resort: return the key itself
    return key;
  };

  /**
   * Get list of available languages
   * @returns {string[]} Array of language codes
   */
  const getAvailableLanguages = () => availableLanguages;

  const value = {
    language,
    toggleLanguage,
    setLanguage: setLanguageExplicit,
    getAvailableLanguages,
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
