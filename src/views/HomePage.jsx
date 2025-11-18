import { Link } from 'react-router-dom';
import { useI18n } from '../i18n/I18nProvider';
import { VIEW_INFO, VIEW_TYPES, VIEW_CATEGORIES, CATEGORY_INFO } from '../contexts/viewTypes';
import Icon from '@mdi/react';
import Logo from '../components/Logo';
import '../styles/home-page.css';

/**
 * HomePage component - Landing page with navigation grid
 */
function HomePage() {
  const { t } = useI18n();

  const categories = [
    {
      ...CATEGORY_INFO[VIEW_CATEGORIES.TRAINING],
      views: [
        {
          ...VIEW_INFO[VIEW_TYPES.TRAINING],
          path: '/pretraining',
        },
      ],
    },
    {
      ...CATEGORY_INFO[VIEW_CATEGORIES.TEXT_GENERATION],
      views: [
        {
          ...VIEW_INFO[VIEW_TYPES.TEXT_GENERATION],
          path: '/text-generation',
        },
        {
          ...VIEW_INFO[VIEW_TYPES.DECODING],
          path: '/decoding-algorithms',
        },
      ],
    },
  ];

  return (
    <div className="home-page">
      <div className="home-content">
        {/* Logo */}
        <Logo variant="home" />

        {/* Navigation Grid */}
        <div className="home-grid">
          {categories.map((category) => (
            <div key={category.id} className="home-category">
              <div className="home-category-header">
                <div className="home-category-icon">
                  <Icon path={category.icon} size={2} />
                </div>
                <h2 className="home-category-title">
                  {t(category.labelKey) || category.defaultLabel}
                </h2>
              </div>
              <div className="home-category-views">
                {category.views.map((view) => (
                  <Link key={view.id} to={view.path} className="home-view-item">
                    <Icon path={view.icon} size={1.5} className="home-view-icon" />
                    <span className="home-view-label">{t(view.labelKey) || view.defaultLabel}</span>
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
