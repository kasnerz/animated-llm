import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useView } from '../contexts/ViewContext';
import { VIEW_TYPES, VIEW_CATEGORIES, CATEGORY_INFO } from '../contexts/viewTypes';
import { useI18n } from '../i18n/I18nProvider';
import Icon from '@mdi/react';
import { mdiChevronDown } from '@mdi/js';
import '../styles/view-selector-popup.css';

/**
 * ViewSelectorPopup component
 * Dropdown button with popup grid showing available views
 */
function ViewSelectorPopup() {
  const { currentView, setCurrentView, viewInfo } = useView();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

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
  const currentCategoryInfo = CATEGORY_INFO[currentViewInfo.category];

  return (
    <div className="view-selector-popup" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="view-selector-button"
        aria-label={`Select view (current: ${t(currentViewInfo.labelKey) || currentViewInfo.defaultLabel})`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Icon path={currentViewInfo.icon} size={0.9} className="view-current-icon" />
        <span className="view-current-label">
          {t(currentCategoryInfo.labelKey) || currentCategoryInfo.defaultLabel}
          <span className="view-separator"> › </span>
          {t(currentViewInfo.labelKey) || currentViewInfo.defaultLabel}
        </span>
        <Icon path={mdiChevronDown} size={0.8} className={`view-chevron ${isOpen ? 'open' : ''}`} />
      </button>

      {isOpen && (
        <div className="view-popup">
          <div className="view-popup-grid">
            {Object.entries(viewsByCategory).map(([categoryId, viewIds]) => {
              const categoryInfo = CATEGORY_INFO[categoryId];

              return (
                <div key={categoryId} className="view-popup-category">
                  <div className="view-popup-category-header">
                    <Icon
                      path={categoryInfo.icon}
                      size={1.2}
                      className="view-popup-category-icon"
                    />
                    <span className="view-popup-category-label">
                      {t(categoryInfo.labelKey) || categoryInfo.defaultLabel}
                    </span>
                  </div>
                  <div className="view-popup-category-items">
                    {viewIds.map((viewId) => {
                      const info = viewInfo[viewId];
                      const isActive = viewId === currentView;

                      return (
                        <button
                          key={viewId}
                          onClick={() => handleViewChange(viewId)}
                          className={`view-grid-item ${isActive ? 'active' : ''}`}
                          aria-current={isActive ? 'true' : 'false'}
                        >
                          <Icon path={info.icon} size={1.2} className="view-grid-icon" />
                          <span className="view-grid-title">
                            {t(info.labelKey) || info.defaultLabel}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default ViewSelectorPopup;
