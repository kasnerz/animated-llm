import { useNavigate } from 'react-router-dom';
import { useView } from '../contexts/ViewContext';
import { VIEW_TYPES } from '../contexts/viewTypes';
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

  // Get all available views
  const availableViews = Object.values(VIEW_TYPES);

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
        {availableViews.map((viewId) => {
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
              <span className="view-mobile-label">{t(info.labelKey) || info.defaultLabel}</span>
              {isActive && <span className="view-mobile-checkmark">✓</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default ViewSelectorMobile;
