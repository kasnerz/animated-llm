import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import config from '../config';
import * as examplesApi from '../services/examplesApi';

const AppContext = createContext();

/**
 * App Context Provider
 * Manages global application state including theme, language, examples, and animation
 */
export function AppProvider({ children }) {
  const [state, setState] = useState({
    // Example data
    examples: [],
    currentExampleId: null,
    currentExample: null,
    currentStep: 0,
    currentAnimationSubStep: 0, // Track which part of the animation to show
    generatedAnswer: '',
    autoGenerate: false,

    // UI settings
    theme: config.defaults.theme,
    language: config.defaults.language,
    animationSpeed: config.defaults.animationSpeed,

    // Animation state
    isPlaying: false,
    isPaused: false,

    // Loading state
    isLoading: false,
    error: null,
  });

  /**
   * Load all examples from examples.json
   */
  const loadExamples = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      const examples = await examplesApi.listExamples();
      setState((prev) => ({
        ...prev,
        examples,
        isLoading: false,
      }));

      // Load first example by default
      if (examples.length > 0) {
        loadExample(examples[0].id);
      }
    } catch (error) {
      console.error('Error loading examples:', error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error.message,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Load a specific example by ID
   */
  const loadExample = useCallback(async (exampleId) => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      const data = await examplesApi.getExample(exampleId);
      setState((prev) => ({
        ...prev,
        currentExampleId: exampleId,
        currentExample: data,
        currentStep: 0,
        generatedAnswer: '',
        autoGenerate: false,
        isPlaying: false,
        isPaused: false,
        isLoading: false,
      }));
    } catch (error) {
      console.error('Error loading example:', error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error.message,
      }));
    }
  }, []);

  /**
   * Advance to next step in current example
   */
  const nextStep = useCallback(() => {
    setState((prev) => {
      if (!prev.currentExample) return prev;
      const maxSteps = prev.currentExample.generation_steps.length;
      if (prev.currentStep >= maxSteps - 1) return prev;

      return {
        ...prev,
        currentStep: prev.currentStep + 1,
        currentAnimationSubStep: 0, // Reset to first sub-step when moving to next generation step
        isPlaying: true,
      };
    });
  }, []);

  /**
   * Advance to next animation sub-step
   */
  const nextAnimationSubStep = useCallback(() => {
    setState((prev) => {
      // Total sub-steps: 0-9 (10 steps total)
      // 0: tokens
      // 1: ids
      // 2: embeddings
      // 3: attention
      // 4: feed-forward
      // 5: extract & rotate
      // 6: project to probabilities
      // 7: show bar chart
      // 8: select token
      // 9: add to output (complete)
      const maxSubSteps = 10;

      if (prev.currentAnimationSubStep >= maxSubSteps - 1) {
        // Animation complete for this step
        return prev;
      }

      return {
        ...prev,
        currentAnimationSubStep: prev.currentAnimationSubStep + 1,
      };
    });
  }, []);

  /**
   * Reset to initial prompt
   */
  const reset = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentStep: 0,
      currentAnimationSubStep: 0,
      generatedAnswer: '',
      autoGenerate: false,
      isPlaying: false,
      isPaused: false,
    }));
  }, []);

  /**
   * Toggle theme between dark and light
   */
  const toggleTheme = useCallback(() => {
    setState((prev) => {
      const newTheme = prev.theme === 'dark' ? 'light' : 'dark';
      // Update document body attribute
      document.body.setAttribute('data-theme', newTheme);
      return { ...prev, theme: newTheme };
    });
  }, []);

  /**
   * Toggle language between English and Czech
   */
  const toggleLanguage = useCallback(() => {
    setState((prev) => ({
      ...prev,
      language: prev.language === 'en' ? 'cs' : 'en',
    }));
  }, []);

  /**
   * Set language explicitly
   */
  const setLanguage = useCallback((lang) => {
    setState((prev) => ({
      ...prev,
      language: lang,
    }));
  }, []);

  /**
   * Set animation speed
   */
  const setAnimationSpeed = useCallback((speed) => {
    setState((prev) => ({
      ...prev,
      animationSpeed: Math.max(
        config.animation.minSpeed,
        Math.min(config.animation.maxSpeed, speed)
      ),
    }));
  }, []);

  /**
   * Set playing state
   */
  const setIsPlaying = useCallback((isPlaying) => {
    setState((prev) => ({ ...prev, isPlaying }));
  }, []);

  /**
   * Set paused state
   */
  const setIsPaused = useCallback((isPaused) => {
    setState((prev) => ({ ...prev, isPaused }));
  }, []);

  /** Enable/disable automatic multi-step generation */
  const setAutoGenerate = useCallback((auto) => {
    setState((prev) => ({ ...prev, autoGenerate: !!auto }));
  }, []);

  /**
   * Called when a step's visualization animation completes.
   * Appends the selected token to the generated answer, and
   * either advances to the next step (auto-play) or stops at the end.
   */
  const onStepAnimationComplete = useCallback(() => {
    setState((prev) => {
      const ex = prev.currentExample;
      if (!ex) return prev;
      const steps = ex.generation_steps || [];
      const idx = prev.currentStep - 1; // current rendered step index
      if (idx < 0 || idx >= steps.length) return { ...prev, isPlaying: false };

      const selectedTok = steps[idx]?.selected_token?.token ?? '';
      const newAnswer = prev.generatedAnswer + (selectedTok || '');

      // If we're at the last step, just finalize.
      const isLast = prev.currentStep >= steps.length;
      if (isLast) {
        return {
          ...prev,
          generatedAnswer: newAnswer,
          isPlaying: false,
        };
      }

      // Always advance to the next generation step after completing sub-step 9
      // so the newly selected token appears to the right and the pass repeats.
      return {
        ...prev,
        generatedAnswer: newAnswer,
        currentStep: prev.currentStep + 1,
        currentAnimationSubStep: 0, // Reset sub-step for the new step
        isPlaying: true,
      };
    });
  }, []);

  // Load examples on mount
  useEffect(() => {
    loadExamples();
  }, [loadExamples]);

  // Set initial theme on mount
  useEffect(() => {
    document.body.setAttribute('data-theme', state.theme);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = {
    state,
    actions: {
      loadExample,
      loadExamples,
      nextStep,
      nextAnimationSubStep,
      reset,
      toggleTheme,
      toggleLanguage,
      setLanguage,
      setAnimationSpeed,
      setIsPlaying,
      setIsPaused,
      setAutoGenerate,
      onStepAnimationComplete,
    },
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

/**
 * Hook to use app context
 */
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
