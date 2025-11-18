import { useNavigate } from 'react-router-dom';
import { useView } from '../contexts/ViewContext';
import { VIEW_TYPES, VIEW_CATEGORIES, CATEGORY_INFO } from '../contexts/viewTypes';
import { useI18n } from '../i18n/I18nProvider';
import Icon from '@mdi/react';
import '../styles/view-selector-mobile.css';

/**
 * ViewSelectorMobile component
 * Simplified view selector for mobile hamburger menu
 */
function ViewSelectorMobile() {
  const { currentView, setCurrentView, viewInfo } = useView();
  const { t } = useI18n();
  const navigate = useNavigate();

  // Get all available views grouped by category
  const viewsByCategory = {
    [VIEW_CATEGORIES.TRAINING]: [VIEW_TYPES.TRAINING],
    [VIEW_CATEGORIES.TEXT_GENERATION]: [VIEW_TYPES.TEXT_GENERATION, VIEW_TYPES.DECODING],
  };

  // View to path mapping
  const viewToPath = {
    [VIEW_TYPES.TRAINING]: '/pretraining',
    [VIEW_TYPES.TEXT_GENERATION]: '/text-generation',
    [VIEW_TYPES.DECODING]: '/decoding-algorithms',
  };

  const handleViewChange = (viewId) => {
    setCurrentView(viewId);
    const path = viewToPath[viewId];
    if (path) {
      navigate(path);
    }
  };

  return (
    <div className="view-selector-mobile">
      <div className="view-selector-mobile-title">{t('view_label')}</div>
      <div className="view-selector-mobile-list">
        {Object.entries(viewsByCategory).map(([categoryId, viewIds]) => {
          const categoryInfo = CATEGORY_INFO[categoryId];

          return (
            <div key={categoryId} className="view-mobile-category">
              <div className="view-mobile-category-header">
                <Icon path={categoryInfo.icon} size={1} className="view-mobile-category-icon" />
                <span className="view-mobile-category-label">
                  {t(categoryInfo.labelKey) || categoryInfo.defaultLabel}
                </span>
              </div>
              <div className="view-mobile-category-items">
                {viewIds.map((viewId) => {
                  const info = viewInfo[viewId];
                  const isActive = viewId === currentView;

                  return (
                    <button
                      key={viewId}
                      onClick={() => handleViewChange(viewId)}
                      className={`view-mobile-item ${isActive ? 'active' : ''}`}
                      aria-current={isActive ? 'true' : 'false'}
                    >
                      <Icon path={info.icon} size={1.2} className="view-mobile-icon" />
                      <span className="view-mobile-label">
                        {t(info.labelKey) || info.defaultLabel}
                      </span>
                      {isActive && <span className="view-mobile-checkmark">✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ViewSelectorMobile;
