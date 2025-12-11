import { useEffect, useRef, useState } from 'react';
import { Routes, Route, useLocation, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { AppProvider, useApp } from './contexts/AppContext';
import { I18nProvider, useI18n } from './i18n/I18nProvider';
import { ViewProvider, useView } from './contexts/ViewContext';
import { VIEW_TYPES } from './contexts/viewTypes';
import HomePage from './views/HomePage';
import GenerationModelView from './views/GenerationModelView';
import PretrainingModelView from './views/PretrainingModelView';
import GenerationSimpleView from './views/GenerationSimpleView';
import PretrainingSimpleView from './views/PretrainingSimpleView';
import InputSection from './components/InputSection';
import KeyboardShortcutsModal from './components/KeyboardShortcutsModal';
import AboutModal from './components/AboutModal';
import LanguageSelector from './components/LanguageSelector';
import ViewSelectorPopup from './components/ViewSelectorPopup';
import Logo from './components/Logo';
import Icon from '@mdi/react';
import { mdiKeyboard, mdiInformationOutline } from '@mdi/js';
import { TRAINING_STEPS, TEXT_GEN_STEPS } from './visualization/core/constants';
import githubMark from './assets/github-mark.png';
import logoSmall from './assets/logo-small.png';
import './index.css';
import './styles/views.css';

/**
 * Inner App component with access to context
 */
function AppContent() {
  const { state, actions } = useApp();
  const { t, language, toggleLanguage } = useI18n();
  const { currentView, setCurrentView } = useView();
  const location = useLocation();
  const [isKeyboardShortcutsOpen, setIsKeyboardShortcutsOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false);
  // Guard to avoid invoking step completion multiple times while state is catching up
  const completionGuardRef = useRef({ step: -1, sub: -1 });

  // Sync view from URL to context
  useEffect(() => {
    const pathToView = {
      '/pretraining-model': VIEW_TYPES.TRAINING,
      '/generation-model': VIEW_TYPES.TEXT_GENERATION,
      '/generation-simple': VIEW_TYPES.DECODING,
      '/pretraining-simple': VIEW_TYPES.PRETRAINING_SIMPLE,
    };

    const viewFromPath = pathToView[location.pathname];
    if (viewFromPath && viewFromPath !== currentView) {
      setCurrentView(viewFromPath);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, currentView]);

  // Note: We intentionally avoid syncing context -> URL here to prevent race conditions
  // when deep-linking. Navigation is handled explicitly in view selectors.

  // Sync language changes from i18n to app context
  useEffect(() => {
    if (state.language !== language) {
      actions.setLanguage(language);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, state.language]);

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
        const lastSubStep =
          state.viewType === 'training'
            ? TRAINING_STEPS.BACKPROP_EMBEDDING
            : TEXT_GEN_STEPS.PREVIEW;
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
    state.viewType,
    actions,
    toggleLanguage,
  ]);

  // Clear completion guard whenever step/substep changes (state advanced)
  useEffect(() => {
    completionGuardRef.current = { step: -1, sub: -1 };
  }, [state.currentStep, state.currentAnimationSubStep]);

  // When navigating to the home page, reset any running animation state
  // so that returning to a view starts from the beginning.
  useEffect(() => {
    if (location.pathname === '/') {
      actions.reset();
    }
  }, [location.pathname, actions]);

  // Autoplay: when isPlaying is true, advance at steady pace as if pressing Space repeatedly
  useEffect(() => {
    if (!state.isPlaying) return;
    if (!state.currentExample) return;

    // Derive per-substep interval: total step duration divided by number of substeps
    const totalSec = state.animationSpeed || 7.5; // fallback
    const lastSubStep =
      state.viewType === 'training' ? TRAINING_STEPS.BACKPROP_EMBEDDING : TEXT_GEN_STEPS.PREVIEW;
    const perSubStepMs = Math.max(150, (totalSec / (lastSubStep + 1)) * 1000);

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
    state.viewType,
    actions,
  ]);

  // Loading state
  if (state.isLoading && !state.currentExample && location.pathname !== '/') {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>{t('loading')}</p>
      </div>
    );
  }

  // Error state
  if (state.error && location.pathname !== '/') {
    return (
      <div className="error-container">
        <h2>{t('error')}</h2>
        <p>{state.error}</p>
        <button onClick={actions.loadExamples}>{t('retry')}</button>
      </div>
    );
  }

  // Check if we're on the home page
  const isHomePage = location.pathname === '/';

  return (
    <div className={`app-container ${isHamburgerOpen ? 'hamburger-open' : ''}`}>
      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={isKeyboardShortcutsOpen}
        onClose={() => setIsKeyboardShortcutsOpen(false)}
      />

      {/* About Modal */}
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />

      {/* Floating top section - only show on non-home pages */}
      {!isHomePage && (
        <header className="floating-top-section">
          <div className="floating-top-content">
            {/* Logo on the left (mobile only) */}
            <div className="app-logo">
              <Link to="/" className="logo-icon">
                <Logo variant="header" />
              </Link>
            </div>

            {/* View selector next to logo */}
            <div className="view-selector-popup-container">
              <ViewSelectorPopup />
            </div>

            {/* Centered logo button (desktop only) */}
            <Link to="/" className="logo-center-button">
              <img src={logoSmall} alt="AnimatedLLM" />
            </Link>

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
                <button
                  onClick={() => setIsKeyboardShortcutsOpen(true)}
                  className="menu-item-with-label"
                  title={t('keyboard_shortcuts')}
                  aria-label={t('keyboard_shortcuts')}
                >
                  <div className="menu-icon-container">
                    <Icon path={mdiKeyboard} size={1.2} className="header-icon" />
                  </div>
                  <span className="menu-label">{t('keyboard_shortcuts')}</span>
                </button>
                <button
                  onClick={actions.toggleTheme}
                  className="menu-item-with-label"
                  title={t('toggle_dark_light_mode')}
                  aria-label={t('toggle_dark_light_mode')}
                >
                  <div className="menu-icon-container">
                    <span className="theme-icon">{state.theme === 'dark' ? '☀️' : '🌙'}</span>
                  </div>
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
                  <div className="menu-icon-container">
                    <LanguageSelector />
                  </div>
                  <span className="menu-label">{t('language')}</span>
                </div>
                <a
                  href="https://github.com/kasnerz/animated-llm"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="menu-item-with-label"
                  title="GitHub"
                  aria-label="GitHub"
                >
                  <div className="menu-icon-container">
                    <img src={githubMark} alt="GitHub" className="github-icon" />
                  </div>
                  <span className="menu-label">GitHub</span>
                </a>
                <button
                  onClick={() => setIsAboutOpen(true)}
                  className="menu-item-with-label"
                  title={t('about')}
                  aria-label={t('about')}
                >
                  <div className="menu-icon-container">
                    <Icon path={mdiInformationOutline} size={1.2} className="header-icon" />
                  </div>
                  <span className="menu-label">{t('about')}</span>
                </button>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Main content - render routes */}
      <main className={`app-main ${isHomePage ? 'home-layout' : ''}`}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/generation-model" element={<GenerationModelView />} />
          <Route path="/pretraining-model" element={<PretrainingModelView />} />
          <Route path="/generation-simple" element={<GenerationSimpleView />} />
          <Route path="/pretraining-simple" element={<PretrainingSimpleView />} />
        </Routes>
      </main>

      {/* Bottom section is now handled by individual views */}
    </div>
  );
}

/**
 * Root App component wrapped with providers
 */
function App() {
  // Determine initial view from current URL path
  const getInitialViewFromPath = () => {
    const path = window.location.pathname;
    // Use Vite's BASE_URL so this works both in dev ("/") and production (may be '/animated-llm/')
    const rawBase = import.meta.env.BASE_URL || '/';
    // Trim trailing slash for comparison (so '/' -> '')
    const trimmedBase = rawBase.endsWith('/') ? rawBase.slice(0, -1) : rawBase;
    const cleanPath =
      trimmedBase && path.startsWith(trimmedBase) ? path.slice(trimmedBase.length) : path;

    const pathToView = {
      '/pretraining-model': VIEW_TYPES.TRAINING,
      '/generation-model': VIEW_TYPES.TEXT_GENERATION,
      '/generation-simple': VIEW_TYPES.DECODING,
      '/pretraining-simple': VIEW_TYPES.PRETRAINING_SIMPLE,
    };

    return pathToView[cleanPath] || VIEW_TYPES.TEXT_GENERATION;
  };

  const initialView = getInitialViewFromPath();
  // Map view to viewType for AppProvider
  const TRAINING_VIEWS = new Set([VIEW_TYPES.TRAINING, VIEW_TYPES.PRETRAINING_SIMPLE]);
  const initialViewType = TRAINING_VIEWS.has(initialView) ? 'training' : 'inference';

  return (
    <AppProvider initialViewType={initialViewType}>
      <I18nProvider>
        <ViewProvider initialView={initialView}>
          <AppContent />
        </ViewProvider>
      </I18nProvider>
    </AppProvider>
  );
}

export default App;
