import { createContext, useContext, useState, useCallback } from 'react';
import { useApp } from './AppContext';
import { VIEW_TYPES, VIEW_INFO } from './viewTypes';

const ViewContext = createContext();

/**
 * Available view types
 */
// VIEW_TYPES and VIEW_INFO are imported from viewTypes.js to keep this file component-only

/**
 * ViewProvider component
 */
export function ViewProvider({ children, initialView = VIEW_TYPES.TEXT_GENERATION }) {
  const [currentView, setCurrentViewState] = useState(initialView);
  const { actions } = useApp();

  // Wrap setCurrentView to also reset animation state
  const setCurrentView = useCallback(
    (newView) => {
      if (newView !== currentView) {
        setCurrentViewState(newView);

        // Determine the view type for data loading
        const viewType = newView === VIEW_TYPES.TRAINING ? 'training' : 'inference';
        actions.setViewType(viewType);

        // Reset animation state when changing views
        actions.reset();
      }
    },
    [currentView, actions]
  );

  const value = {
    currentView,
    setCurrentView,
    viewInfo: VIEW_INFO,
  };

  return <ViewContext.Provider value={value}>{children}</ViewContext.Provider>;
}

/**
 * Hook to use view context
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useView() {
  const context = useContext(ViewContext);
  if (!context) {
    throw new Error('useView must be used within ViewProvider');
  }
  return context;
}
