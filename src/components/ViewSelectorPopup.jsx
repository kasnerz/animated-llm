import { useState, useRef, useEffect } from 'react';
import { useView } from '../contexts/ViewContext';
import { VIEW_TYPES } from '../contexts/viewTypes';
import { useI18n } from '../i18n/I18nProvider';
import Icon from '@mdi/react';
import { mdiChevronDown } from '@mdi/js';
import '../styles/view-selector-popup.css';

/**
 * ViewSelectorPopup component
 * Dropdown button with popup grid showing available views
 */
function ViewSelectorPopup({ showOnMobile = true }) {
  const { currentView, setCurrentView, viewInfo } = useView();
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Get all available views
  const availableViews = Object.values(VIEW_TYPES);

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
    setIsOpen(false);
  };

  const currentViewInfo = viewInfo[currentView];

  return (
    <div
      className={`view-selector-popup ${showOnMobile ? '' : 'hide-on-mobile'}`}
      ref={dropdownRef}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="view-selector-button"
        aria-label={`Select view (current: ${t(currentViewInfo.labelKey) || currentViewInfo.defaultLabel})`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Icon path={currentViewInfo.icon} size={0.9} className="view-current-icon" />
        <span className="view-current-label">
          {t(currentViewInfo.labelKey) || currentViewInfo.defaultLabel}
        </span>
        <Icon path={mdiChevronDown} size={0.8} className={`view-chevron ${isOpen ? 'open' : ''}`} />
      </button>

      {isOpen && (
        <div className="view-popup">
          <div className="view-popup-grid">
            {availableViews.map((viewId) => {
              const info = viewInfo[viewId];
              const isActive = viewId === currentView;

              return (
                <button
                  key={viewId}
                  onClick={() => handleViewChange(viewId)}
                  className={`view-grid-item ${isActive ? 'active' : ''}`}
                  aria-current={isActive ? 'true' : 'false'}
                >
                  <div className="view-grid-icon">
                    <Icon path={info.icon} size={1.5} />
                  </div>
                  <div className="view-grid-content">
                    <div className="view-grid-title">{t(info.labelKey) || info.defaultLabel}</div>
                    <div className="view-grid-description">
                      {t(info.descriptionKey) || info.defaultDescription}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default ViewSelectorPopup;
