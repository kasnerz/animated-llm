import { createContext, useContext, useState } from 'react';
import { mdiTextBoxEditOutline, mdiAbacus, mdiCogPlay } from '@mdi/js';

const ViewContext = createContext();

/**
 * Available view types
 */
export const VIEW_TYPES = {
  TEXT_GENERATION: 'text-generation',
  TRAINING: 'training',
  DECODING: 'decoding',
};

/**
 * View metadata
 */
export const VIEW_INFO = {
  [VIEW_TYPES.TEXT_GENERATION]: {
    id: VIEW_TYPES.TEXT_GENERATION,
    icon: mdiTextBoxEditOutline,
    labelKey: 'view_text_generation',
    defaultLabel: 'Text generation',
  },
  [VIEW_TYPES.TRAINING]: {
    id: VIEW_TYPES.TRAINING,
    icon: mdiAbacus,
    labelKey: 'view_training',
    defaultLabel: 'Training',
  },
  [VIEW_TYPES.DECODING]: {
    id: VIEW_TYPES.DECODING,
    icon: mdiCogPlay,
    labelKey: 'view_decoding',
    defaultLabel: 'Decoding algorithms',
  },
};

/**
 * ViewProvider component
 */
export function ViewProvider({ children, initialView = VIEW_TYPES.TEXT_GENERATION }) {
  const [currentView, setCurrentView] = useState(initialView);

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
export function useView() {
  const context = useContext(ViewContext);
  if (!context) {
    throw new Error('useView must be used within ViewProvider');
  }
  return context;
}
