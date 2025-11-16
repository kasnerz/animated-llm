import { useEffect, useRef, useState } from 'react';
import { AppProvider, useApp } from './contexts/AppContext';
import { I18nProvider, useI18n } from './i18n/I18nProvider';
import { ViewProvider, useView, VIEW_TYPES } from './contexts/ViewContext';
import TextGenerationView from './views/TextGenerationView';
import TrainingView from './views/TrainingView';
import DecodingView from './views/DecodingView';
import InputSection from './components/InputSection';
import KeyboardShortcutsModal from './components/KeyboardShortcutsModal';
import LanguageSelector from './components/LanguageSelector';
import ViewSelectorPopup from './components/ViewSelectorPopup';
import ViewSelectorMobile from './components/ViewSelectorMobile';
import Icon from '@mdi/react';
import { mdiKeyboard } from '@mdi/js';
import { config } from './config';
import './index.css';
import './styles/views.css';

/**
 * Inner App component with access to context
 */
function AppContent() {
  const { state, actions } = useApp();
  const { t, language, toggleLanguage } = useI18n();
  const { currentView } = useView();
  const [isKeyboardShortcutsOpen, setIsKeyboardShortcutsOpen] = useState(false);
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false);
  // Guard to avoid invoking step completion multiple times while state is catching up
  const completionGuardRef = useRef({ step: -1, sub: -1 });

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

      // ArrowRight: step forward; if playing, pause first then step
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (!state.currentExample) return;
        if (state.currentStep === 0) {
          // Start the very first step but remain paused for manual stepping
          actions.nextStep();
          actions.setIsPlaying(false);
          // Reset guard at the beginning of a new step
          completionGuardRef.current = { step: -1, sub: -1 };
          return;
        }
        // If playing, pause and then step forward
        if (state.isPlaying) {
          actions.setIsPlaying(false);
        }
        const lastSubStep = 12; // keep in sync with timeline
        if (state.currentAnimationSubStep < lastSubStep) {
          actions.nextAnimationSubStep();
          // Moving sub-steps clears any pending completion guard
          completionGuardRef.current = { step: -1, sub: -1 };
        } else {
          // Complete token manually; remain paused at next step
          const key = { step: state.currentStep, sub: state.currentAnimationSubStep };
          const last = completionGuardRef.current;
          if (last.step === key.step && last.sub === key.sub) {
            return; // already completed for this edge; ignore key repeat
          }
          completionGuardRef.current = key;
          actions.onStepAnimationComplete(false);
        }
        return;
      }

      // ArrowLeft: step backward; if playing, pause first then step
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (!state.currentExample) return;
        // If playing, pause and then step backward
        if (state.isPlaying) {
          actions.setIsPlaying(false);
        }
        actions.prevAnimationSubStep();
        return;
      }

      // N: finish current token and move to the next (repeatable)
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        if (!state.currentExample) return;
        // If playing, pause first
        if (state.isPlaying) {
          actions.setIsPlaying(false);
        }
        if (state.currentStep === 0) {
          // From initial state: start and immediately complete first token
          actions.nextStep();
          actions.onStepAnimationComplete(false);
          completionGuardRef.current = { step: -1, sub: -1 };
          return;
        }
        // Complete token manually; remain paused at next step
        const key = { step: state.currentStep, sub: state.currentAnimationSubStep };
        const last = completionGuardRef.current;
        if (last.step === key.step && last.sub === key.sub) {
          // already completed for this edge; ignore key repeat
          return;
        }
        completionGuardRef.current = key;
        actions.onStepAnimationComplete(false);
        return;
      }

      // G: skip to end of generation (all tokens)
      if (e.key === 'g' || e.key === 'G') {
        e.preventDefault();
        if (!state.currentExample) return;
        // If playing, pause first
        if (state.isPlaying) {
          actions.setIsPlaying(false);
        }
        // Skip to the very end showing all generated tokens
        actions.skipToEnd();
        completionGuardRef.current = { step: -1, sub: -1 };
        return;
      }

      // R: reset
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        actions.reset();
        return;
      }
      // T: toggle theme
      if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        actions.toggleTheme();
        return;
      }
      // L: toggle language
      if (e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        toggleLanguage(); // Now cycles through all available languages
        return;
      }
      // H or ?: show keyboard shortcuts
      if (e.key === 'h' || e.key === 'H' || e.key === '?') {
        e.preventDefault();
        setIsKeyboardShortcutsOpen(true);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [
    state.currentStep,
    state.currentExample,
    state.currentExampleId,
    state.currentAnimationSubStep,
    state.isPlaying,
    actions,
    toggleLanguage,
  ]);

  // Clear completion guard whenever step/substep changes (state advanced)
  useEffect(() => {
    completionGuardRef.current = { step: -1, sub: -1 };
  }, [state.currentStep, state.currentAnimationSubStep]);

  // Autoplay: when isPlaying is true, advance at steady pace as if pressing Space repeatedly
  useEffect(() => {
    if (!state.isPlaying) return;
    if (!state.currentExample) return;

    // Derive per-substep interval: total step duration divided by 12 substeps
    const totalSec = state.animationSpeed || 7.5; // fallback
    const perSubStepMs = Math.max(150, (totalSec / 13) * 1000);

    const lastSubStep = 12; // keep in sync with timeline

    const tick = () => {
      // If generation hasn't started yet
      if (state.currentStep === 0) {
        actions.nextStep();
        // Reset completion guard at the start of a fresh step
        completionGuardRef.current = { step: -1, sub: -1 };
        return;
      }
      if (state.currentAnimationSubStep < lastSubStep) {
        actions.nextAnimationSubStep();
        // Moving sub-steps clears any pending completion guard
        completionGuardRef.current = { step: -1, sub: -1 };
      } else {
        // Advancing due to autoplay: keep playing into the next step
        // Prevent duplicate completion calls while state updates
        const key = { step: state.currentStep, sub: state.currentAnimationSubStep };
        const last = completionGuardRef.current;
        if (last.step === key.step && last.sub === key.sub) {
          return; // already dispatched for this frame
        }
        completionGuardRef.current = key;
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
    <div className={`app-container ${isHamburgerOpen ? 'hamburger-open' : ''}`}>
      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={isKeyboardShortcutsOpen}
        onClose={() => setIsKeyboardShortcutsOpen(false)}
      />

      {/* Floating top section */}
      <div className="floating-top-section">
        <div className="floating-top-content">
          {/* Logo on the very left */}
          <div className="app-logo">
            <div className="logo-icon">
              {/* Small square placeholder for logo */}
              <div className="logo-square"></div> <div className="logo-text">&nbsp;HelloLLM</div>
            </div>
            <ViewSelectorPopup showOnMobile={false} />
          </div>

          {/* View-specific content (input section or placeholder) */}
          {renderViewTopContent()}

          {/* Header controls - minimal */}
          <div className={`header-controls ${isHamburgerOpen ? 'open' : ''}`}>
            <button
              className="hamburger-toggle"
              onClick={() => {
                setIsHamburgerOpen(!isHamburgerOpen);
              }}
              aria-label="Menu"
            >
              ☰
            </button>
            <div className="header-controls-list">
              <ViewSelectorMobile />
              <button
                onClick={() => setIsKeyboardShortcutsOpen(true)}
                className="menu-item-with-label"
                title={t('keyboard_shortcuts')}
                aria-label={t('keyboard_shortcuts')}
              >
                <Icon path={mdiKeyboard} size={1.2} color="#555" />
                <span className="menu-label">{t('keyboard_shortcuts')}</span>
              </button>
              <button
                onClick={actions.toggleTheme}
                className="menu-item-with-label"
                title={t('toggle_dark_light_mode')}
                aria-label={t('toggle_dark_light_mode')}
              >
                <span className="theme-icon">{state.theme === 'dark' ? '☀️' : '🌙'}</span>
                <span className="menu-label">{t('toggle_dark_light_mode')}</span>
              </button>
              <div
                className="language-menu-wrapper"
                onClick={(e) => {
                  // Only trigger if clicking the wrapper itself or the label, not the dropdown or its contents
                  if (!e.target.closest('.language-selector')) {
                    const button = e.currentTarget.querySelector('.language-button');
                    if (button) {
                      button.click();
                    }
                  }
                }}
              >
                <LanguageSelector />
                <span className="menu-label">{t('language')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content - render current view */}
      <main className="app-main">{renderCurrentView()}</main>

      {/* Bottom section is now handled by individual views */}
    </div>
  );

  /**
   * Render the top panel content based on current view
   */
  function renderViewTopContent() {
    switch (currentView) {
      case VIEW_TYPES.TEXT_GENERATION:
      case VIEW_TYPES.DECODING:
        // These views show the input section
        return (
          <div className="top-panel-input">
            <InputSection />
          </div>
        );
      case VIEW_TYPES.TRAINING:
        // Training view has blank space (will be modified later)
        return (
          <div className="top-panel-input">
            <div className="training-top-placeholder">
              {/* Reserved for future training-specific controls */}
            </div>
          </div>
        );
      default:
        return null;
    }
  }

  /**
   * Render the current view component
   */
  function renderCurrentView() {
    switch (currentView) {
      case VIEW_TYPES.TEXT_GENERATION:
        return <TextGenerationView />;
      case VIEW_TYPES.TRAINING:
        return <TrainingView />;
      case VIEW_TYPES.DECODING:
        return <DecodingView />;
      default:
        return <TextGenerationView />;
    }
  }
}

/**
 * Root App component wrapped with providers
 */
function App() {
  return (
    <AppProvider>
      <I18nProvider initialLanguage={config.defaults.language}>
        <ViewProvider initialView={VIEW_TYPES.TEXT_GENERATION}>
          <AppContent />
        </ViewProvider>
      </I18nProvider>
    </AppProvider>
  );
}

export default App;
