import { useNavigate } from 'react-router-dom';
import { useView } from '../contexts/ViewContext';
import { VIEW_TYPES, VIEW_CATEGORIES, CATEGORY_INFO } from '../contexts/viewTypes';
import { useI18n } from '../i18n/I18nProvider';
import Icon from '@mdi/react';
import '../styles/view-selector-mobile.css';

/**
 * ViewSelectorMobile component
 * Simplified view selector for mobile hamburger menu - shows only Training and Text Generation
 */
function ViewSelectorMobile() {
  const { currentView, setCurrentView, viewInfo } = useView();
  const { t } = useI18n();
  const navigate = useNavigate();

  // Get main categories only (Training and Text Generation)
  const mainCategories = [
    {
      category: VIEW_CATEGORIES.TEXT_GENERATION,
      viewType: VIEW_TYPES.TEXT_GENERATION,
      path: '/generation-model',
    },
    {
      category: VIEW_CATEGORIES.TRAINING,
      viewType: VIEW_TYPES.TRAINING,
      path: '/pretraining-model',
    },
  ];

  const handleViewChange = (viewId, path) => {
    setCurrentView(viewId);
    if (path) {
      navigate(path);
    }
  };

  const currentViewInfo = viewInfo[currentView];

  return (
    <div className="view-selector-mobile">
      <div className="view-selector-mobile-title">{t('view_label')}</div>
      <div className="view-selector-mobile-list">
        {mainCategories.map(({ category, viewType, path }) => {
          const categoryInfo = CATEGORY_INFO[category];
          const isActive = currentViewInfo.category === category;

          return (
            <button
              key={category}
              onClick={() => handleViewChange(viewType, path)}
              className={`view-mobile-item ${isActive ? 'active' : ''}`}
              aria-current={isActive ? 'true' : 'false'}
            >
              <Icon path={categoryInfo.icon} size={1.2} className="view-mobile-icon" />
              <span className="view-mobile-label">
                {t(categoryInfo.labelKey) || categoryInfo.defaultLabel}
              </span>
              {isActive && <span className="view-mobile-checkmark">✓</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default ViewSelectorMobile;
