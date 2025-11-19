import { Link } from 'react-router-dom';
import { useI18n } from '../i18n/I18nProvider';
import { CATEGORY_INFO, VIEW_CATEGORIES } from '../contexts/viewTypes';
import Icon from '@mdi/react';
import Logo from '../components/Logo';
import '../styles/home-page.css';

/**
 * HomePage component - Landing page with two main navigation buttons
 */
function HomePage() {
  const { t } = useI18n();

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
