import { Link } from 'react-router-dom';
import React from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { useApp } from '../contexts/AppContext';
import Logo from '../components/Logo';
import AboutModal from '../components/AboutModal';
import LanguageSelector from '../components/LanguageSelector';
import Icon from '@mdi/react';
import { mdiInformationOutline } from '@mdi/js';
import githubMark from '../assets/github-mark.png';
import pretrainingSimplePreview from '../assets/previews/pretraining-simple.png';
import pretrainingModelPreview from '../assets/previews/pretraining-model.png';
import generationSimplePreview from '../assets/previews/generation-simple.png';
import generationModelPreview from '../assets/previews/generation-model.png';
import AnimatedWave from '../components/lightswind/AnimatedWave';
import '../styles/home-page.css';

/**
 * HomePage component - Educational landing page with organized learning paths
 */
function HomePage() {
  const { t } = useI18n();
  const { state, actions } = useApp();
  const [isAboutOpen, setIsAboutOpen] = React.useState(false);

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
          preview: generationSimplePreview,
        },
        {
          id: 'generation-model',
          titleKey: 'home_generation_model_title',
          descriptionKey: 'home_generation_model_desc',
          path: '/generation-model',
          preview: generationModelPreview,
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
          preview: pretrainingSimplePreview,
        },
        {
          id: 'pretraining-model',
          titleKey: 'home_pretraining_model_title',
          descriptionKey: 'home_pretraining_model_desc',
          path: '/pretraining-model',
          preview: pretrainingModelPreview,
        },
      ],
    },
  ];

  const isDark = state.theme === 'dark';

  return (
    <div className="home-page">
      <div className="home-background-wave-container">
        <AnimatedWave
          waveColor={isDark ? '#4a8a70' : '#92C4A7'}
          backgroundColor="transparent"
          opacity={isDark ? 0.2 : 0.3}
          magnitude={100}
          waveOffsetY={250}
          waveRotation={50}
          quality="high"
          speed={0.01}
        />
      </div>

      {/* About Modal */}
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />

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
        <button
          onClick={() => setIsAboutOpen(true)}
          className="home-control-button"
          title={t('about')}
          aria-label={t('about')}
        >
          <Icon path={mdiInformationOutline} size={1} />
        </button>
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
                    <div className="item-main-content">
                      <div className="item-preview-wrapper">
                        <img src={item.preview} alt="" className="item-preview-img" />
                      </div>
                      <div className="item-content">
                        <h3 className="item-title">{t(item.titleKey)}</h3>
                        <p className="item-description">{t(item.descriptionKey)}</p>
                      </div>
                    </div>
                    <div className="item-footer">
                      <span className="item-action">Start →</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="home-footer">
        {' '}
        ©
        <a href="https://kasnerz.github.io" target="_blank" rel="noopener noreferrer">
          {' '}
          Zdeněk Kasner
        </a>
        {' | '}
        <a href="https://ufal.mff.cuni.cz" target="_blank" rel="noopener noreferrer">
          ÚFAL MFF UK
        </a>
        {' | '}
        MIT License
      </footer>
    </div>
  );
}

export default HomePage;
