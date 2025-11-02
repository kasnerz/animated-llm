import { useEffect } from 'react';
import { AppProvider, useApp } from './contexts/AppContext';
import { I18nProvider, useI18n } from './i18n/I18nProvider';
import InputSection from './components/InputSection';
import GeneratedAnswer from './components/GeneratedAnswer';
import VisualizationCanvas from './components/VisualizationCanvas';
import './index.css';

/**
 * Inner App component with access to context
 */
function AppContent() {
  const { state, actions } = useApp();
  const { t, language, toggleLanguage } = useI18n();

  // Sync language changes from i18n to app context
  useEffect(() => {
    if (state.language !== language) {
      actions.setLanguage(language);
    }
  }, [language, state.language, actions]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Space: advance to next animation sub-step
      if (e.code === 'Space' && !e.target.matches('input, textarea')) {
        e.preventDefault();
        // If no example loaded, nothing to do
        if (!state.currentExample) return;

        // If generation hasn't started yet, start first step
        if (state.currentStep === 0) {
          actions.nextStep();
          return;
        }

        // Advance through sub-steps; if already at final sub-step, finalize the step
        const lastSubStep = 9; // keep in sync with animation timeline
        if (state.currentAnimationSubStep < lastSubStep) {
          actions.nextAnimationSubStep();
        } else {
          // Commit the selected token and move to next step
          actions.onStepAnimationComplete();
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
        toggleLanguage();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [
    state.currentStep,
    state.currentExample,
    state.currentAnimationSubStep,
    actions,
    toggleLanguage,
  ]);

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
        <button onClick={actions.loadExamples}>{t('retry')}</button>
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
          onClick={toggleLanguage}
          className="icon-button-minimal"
          title={t('toggle_language')}
          aria-label={t('toggle_language')}
        >
          {language === 'en' ? '🇬🇧' : '🇨🇿'}
        </button>
      </div>

      {/* Floating top section */}
      <div className="floating-top-section">
        {/* Input section */}
        <InputSection />
      </div>

      {/* Main content */}
      <main className="app-main">
        {/* Visualization canvas */}
        {state.currentExample && <VisualizationCanvas />}
      </main>

      {/* Floating bottom section - only after generation starts */}
      {state.currentExample && state.currentStep > 0 && (
        <div className="floating-bottom-section">
          <GeneratedAnswer />
        </div>
      )}
    </div>
  );
}

/**
 * Root App component wrapped with providers
 */
function App() {
  return (
    <AppProvider>
      <I18nProvider initialLanguage="en">
        <AppContent />
      </I18nProvider>
    </AppProvider>
  );
}

export default App;
