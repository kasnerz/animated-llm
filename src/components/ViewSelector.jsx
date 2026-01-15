import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useView } from '../contexts/ViewContext';
import { VIEW_TYPES, VIEW_CATEGORIES, CATEGORY_INFO } from '../contexts/viewTypes';
import { useI18n } from '../i18n/I18nProvider';
import Icon from '@mdi/react';
import '../styles/view-selector.css';

/**
 * ViewSelector component
 * Dropdown for selecting between Training and Text Generation categories
 */
function ViewSelector() {
  const { currentView, setCurrentView, viewInfo } = useView();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

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

  return (
    <div className="view-selector" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="view-selector-button"
        aria-label={`Select view (current: ${t(currentCategoryInfo.labelKey) || currentCategoryInfo.defaultLabel})`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Icon path={currentCategoryInfo.icon} size={1} className="view-icon" />
        <span className="view-label">
          {t(currentCategoryInfo.labelKey) || currentCategoryInfo.defaultLabel}
        </span>
        <span className="view-chevron">▼</span>
      </button>

      {isOpen && (
        <div className="view-dropdown">
          {mainCategories.map(({ category, viewType, path }) => {
            const categoryInfo = CATEGORY_INFO[category];
            const isActive = currentViewInfo.category === category;

            return (
              <button
                key={category}
                onClick={() => handleViewChange(viewType, path)}
                className={`view-option ${isActive ? 'active' : ''}`}
                aria-current={isActive ? 'true' : 'false'}
              >
                <Icon path={categoryInfo.icon} size={0.9} className="view-option-icon" />
                <span className="view-option-label">
                  {t(categoryInfo.labelKey) || categoryInfo.defaultLabel}
                </span>
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
