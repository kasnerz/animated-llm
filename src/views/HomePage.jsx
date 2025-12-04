import { Link } from 'react-router-dom';
import { useI18n } from '../i18n/I18nProvider';
import { useApp } from '../contexts/AppContext';
import Logo from '../components/Logo';
import LanguageSelector from '../components/LanguageSelector';
import githubMark from '../assets/github-mark.png';
import pretrainingSimpleIcon from '../assets/views/pretraining-simple.png';
import pretrainingModelIcon from '../assets/views/pretraining-model.png';
import decodingSimpleIcon from '../assets/views/decoding-simple.png';
import decodingModelIcon from '../assets/views/decoding-model.png';
import '../styles/home-page.css';

/**
 * HomePage component - Educational landing page with organized learning paths
 */
function HomePage() {
  const { t } = useI18n();
  const { state, actions } = useApp();

  const sections = [
    {
      id: 'generation',
      titleKey: 'home_generation_title',
      items: [
        {
          id: 'generation-simple',
          titleKey: 'home_generation_simple_title',
          descriptionKey: 'home_generation_simple_desc',
          path: '/generation-simple',
          icon: decodingSimpleIcon,
        },
        {
          id: 'generation-model',
          titleKey: 'home_generation_model_title',
          descriptionKey: 'home_generation_model_desc',
          path: '/generation-model',
          icon: decodingModelIcon,
        },
      ],
    },
    {
      id: 'training',
      titleKey: 'home_training_title',
      items: [
        {
          id: 'pretraining-simple',
          titleKey: 'home_pretraining_simple_title',
          descriptionKey: 'home_pretraining_simple_desc',
          path: '/pretraining-simple',
          icon: pretrainingSimpleIcon,
        },
        {
          id: 'pretraining-model',
          titleKey: 'home_pretraining_model_title',
          descriptionKey: 'home_pretraining_model_desc',
          path: '/pretraining-model',
          icon: pretrainingModelIcon,
        },
      ],
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
          <img src={githubMark} alt="GitHub" className="github-icon" />
        </a>
      </div>

      <div className="home-content">
        {/* Logo - smaller and at the top */}
        <div className="home-header">
          <Logo variant="home" />
          <p className="home-tagline">{t('home_tagline')}</p>
        </div>

        {/* Learning sections */}
        <div className="home-sections">
          {sections.map((section) => (
            <div key={section.id} className="home-section">
              <div className="section-header">
                <h2 className="section-title">{t(section.titleKey)}</h2>
              </div>
              <div className="section-items">
                {section.items.map((item) => (
                  <Link key={item.id} to={item.path} className="section-item">
                    <div className="item-icon-wrapper">
                      <img src={item.icon} alt="" className="item-icon-img" />
                    </div>
                    <div className="item-content">
                      <h3 className="item-title">{t(item.titleKey)}</h3>
                      <p className="item-description">{t(item.descriptionKey)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default HomePage;
