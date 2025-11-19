import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useI18n } from '../i18n/I18nProvider';
import { VIEW_TYPES, VIEW_INFO } from '../contexts/viewTypes';
import Icon from '@mdi/react';
import { mdiChevronDown } from '@mdi/js';
import '../styles/sub-view-selector.css';

/**
 * SubViewSelector component
 * Dropdown for switching between Model and Algorithms views within text generation
 */
function SubViewSelector() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Determine current sub-view from URL
  const currentSubView =
    location.pathname === '/decoding-algorithms' ? VIEW_TYPES.DECODING : VIEW_TYPES.TEXT_GENERATION;

  // Available sub-views
  const subViews = [
    {
      id: VIEW_TYPES.TEXT_GENERATION,
      path: '/text-generation',
      ...VIEW_INFO[VIEW_TYPES.TEXT_GENERATION],
    },
    {
      id: VIEW_TYPES.DECODING,
      path: '/decoding-algorithms',
      ...VIEW_INFO[VIEW_TYPES.DECODING],
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

  const handleSubViewChange = (viewId, path) => {
    navigate(path);
    setIsOpen(false);
  };

  const currentViewInfo = VIEW_INFO[currentSubView];

  return (
    <div className="sub-view-selector" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="sub-view-selector-button"
        aria-label={`Select sub-view (current: ${t(currentViewInfo.labelKey) || currentViewInfo.defaultLabel})`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Icon path={currentViewInfo.icon} size={0.9} className="sub-view-icon" />
        <span className="sub-view-label">
          {t(currentViewInfo.labelKey) || currentViewInfo.defaultLabel}
        </span>
        <Icon
          path={mdiChevronDown}
          size={0.8}
          className={`sub-view-chevron ${isOpen ? 'open' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="sub-view-dropdown">
          {subViews.map((view) => {
            const isActive = view.id === currentSubView;

            return (
              <button
                key={view.id}
                onClick={() => handleSubViewChange(view.id, view.path)}
                className={`sub-view-option ${isActive ? 'active' : ''}`}
                aria-current={isActive ? 'true' : 'false'}
              >
                <Icon path={view.icon} size={1.2} className="sub-view-option-icon" />
                <span className="sub-view-option-label">
                  {t(view.labelKey) || view.defaultLabel}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default SubViewSelector;
