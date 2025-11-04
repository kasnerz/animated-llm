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

  // Handle keyboard shortcuts (Play/Pause and stepping)
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!e || e.target.matches('input, textarea')) return;

      // Space: toggle Play/Pause
      if (e.code === 'Space') {
        e.preventDefault();
        if (!state.currentExample) return;
        // Start from beginning if needed
        if (state.currentStep === 0) {
          actions.nextStep();
          actions.setIsPlaying(true);
          return;
        }
        actions.setIsPlaying(!state.isPlaying);
        return;
      }

      // ArrowRight: step forward when paused; holding should not force play mode
      if (e.code === 'ArrowRight') {
        e.preventDefault();
        if (!state.currentExample) return;
        if (state.currentStep === 0) {
          // Start the very first step but remain paused for manual stepping
          actions.nextStep();
          actions.setIsPlaying(false);
          return;
        }
        if (!state.isPlaying) {
          const lastSubStep = 10;
          if (state.currentAnimationSubStep < lastSubStep) {
            actions.nextAnimationSubStep();
          } else {
            // Complete token manually; remain paused at next step
            actions.onStepAnimationComplete(false);
          }
        }
        return;
      }

      // ArrowLeft: step backward when paused
      if (e.code === 'ArrowLeft') {
        e.preventDefault();
        if (!state.currentExample) return;
        if (!state.isPlaying) {
          actions.prevAnimationSubStep();
        }
        return;
      }

      // R: reset
      if (e.code === 'KeyR') {
        e.preventDefault();
        actions.reset();
        return;
      }
      // T: toggle theme
      if (e.code === 'KeyT' && e.ctrlKey) {
        e.preventDefault();
        actions.toggleTheme();
        return;
      }
      // L: toggle language
      if (e.code === 'KeyL' && e.ctrlKey) {
        e.preventDefault();
        toggleLanguage();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [
    state.currentStep,
    state.currentExample,
    state.currentAnimationSubStep,
    state.isPlaying,
    actions,
    toggleLanguage,
  ]);

  // Autoplay: when isPlaying is true, advance at steady pace as if pressing Space repeatedly
  useEffect(() => {
    if (!state.isPlaying) return;
    if (!state.currentExample) return;

    // Derive per-substep interval: total step duration divided by 12 substeps
    const totalSec = state.animationSpeed || 7.5; // fallback
    const perSubStepMs = Math.max(150, (totalSec / 12) * 1000);

    const lastSubStep = 10; // keep in sync with timeline

    const tick = () => {
      // If generation hasn't started yet
      if (state.currentStep === 0) {
        actions.nextStep();
        return;
      }
      if (state.currentAnimationSubStep < lastSubStep) {
        actions.nextAnimationSubStep();
      } else {
        // Advancing due to autoplay: keep playing into the next step
        actions.onStepAnimationComplete(true);
      }
    };

    const id = setInterval(tick, perSubStepMs);
    return () => clearInterval(id);
  }, [
    state.isPlaying,
    state.currentExample,
    state.currentStep,
    state.currentAnimationSubStep,
    state.animationSpeed,
    actions,
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
