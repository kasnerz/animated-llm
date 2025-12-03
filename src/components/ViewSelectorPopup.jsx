import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useView } from '../contexts/ViewContext';
import { VIEW_TYPES } from '../contexts/viewTypes';
import { useI18n } from '../i18n/I18nProvider';
import Icon from '@mdi/react';
import { mdiChevronDown } from '@mdi/js';
import pretrainingSimpleIcon from '../assets/views/pretraining-simple-colored.png';
import pretrainingModelIcon from '../assets/views/pretraining-model-colored.png';
import decodingSimpleIcon from '../assets/views/decoding-simple-colored.png';
import decodingModelIcon from '../assets/views/decoding-model-colored.png';
import '../styles/view-selector-popup.css';

/**
 * ViewSelectorPopup component
 * Single dropdown button with popup showing all available views organized by category
 */
function ViewSelectorPopup() {
  const { currentView, setCurrentView } = useView();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Define all views organized by section
  const sections = [
    {
      id: 'generation',
      titleKey: 'home_generation_title',
      views: [
        {
          id: VIEW_TYPES.DECODING,
          titleKey: 'home_generation_simple_title',
          path: '/generation-simple',
          icon: decodingSimpleIcon,
        },
        {
          id: VIEW_TYPES.TEXT_GENERATION,
          titleKey: 'home_generation_model_title',
          path: '/generation-model',
          icon: decodingModelIcon,
        },
      ],
    },
    {
      id: 'training',
      titleKey: 'home_training_title',
      views: [
        {
          id: VIEW_TYPES.PRETRAINING_SIMPLE,
          titleKey: 'home_pretraining_simple_title',
          path: '/pretraining-simple',
          icon: pretrainingSimpleIcon,
        },
        {
          id: VIEW_TYPES.TRAINING,
          titleKey: 'home_pretraining_model_title',
          path: '/pretraining-model',
          icon: pretrainingModelIcon,
        },
      ],
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

  // Get current view label and icon for the button
  const getCurrentViewInfo = () => {
    for (const section of sections) {
      const view = section.views.find((v) => v.id === currentView);
      if (view) {
        return { label: t(view.titleKey), icon: view.icon };
      }
    }
    return { label: 'View', icon: null };
  };

  const currentViewInfo = getCurrentViewInfo();

  return (
    <div className="view-selector-popup" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="view-selector-button"
        aria-label={`Select view (current: ${currentViewInfo.label})`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {currentViewInfo.icon && (
          <img src={currentViewInfo.icon} alt="" className="view-current-icon-img" />
        )}
        <span className="view-current-label">{currentViewInfo.label}</span>
        <Icon path={mdiChevronDown} size={0.8} className={`view-chevron ${isOpen ? 'open' : ''}`} />
      </button>

      {isOpen && (
        <div className="view-popup">
          {sections.map((section) => (
            <div key={section.id} className="view-section">
              <h3 className="view-section-title">{t(section.titleKey)}</h3>
              <div className="view-section-items">
                {section.views.map((view) => {
                  const isActive = view.id === currentView;
                  return (
                    <button
                      key={view.id}
                      onClick={() => handleViewChange(view.id, view.path)}
                      className={`view-item ${isActive ? 'active' : ''}`}
                      aria-current={isActive ? 'true' : 'false'}
                    >
                      <img src={view.icon} alt="" className="view-item-icon-img" />
                      <span className="view-item-label">{t(view.titleKey)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ViewSelectorPopup;
