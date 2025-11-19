import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useView } from '../contexts/ViewContext';
import { VIEW_TYPES, VIEW_CATEGORIES, CATEGORY_INFO, VIEW_INFO } from '../contexts/viewTypes';
import { useI18n } from '../i18n/I18nProvider';
import Icon from '@mdi/react';
import { mdiChevronDown } from '@mdi/js';
import SubViewSelector from './SubViewSelector';
import '../styles/view-selector-popup.css';

/**
 * ViewSelectorPopup component
 * Dropdown button with popup grid showing available main categories
 * Plus SubViewSelector for text generation views
 */
function ViewSelectorPopup() {
  const { currentView, setCurrentView, viewInfo } = useView();
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Get main categories only
  const mainCategories = [
    {
      category: VIEW_CATEGORIES.TRAINING,
      viewType: VIEW_TYPES.TRAINING,
      path: '/pretraining',
    },
    {
      category: VIEW_CATEGORIES.TEXT_GENERATION,
      viewType: VIEW_TYPES.TEXT_GENERATION,
      path: '/text-generation',
    },
  ];

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

  const handleViewChange = (viewId, path) => {
    setCurrentView(viewId);
    if (path) {
      navigate(path);
    }
    setIsOpen(false);
  };

  const currentViewInfo = viewInfo[currentView];
  const currentCategoryInfo = CATEGORY_INFO[currentViewInfo.category];

  // Check if we're in text generation views
  const isTextGenerationView =
    location.pathname === '/text-generation' || location.pathname === '/decoding-algorithms';

  return (
    <div className="view-selector-popup-container">
      <div className="view-selector-popup" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="view-selector-button"
          aria-label={`Select view (current: ${t(currentCategoryInfo.labelKey) || currentCategoryInfo.defaultLabel})`}
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          <Icon path={currentCategoryInfo.icon} size={0.9} className="view-current-icon" />
          <span className="view-current-label">
            {t(currentCategoryInfo.labelKey) || currentCategoryInfo.defaultLabel}
          </span>
          <Icon
            path={mdiChevronDown}
            size={0.8}
            className={`view-chevron ${isOpen ? 'open' : ''}`}
          />
        </button>

        {isOpen && (
          <div className="view-popup">
            <div className="view-popup-grid">
              {mainCategories.map(({ category, viewType, path }) => {
                const categoryInfo = CATEGORY_INFO[category];
                const isActive = currentViewInfo.category === category;

                return (
                  <button
                    key={category}
                    onClick={() => handleViewChange(viewType, path)}
                    className={`view-grid-item ${isActive ? 'active' : ''}`}
                    aria-current={isActive ? 'true' : 'false'}
                  >
                    <Icon path={categoryInfo.icon} size={1.2} className="view-grid-icon" />
                    <span className="view-grid-title">
                      {t(categoryInfo.labelKey) || categoryInfo.defaultLabel}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* SubViewSelector for text generation views */}
      {isTextGenerationView && <SubViewSelector />}
    </div>
  );
}

export default ViewSelectorPopup;
