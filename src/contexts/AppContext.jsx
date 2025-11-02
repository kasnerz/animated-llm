import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import config from '../config';
import * as examplesApi from '../services/examplesApi';
import { useThemeEffect } from '../hooks/useThemeEffect';

const AppContext = createContext();

// Action types
const ActionTypes = {
  // Data loading
  LOAD_EXAMPLES_START: 'LOAD_EXAMPLES_START',
  LOAD_EXAMPLES_SUCCESS: 'LOAD_EXAMPLES_SUCCESS',
  LOAD_EXAMPLES_ERROR: 'LOAD_EXAMPLES_ERROR',
  LOAD_EXAMPLE_START: 'LOAD_EXAMPLE_START',
  LOAD_EXAMPLE_SUCCESS: 'LOAD_EXAMPLE_SUCCESS',
  LOAD_EXAMPLE_ERROR: 'LOAD_EXAMPLE_ERROR',

  // Generation control
  NEXT_STEP: 'NEXT_STEP',
  NEXT_ANIMATION_SUB_STEP: 'NEXT_ANIMATION_SUB_STEP',
  RESET: 'RESET',
  STEP_ANIMATION_COMPLETE: 'STEP_ANIMATION_COMPLETE',

  // Settings
  TOGGLE_THEME: 'TOGGLE_THEME',
  TOGGLE_LANGUAGE: 'TOGGLE_LANGUAGE',
  SET_LANGUAGE: 'SET_LANGUAGE',
  SET_ANIMATION_SPEED: 'SET_ANIMATION_SPEED',

  // Playback state
  SET_IS_PLAYING: 'SET_IS_PLAYING',
  SET_IS_PAUSED: 'SET_IS_PAUSED',
  SET_AUTO_GENERATE: 'SET_AUTO_GENERATE',
};

// Initial state
const initialState = {
  // Example data
  examples: [],
  currentExampleId: null,
  currentExample: null,
  currentStep: 0,
  currentAnimationSubStep: 0,
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
};

// Reducer function
function appReducer(state, action) {
  switch (action.type) {
    case ActionTypes.LOAD_EXAMPLES_START:
      return { ...state, isLoading: true, error: null };

    case ActionTypes.LOAD_EXAMPLES_SUCCESS:
      return {
        ...state,
        examples: action.payload.examples,
        isLoading: false,
        error: null,
      };

    case ActionTypes.LOAD_EXAMPLES_ERROR:
      return {
        ...state,
        isLoading: false,
        error: action.payload.error,
      };

    case ActionTypes.LOAD_EXAMPLE_START:
      return { ...state, isLoading: true, error: null };

    case ActionTypes.LOAD_EXAMPLE_SUCCESS:
      return {
        ...state,
        currentExampleId: action.payload.exampleId,
        currentExample: action.payload.example,
        currentStep: 0,
        currentAnimationSubStep: 0,
        generatedAnswer: '',
        autoGenerate: false,
        isPlaying: false,
        isPaused: false,
        isLoading: false,
        error: null,
      };

    case ActionTypes.LOAD_EXAMPLE_ERROR:
      return {
        ...state,
        isLoading: false,
        error: action.payload.error,
      };

    case ActionTypes.NEXT_STEP: {
      if (!state.currentExample) return state;
      const maxSteps = state.currentExample.generation_steps.length;
      if (state.currentStep >= maxSteps - 1) return state;

      return {
        ...state,
        currentStep: state.currentStep + 1,
        currentAnimationSubStep: 0,
        isPlaying: true,
      };
    }

    case ActionTypes.NEXT_ANIMATION_SUB_STEP: {
      const maxSubSteps = 10;
      if (state.currentAnimationSubStep >= maxSubSteps - 1) {
        return state;
      }

      return {
        ...state,
        currentAnimationSubStep: state.currentAnimationSubStep + 1,
      };
    }

    case ActionTypes.RESET:
      return {
        ...state,
        currentStep: 0,
        currentAnimationSubStep: 0,
        generatedAnswer: '',
        autoGenerate: false,
        isPlaying: false,
        isPaused: false,
      };

    case ActionTypes.STEP_ANIMATION_COMPLETE: {
      const ex = state.currentExample;
      if (!ex) return { ...state, isPlaying: false };

      const steps = ex.generation_steps || [];
      const idx = state.currentStep - 1;
      if (idx < 0 || idx >= steps.length) return { ...state, isPlaying: false };

      const selectedTok = steps[idx]?.selected_token?.token ?? '';
      const newAnswer = state.generatedAnswer + (selectedTok || '');

      const isLast = state.currentStep >= steps.length;
      if (isLast) {
        return {
          ...state,
          generatedAnswer: newAnswer,
          isPlaying: false,
        };
      }

      return {
        ...state,
        generatedAnswer: newAnswer,
        currentStep: state.currentStep + 1,
        currentAnimationSubStep: 0,
        isPlaying: true,
      };
    }

    case ActionTypes.TOGGLE_THEME:
      return {
        ...state,
        theme: state.theme === 'dark' ? 'light' : 'dark',
      };

    case ActionTypes.TOGGLE_LANGUAGE:
      return {
        ...state,
        language: state.language === 'en' ? 'cs' : 'en',
      };

    case ActionTypes.SET_LANGUAGE:
      return {
        ...state,
        language: action.payload.language,
      };

    case ActionTypes.SET_ANIMATION_SPEED:
      return {
        ...state,
        animationSpeed: Math.max(
          config.animation.minSpeed,
          Math.min(config.animation.maxSpeed, action.payload.speed)
        ),
      };

    case ActionTypes.SET_IS_PLAYING:
      return {
        ...state,
        isPlaying: action.payload.isPlaying,
      };

    case ActionTypes.SET_IS_PAUSED:
      return {
        ...state,
        isPaused: action.payload.isPaused,
      };

    case ActionTypes.SET_AUTO_GENERATE:
      return {
        ...state,
        autoGenerate: !!action.payload.autoGenerate,
      };

    default:
      return state;
  }
}

