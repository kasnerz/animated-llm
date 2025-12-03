import { useState, useRef, useEffect } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import translations from '../i18n/translations';
import '../styles/language-selector.css';

/**
 * Language metadata including display names and flags
 * If a language is not listed here, it will fallback to:
 * - name: language code in uppercase (e.g., 'UK' for Ukrainian)
 * - flag: generic globe emoji 🌐
 */
const LANGUAGE_INFO = {
  en: { name: 'English', flag: '🇬🇧' },
  cs: { name: 'Čeština', flag: '🇨🇿' },
  fr: { name: 'Français', flag: '🇫🇷' },
  uk: { name: 'Українська', flag: '🇺🇦' },
  zh: { name: '中文', flag: '🇨🇳' },
};

/**
 * LanguageSelector component
 * Dropdown for selecting application language
 */
function LanguageSelector() {
  const { language, setLanguage } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Get all available languages from translations
  const availableLanguages = Object.keys(translations);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    setIsOpen(false);
  };

  const currentLangInfo = LANGUAGE_INFO[language] || { name: language.toUpperCase(), flag: '🌐' };

  return (
    <div className="language-selector" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="icon-button-minimal language-button"
        title={currentLangInfo.name}
        aria-label={`Select language (current: ${currentLangInfo.name})`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span className="language-flag">{currentLangInfo.flag}</span>
      </button>

      {isOpen && (
        <div className="language-dropdown">
          {availableLanguages.map((lang) => {
            const langInfo = LANGUAGE_INFO[lang] || { name: lang.toUpperCase(), flag: '🌐' };
            const isActive = lang === language;

            return (
              <button
                key={lang}
                onClick={() => handleLanguageChange(lang)}
                className={`language-option ${isActive ? 'active' : ''}`}
                aria-current={isActive ? 'true' : 'false'}
              >
                <span className="language-flag">{langInfo.flag}</span>
                <span className="language-name">{langInfo.name}</span>
                {isActive && <span className="language-checkmark">✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default LanguageSelector;
