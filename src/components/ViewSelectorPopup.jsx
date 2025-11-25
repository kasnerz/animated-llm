import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useView } from '../contexts/ViewContext';
import { VIEW_TYPES } from '../contexts/viewTypes';
import { useI18n } from '../i18n/I18nProvider';
import Icon from '@mdi/react';
import { mdiChevronDown, mdiWeightLifter, mdiDumbbell, mdiForumOutline, mdiDrawPen } from '@mdi/js';
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
      id: 'training',
      titleKey: 'home_training_title',
      views: [
        {
          id: VIEW_TYPES.TRAINING,
          titleKey: 'home_pretraining_model_title',
          path: '/pretraining-model',
          icon: mdiWeightLifter,
        },
        {
          id: VIEW_TYPES.PRETRAINING_SIMPLE,
          titleKey: 'home_pretraining_simple_title',
          path: '/pretraining-simple',
          icon: mdiDumbbell,
        },
      ],
    },
    {
      id: 'generation',
      titleKey: 'home_generation_title',
      views: [
        {
          id: VIEW_TYPES.TEXT_GENERATION,
          titleKey: 'home_generation_model_title',
          path: '/generation-model',
          icon: mdiForumOutline,
        },
        {
          id: VIEW_TYPES.DECODING,
          titleKey: 'home_generation_simple_title',
          path: '/generation-simple',
          icon: mdiDrawPen,
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
          <Icon path={currentViewInfo.icon} size={0.9} className="view-current-icon" />
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
                      <Icon path={view.icon} size={1} className="view-item-icon-svg" />
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