/**
 * App Context Provider
 * Manages global application state including theme, language, examples, and animation
 */
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Apply theme side effect
  useThemeEffect(state.theme);

  /**
   * Load all examples from examples.json
   */
  const loadExamples = useCallback(async () => {
    try {
      dispatch({ type: ActionTypes.LOAD_EXAMPLES_START });
      const examples = await examplesApi.listExamples();
      dispatch({
        type: ActionTypes.LOAD_EXAMPLES_SUCCESS,
        payload: { examples },
      });

      // Load first example by default
      if (examples.length > 0) {
        loadExample(examples[0].id);
      }
    } catch (error) {
      console.error('Error loading examples:', error);
      dispatch({
        type: ActionTypes.LOAD_EXAMPLES_ERROR,
        payload: { error: error.message },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Load a specific example by ID
   */
  const loadExample = useCallback(async (exampleId) => {
    try {
      dispatch({ type: ActionTypes.LOAD_EXAMPLE_START });
      const data = await examplesApi.getExample(exampleId);
      dispatch({
        type: ActionTypes.LOAD_EXAMPLE_SUCCESS,
        payload: { exampleId, example: data },
      });
    } catch (error) {
      console.error('Error loading example:', error);
      dispatch({
        type: ActionTypes.LOAD_EXAMPLE_ERROR,
        payload: { error: error.message },
      });
    }
  }, []);

  /**
   * Advance to next step in current example
   */
  const nextStep = useCallback(() => {
    dispatch({ type: ActionTypes.NEXT_STEP });
  }, []);

  /**
   * Advance to next animation sub-step
   */
  const nextAnimationSubStep = useCallback(() => {
    dispatch({ type: ActionTypes.NEXT_ANIMATION_SUB_STEP });
  }, []);

  /**
   * Reset to initial prompt
   */
  const reset = useCallback(() => {
    dispatch({ type: ActionTypes.RESET });
  }, []);

  /**
   * Toggle theme between dark and light
   */
  const toggleTheme = useCallback(() => {
    dispatch({ type: ActionTypes.TOGGLE_THEME });
  }, []);

  /**
   * Toggle language between English and Czech
   */
  const toggleLanguage = useCallback(() => {
    dispatch({ type: ActionTypes.TOGGLE_LANGUAGE });
  }, []);

  /**
   * Set language explicitly
   */
  const setLanguage = useCallback((lang) => {
    dispatch({
      type: ActionTypes.SET_LANGUAGE,
      payload: { language: lang },
    });
  }, []);

  /**
   * Set animation speed
   */
  const setAnimationSpeed = useCallback((speed) => {
    dispatch({
      type: ActionTypes.SET_ANIMATION_SPEED,
      payload: { speed },
    });
  }, []);

  /**
   * Set playing state
   */
  const setIsPlaying = useCallback((isPlaying) => {
    dispatch({
      type: ActionTypes.SET_IS_PLAYING,
      payload: { isPlaying },
    });
  }, []);

  /**
   * Set paused state
   */
  const setIsPaused = useCallback((isPaused) => {
    dispatch({
      type: ActionTypes.SET_IS_PAUSED,
      payload: { isPaused },
    });
  }, []);

  /** Enable/disable automatic multi-step generation */
  const setAutoGenerate = useCallback((auto) => {
    dispatch({
      type: ActionTypes.SET_AUTO_GENERATE,
      payload: { autoGenerate: auto },
    });
  }, []);

  /**
   * Called when a step's visualization animation completes.
   * Appends the selected token to the generated answer, and
   * either advances to the next step (auto-play) or stops at the end.
   */
  const onStepAnimationComplete = useCallback(() => {
    dispatch({ type: ActionTypes.STEP_ANIMATION_COMPLETE });
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
