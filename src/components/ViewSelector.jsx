import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useView, VIEW_TYPES } from '../contexts/ViewContext';
import { useI18n } from '../i18n/I18nProvider';
import Icon from '@mdi/react';
import '../styles/view-selector.css';

/**
 * ViewSelector component
 * Dropdown for selecting the current view/visualization mode
 */
function ViewSelector() {
  const { currentView, setCurrentView, viewInfo } = useView();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Get all available views
  const availableViews = Object.values(VIEW_TYPES);

  // View to path mapping
  const viewToPath = {
    [VIEW_TYPES.TRAINING]: '/pretraining',
    [VIEW_TYPES.TEXT_GENERATION]: '/text-generation',
    [VIEW_TYPES.DECODING]: '/decoding-algorithms',
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleViewChange = (viewId) => {
    setCurrentView(viewId);
    const path = viewToPath[viewId];
    if (path) {
      navigate(path);
    }
    setIsOpen(false);
  };

  const currentViewInfo = viewInfo[currentView];

  return (
    <div className="view-selector" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="view-selector-button"
        aria-label={`Select view (current: ${t(currentViewInfo.labelKey) || currentViewInfo.defaultLabel})`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Icon path={currentViewInfo.icon} size={1} className="view-icon" />
        <span className="view-label">
          {t(currentViewInfo.labelKey) || currentViewInfo.defaultLabel}
        </span>
        <span className="view-chevron">▼</span>
      </button>

      {isOpen && (
        <div className="view-dropdown">
          {availableViews.map((viewId) => {
            const info = viewInfo[viewId];
            const isActive = viewId === currentView;

            return (
              <button
                key={viewId}
                onClick={() => handleViewChange(viewId)}
                className={`view-option ${isActive ? 'active' : ''}`}
                aria-current={isActive ? 'true' : 'false'}
              >
                <Icon path={info.icon} size={1} className="view-option-icon" />
                <span className="view-option-label">{t(info.labelKey) || info.defaultLabel}</span>
                {isActive && <span className="view-checkmark">✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ViewSelector;
