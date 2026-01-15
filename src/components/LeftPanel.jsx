import { useNavigate } from 'react-router-dom';
import { useView } from '../contexts/ViewContext';
import { VIEW_TYPES } from '../contexts/viewTypes';
import { useI18n } from '../i18n/I18nProvider';
import Icon from '@mdi/react';
import { mdiChevronLeft, mdiChevronRight } from '@mdi/js';
import '../styles/left-panel.css';

/**
 * LeftPanel component
 * Vertical panel with view selector buttons
 */
function LeftPanel({ isCollapsed = false, onToggleCollapse }) {
  const { currentView, setCurrentView, viewInfo } = useView();
  const { t } = useI18n();
  const navigate = useNavigate();

  // Get all available views
  const availableViews = Object.values(VIEW_TYPES);

  const handleViewChange = (viewId) => {
    setCurrentView(viewId);
    const viewToPath = {
      [VIEW_TYPES.TRAINING]: '/pretraining-model',
      [VIEW_TYPES.TEXT_GENERATION]: '/generation-model',
      [VIEW_TYPES.DECODING]: '/generation-simple',
      [VIEW_TYPES.PRETRAINING_SIMPLE]: '/pretraining-simple',
    };
    const path = viewToPath[viewId];
    if (path) navigate(path);
  };

  return (
    <div className={`left-panel ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="left-panel-content">
        {/* View buttons */}
        <div className="left-panel-views">
          {availableViews.map((viewId) => {
            const info = viewInfo[viewId];
            const isActive = viewId === currentView;

            return (
              <button
                key={viewId}
                onClick={() => handleViewChange(viewId)}
                className={`left-panel-view-button ${isActive ? 'active' : ''}`}
                aria-current={isActive ? 'true' : 'false'}
                title={t(info.labelKey) || info.defaultLabel}
              >
                <Icon path={info.icon} size={1.2} className="left-panel-view-icon" />
                {!isCollapsed && (
                  <span className="left-panel-view-label">
                    {t(info.labelKey) || info.defaultLabel}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Collapse/Expand toggle */}
        <button
          className="left-panel-toggle"
          onClick={onToggleCollapse}
          aria-label={isCollapsed ? 'Expand panel' : 'Collapse panel'}
          title={isCollapsed ? 'Expand panel' : 'Collapse panel'}
        >
          <Icon path={isCollapsed ? mdiChevronRight : mdiChevronLeft} size={0.8} />
        </button>
      </div>
    </div>
  );
}

export default LeftPanel;
