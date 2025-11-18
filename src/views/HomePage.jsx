import { Link } from 'react-router-dom';
import { useI18n } from '../i18n/I18nProvider';
import { VIEW_INFO, VIEW_TYPES } from '../contexts/viewTypes';
import Icon from '@mdi/react';
import '../styles/home-page.css';

/**
 * HomePage component - Landing page with navigation grid
 */
function HomePage() {
  const { t } = useI18n();

  const views = [
    {
      ...VIEW_INFO[VIEW_TYPES.TRAINING],
      path: '/pretraining',
    },
    {
      ...VIEW_INFO[VIEW_TYPES.TEXT_GENERATION],
      path: '/text-generation',
    },
    {
      ...VIEW_INFO[VIEW_TYPES.DECODING],
      path: '/decoding-algorithms',
    },
  ];

  return (
    <div className="home-page">
      <div className="home-content">
        {/* Logo */}
        <div className="home-logo">
          <div className="home-logo-square"></div>
          <h1 className="home-logo-text">HelloLLM</h1>
        </div>

        {/* Subtitle */}
        <p className="home-subtitle">{t('home_subtitle') || 'Interactive LLM Visualizations'}</p>

        {/* Navigation Grid */}
        <div className="home-grid">
          {views.map((view) => (
            <Link key={view.id} to={view.path} className="home-card">
              <div className="home-card-icon">
                <Icon path={view.icon} size={2} />
              </div>
              <h2 className="home-card-title">{t(view.labelKey) || view.defaultLabel}</h2>
              <p className="home-card-description">
                {t(view.descriptionKey) || view.defaultDescription}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default HomePage;
