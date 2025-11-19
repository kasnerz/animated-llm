import { Link } from 'react-router-dom';
import { useI18n } from '../i18n/I18nProvider';
import { useApp } from '../contexts/AppContext';
import { CATEGORY_INFO, VIEW_CATEGORIES } from '../contexts/viewTypes';
import Icon from '@mdi/react';
import Logo from '../components/Logo';
import LanguageSelector from '../components/LanguageSelector';
import '../styles/home-page.css';

/**
 * HomePage component - Landing page with two main navigation buttons
 */
function HomePage() {
  const { t } = useI18n();
  const { state, actions } = useApp();

  const mainViews = [
    {
      ...CATEGORY_INFO[VIEW_CATEGORIES.TRAINING],
      path: '/pretraining',
    },
    {
      ...CATEGORY_INFO[VIEW_CATEGORIES.TEXT_GENERATION],
      path: '/text-generation',
    },
  ];

  return (
    <div className="home-page">
      {/* Header controls for home page */}
      <div className="home-header-controls">
        <button
          onClick={actions.toggleTheme}
          className="home-control-button"
          title={t('toggle_dark_light_mode')}
          aria-label={t('toggle_dark_light_mode')}
        >
          <span className="theme-icon">{state.theme === 'dark' ? '☀️' : '🌙'}</span>
        </button>
        <div className="home-language-selector">
          <LanguageSelector />
        </div>
        <a
          href="https://github.com/kasnerz/animated-llm"
          target="_blank"
          rel="noopener noreferrer"
          className="home-control-button"
          title="GitHub"
          aria-label="GitHub"
        >
          <img src="/src/assets/github-mark.png" alt="GitHub" className="github-icon" />
        </a>
      </div>

      <div className="home-content">
        {/* Logo */}
        <Logo variant="home" />

        {/* Main Navigation Buttons */}
        <div className="home-buttons">
          {mainViews.map((view) => (
            <Link key={view.id} to={view.path} className="home-button">
              <Icon path={view.icon} size={2.5} className="home-button-icon" />
              <span className="home-button-label">{t(view.labelKey) || view.defaultLabel}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default HomePage;
