import { useEffect } from 'react';
import { AppProvider, useApp } from './contexts/AppContext';
import { useTranslation } from './utils/i18n';
import InputSection from './components/InputSection';
import GeneratedAnswer from './components/GeneratedAnswer';
import VisualizationCanvas from './components/VisualizationCanvas';
import './index.css';

/**
 * Inner App component with access to context
 */
function AppContent() {
  const { state, actions } = useApp();
  const { t } = useTranslation();

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Space: advance to next animation sub-step
      if (e.code === 'Space' && !e.target.matches('input, textarea')) {
        e.preventDefault();
        if (state.currentStep > 0) {
          actions.nextAnimationSubStep();
        }
      }
      // R: reset
      if (e.code === 'KeyR' && !e.target.matches('input, textarea')) {
        e.preventDefault();
        actions.reset();
      }
      // T: toggle theme
      if (e.code === 'KeyT' && e.ctrlKey) {
        e.preventDefault();
        actions.toggleTheme();
      }
      // L: toggle language
      if (e.code === 'KeyL' && e.ctrlKey) {
        e.preventDefault();
        actions.toggleLanguage();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [state.currentStep, actions]);

  // Loading state
  if (state.isLoading && !state.currentExample) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>{t('loading')}</p>
      </div>
    );
  }

  // Error state
  if (state.error) {
    return (
      <div className="error-container">
        <h2>{t('error')}</h2>
        <p>{state.error}</p>
        <button onClick={actions.loadExamples}>
          {t('retry')}
        </button>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Header controls - minimal */}
      <div className="header-controls">
        <button
          onClick={actions.toggleTheme}
          className="icon-button-minimal"
          title={t('toggle_theme')}
          aria-label={t('toggle_theme')}
        >
          {state.theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <button
          onClick={actions.toggleLanguage}
          className="icon-button-minimal"
          title={t('toggle_language')}
          aria-label={t('toggle_language')}
        >
          {state.language === 'en' ? '🇬🇧' : '🇨🇿'}
        </button>
      </div>

      {/* Main content */}
      <main className="app-main">
        {/* Input section */}
        <InputSection />

        {/* Generated answer area: only after generation starts */}
        {state.currentExample && state.currentStep > 0 && (
          <GeneratedAnswer />
        )}

        {/* Visualization canvas */}
        {state.currentExample && (
          <VisualizationCanvas />
        )}
      </main>
    </div>
  );
}

/**
 * Root App component wrapped with provider
 */
function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
