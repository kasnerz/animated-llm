import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react';
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
  PREV_ANIMATION_SUB_STEP: 'PREV_ANIMATION_SUB_STEP',
  SKIP_TO_NEXT_TOKEN: 'SKIP_TO_NEXT_TOKEN',
  SKIP_TO_END: 'SKIP_TO_END',
  RESET: 'RESET',
  STEP_ANIMATION_COMPLETE: 'STEP_ANIMATION_COMPLETE',

  // Settings
  TOGGLE_THEME: 'TOGGLE_THEME',
  TOGGLE_LANGUAGE: 'TOGGLE_LANGUAGE',
  SET_LANGUAGE: 'SET_LANGUAGE',
  SET_ANIMATION_SPEED: 'SET_ANIMATION_SPEED',
  SET_VIEW_TYPE: 'SET_VIEW_TYPE',

  // Playback state
  SET_IS_PLAYING: 'SET_IS_PLAYING',
  SET_IS_PAUSED: 'SET_IS_PAUSED',
  SET_AUTO_GENERATE: 'SET_AUTO_GENERATE',

  // Model/temperature selection
  SET_SELECTED_MODEL_INDEX: 'SET_SELECTED_MODEL_INDEX',
  SET_SELECTED_TEMPERATURE_EMOJI: 'SET_SELECTED_TEMPERATURE_EMOJI',

  // Special tokens visibility
  SET_SHOW_SPECIAL_TOKENS: 'SET_SHOW_SPECIAL_TOKENS',
};

// Initial state
const initialState = {
  // Example data
  examples: [],
  currentExampleId: null,
  currentExample: null,
  currentStep: 0,
  currentAnimationSubStep: 0,
  currentTransformerLayer: 0, // Track which transformer layer we're animating
  generatedAnswer: '',
  generatedTokens: [], // Array of { token, index } to track colors
  autoGenerate: false,

  // UI settings
  theme: config.defaults.theme,
  language: config.defaults.language,
  animationSpeed: config.defaults.animationSpeed,
  viewType: 'inference', // 'inference' or 'training'

  // Animation state
  isPlaying: false,
  isPaused: false,

  // Navigation/animation control
  // When true, visualization should update instantly without transition effects
  instantTransition: false,

  // Loading state
  isLoading: false,
  error: null,

  // Model and temperature configuration (decoupled from examples)
  // Default to first model (index 0) and temperature 0.0 🧊
  selectedModelIndex: 0,
  selectedTemperatureEmoji: '🧊',

  // Special tokens visibility
  showSpecialTokens: false,
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
        currentTransformerLayer: 0,
        generatedAnswer: '',
        generatedTokens: [],
        autoGenerate: false,
        isPlaying: false,
        isPaused: false,
        isLoading: false,
        error: null,
        instantTransition: false,
      };

    case ActionTypes.LOAD_EXAMPLE_ERROR:
      return {
        ...state,
        isLoading: false,
        error: action.payload.error,
      };

    case ActionTypes.NEXT_STEP: {
      if (!state.currentExample) return state;
      const isTraining = state.viewType === 'training';
      const maxSteps = isTraining
        ? state.currentExample.training_steps?.length || 0
        : state.currentExample.generation_steps?.length || 0;
      if (maxSteps === 0) return state;
      if (state.currentStep >= maxSteps) return state;

      return {
        ...state,
        currentStep: state.currentStep + 1,
        currentAnimationSubStep: 0,
        currentTransformerLayer: 0,
        isPlaying: true,
        instantTransition: false,
      };
    }

    case ActionTypes.NEXT_ANIMATION_SUB_STEP: {
      // Training view: animate sub-steps 0..15 (0..10 forward + 11..15 backprop skeleton)
      if (state.viewType === 'training') {
        const maxSubStepsTraining = 16; // 0..15
        if (state.currentAnimationSubStep >= maxSubStepsTraining - 1) return state;
        return {
          ...state,
          currentAnimationSubStep: state.currentAnimationSubStep + 1,
          instantTransition: false,
        };
      }
      const numLayers = state.currentExample?.model_info?.num_layers || 1;
      const maxSubSteps = 13; // timeline now has 0..12

      // Two-stage transformer flow:
      // - First pass (substeps 3..5) with currentTransformerLayer = 0
      // - Reveal stack (substep 6) in one press
      // - Second pass (substeps 3..5) with currentTransformerLayer = numLayers-1
      // - Continue with the rest (substep 7..)

      const sub = state.currentAnimationSubStep;
      const currentLayer = state.currentTransformerLayer;

      // Skip the no-op substep right after tokenization (sub 1)
      // Jump directly from 0 -> 2 so the flow goes straight to input embeddings
      if (sub === 0) {
        return {
          ...state,
          currentAnimationSubStep: 2,
          instantTransition: false,
        };
      }

      // If numLayers <= 1, skip reveal and second pass
      if (numLayers <= 1 && sub === 5) {
        return {
          ...state,
          currentAnimationSubStep: 7, // skip reveal directly to outside embeddings
          instantTransition: false,
        };
      }

      // After finishing first pass at substep 5, go to reveal (6)
      if (sub === 5 && currentLayer === 0 && numLayers > 1) {
        return {
          ...state,
          currentAnimationSubStep: 6,
          instantTransition: false,
        };
      }

      // At reveal substep, switch to last layer and re-enter transformer at substep 3
      if (sub === 6 && numLayers > 1) {
        return {
          ...state,
          currentTransformerLayer: Math.max(0, numLayers - 1),
          currentAnimationSubStep: 3,
          instantTransition: false,
        };
      }

      // After finishing the second pass at substep 5 on the last layer, skip reveal
      if (sub === 5 && currentLayer >= numLayers - 1 && numLayers > 1) {
        return {
          ...state,
          currentAnimationSubStep: 7,
          instantTransition: false,
        };
      }

      if (state.currentAnimationSubStep >= maxSubSteps - 1) {
        return state;
      }

      return {
        ...state,
        currentAnimationSubStep: state.currentAnimationSubStep + 1,
        instantTransition: false,
      };
    }

    case ActionTypes.PREV_ANIMATION_SUB_STEP: {
      if (state.viewType === 'training') {
        // Simple backward stepping for training
        const sub = state.currentAnimationSubStep;
        if (sub > 0) {
          return { ...state, currentAnimationSubStep: sub - 1, instantTransition: true };
        }
        // If at sub==0, move to previous step's last sub-step or reset to beginning
        if (state.currentStep <= 1) {
          return {
            ...state,
            currentStep: 0,
            currentAnimationSubStep: 0,
            currentTransformerLayer: 0,
            instantTransition: true,
          };
        }
        const prevStep = Math.max(1, state.currentStep - 1);
        const lastVisibleSubTraining = 16; // land on last training sub-step
        return {
          ...state,
          currentStep: prevStep,
          currentAnimationSubStep: lastVisibleSubTraining,
          currentTransformerLayer: 0,
          instantTransition: true,
        };
      }
      const numLayers = state.currentExample?.model_info?.num_layers || 1;
      const sub = state.currentAnimationSubStep;
      const currentLayer = state.currentTransformerLayer;

      // Symmetric skip: when going back from sub 2, jump to 0 (skip 1)
      if (sub === 2) {
        return {
          ...state,
          currentAnimationSubStep: 0,
          instantTransition: true,
        };
      }

      // If at very beginning, nothing to do
      if (state.currentStep === 0 && sub <= 0) {
        return { ...state, instantTransition: true };
      }

      // If at the start of a step (sub==0), move back to previous step's end and undo last generated token
      if (sub === 0) {
        // If we are at the first step, go back to initial state (no visualization)
        if (state.currentStep === 1) {
          return {
            ...state,
            currentStep: 0,
            currentAnimationSubStep: 0,
            currentTransformerLayer: 0,
            // Rolling back to the very beginning clears any generated output
            generatedAnswer: '',
            generatedTokens: [],
            instantTransition: true,
          };
        }

        // Otherwise, go to the previous step and set to its last visible sub-step
        const prevStep = Math.max(1, state.currentStep - 1);
        const lastVisibleSub = 11; // land on arrow (no step complete) when stepping back a step

        // Undo the last generated token (if any)
        const gt = state.generatedTokens || [];
        const last = gt.length > 0 ? gt[gt.length - 1] : null;
        const newGeneratedTokens = gt.length > 0 ? gt.slice(0, gt.length - 1) : gt;
        const tokenStr = last?.token ?? '';
        const newGeneratedAnswer = tokenStr
          ? state.generatedAnswer.slice(
              0,
              Math.max(0, state.generatedAnswer.length - tokenStr.length)
            )
          : state.generatedAnswer;

        return {
          ...state,
          currentStep: prevStep,
          currentAnimationSubStep: lastVisibleSub,
          currentTransformerLayer: Math.max(0, numLayers - 1),
          generatedAnswer: newGeneratedAnswer,
          generatedTokens: newGeneratedTokens,
          instantTransition: true,
        };
      }

      // Reverse special jumps used in NEXT_ANIMATION_SUB_STEP
      // If we skipped reveal due to single-layer model (went 5 -> 7), allow 7 -> 5
      if (numLayers <= 1 && sub === 7) {
        return {
          ...state,
          currentAnimationSubStep: 5,
          instantTransition: true,
        };
      }

      // If we are right after reveal jump for multi-layer second pass entry (layer switched to last and sub=3), go back to reveal (sub=6, layer=0)
      if (numLayers > 1 && currentLayer >= Math.max(0, numLayers - 1) && sub === 3) {
        return {
          ...state,
          currentTransformerLayer: 0,
          currentAnimationSubStep: 6,
          instantTransition: true,
        };
      }

      // If we are at reveal (sub=6) during first pass, go back to end of first pass (sub=5)
      if (numLayers > 1 && currentLayer === 0 && sub === 6) {
        return {
          ...state,
          currentAnimationSubStep: 5,
          instantTransition: true,
        };
      }

      // If we jumped from second pass end (sub=5 on last layer) to 7, allow back to 5
      if (numLayers > 1 && currentLayer >= numLayers - 1 && sub === 7) {
        return {
          ...state,
          currentAnimationSubStep: 5,
          instantTransition: true,
        };
      }

      // Default: step one sub-step back
      return {
        ...state,
        currentAnimationSubStep: Math.max(0, sub - 1),
        instantTransition: true,
      };
    }

    case ActionTypes.SKIP_TO_NEXT_TOKEN: {
      if (state.viewType === 'training') {
        return state;
      }
      // Skip to the end of the current token generation (last sub-step)
      // This shows the selected token immediately without animating through all sub-steps
      if (!state.currentExample) return state;

      // Pause if playing; jump to highlight of the next token in the row (sub-step 10)
      const highlightSubStep = 10;

      return {
        ...state,
        currentAnimationSubStep: highlightSubStep,
        isPlaying: false,
        instantTransition: true,
      };
    }

    case ActionTypes.SKIP_TO_END: {
      if (!state.currentExample) return state;
      if (state.viewType === 'training') {
        const maxSteps = state.currentExample.training_steps?.length || 0;
        return {
          ...state,
          currentStep: maxSteps,
          isPlaying: false,
          instantTransition: true,
        };
      }

      // Inference: show all generated tokens
      const steps = state.currentExample.generation_steps || [];
      if (steps.length === 0) return state;

      // Build the full generated answer by concatenating all selected tokens
      const inputTokensCount = steps[0]?.tokens?.length || 0;
      let fullAnswer = '';
      const allGeneratedTokens = [];

      steps.forEach((step, idx) => {
        const selectedTok = step?.selected_token?.token ?? '';
        fullAnswer += selectedTok;
        const tokenIndex = inputTokensCount + idx;
        allGeneratedTokens.push({ token: selectedTok, index: tokenIndex });
      });

      // Go to the last step's last sub-step
      return {
        ...state,
        currentStep: steps.length,
        currentAnimationSubStep: 12,
        currentTransformerLayer: Math.max(
          0,
          (state.currentExample?.model_info?.num_layers || 1) - 1
        ),
        generatedAnswer: fullAnswer,
        generatedTokens: allGeneratedTokens,
        isPlaying: false,
        instantTransition: true,
      };
    }

    case ActionTypes.RESET:
      return {
        ...state,
        currentStep: 0,
        currentAnimationSubStep: 0,
        currentTransformerLayer: 0,
        generatedAnswer: '',
        generatedTokens: [],
        autoGenerate: false,
        isPlaying: false,
        isPaused: false,
        instantTransition: false,
      };

    case ActionTypes.STEP_ANIMATION_COMPLETE: {
      const isAuto = !!(action.payload && action.payload.auto);
      const ex = state.currentExample;
      if (!ex) return { ...state, isPlaying: false };

      if (state.viewType === 'training') {
        const maxSteps = ex.training_steps?.length || 0;
        const isLast = state.currentStep >= maxSteps;
        if (isLast) {
          return {
            ...state,
            currentStep: 0,
            isPlaying: isAuto,
            currentAnimationSubStep: 0,
            currentTransformerLayer: 0,
            instantTransition: false,
          };
        }
        return {
          ...state,
          currentStep: state.currentStep + 1,
          isPlaying: isAuto,
          currentAnimationSubStep: 0,
          currentTransformerLayer: 0,
          instantTransition: false,
        };
      }

      const steps = ex.generation_steps || [];
      const idx = state.currentStep - 1;
      if (idx < 0 || idx >= steps.length) return { ...state, isPlaying: false };

      const selectedTok = steps[idx]?.selected_token?.token ?? '';
      const newAnswer = state.generatedAnswer + (selectedTok || '');

      // Track the generated token with its index (based on input tokens count + generated count)
      const inputTokensCount = steps[0]?.tokens?.length || 0;
      const tokenIndex = inputTokensCount + state.generatedTokens.length;
      const newGeneratedTokens = [
        ...state.generatedTokens,
        { token: selectedTok, index: tokenIndex },
      ];

      const isLast = state.currentStep >= steps.length;
      if (isLast) {
        // If autoplay, loop the animation from the beginning for the same input
        if (isAuto) {
          return {
            ...state,
            // Restart visualization from the beginning
            currentStep: 0,
            currentAnimationSubStep: 0,
            currentTransformerLayer: 0,
            generatedAnswer: '',
            generatedTokens: [],
            isPlaying: true,
            instantTransition: false,
          };
        }
        // Manual stepping: restart from the beginning (paused) to avoid repeatedly appending the last token
        return {
          ...state,
          currentStep: 0,
          currentAnimationSubStep: 0,
          currentTransformerLayer: 0,
          generatedAnswer: '',
          generatedTokens: [],
          isPlaying: false,
          instantTransition: false,
        };
      }

      return {
        ...state,
        generatedAnswer: newAnswer,
        generatedTokens: newGeneratedTokens,
        currentStep: state.currentStep + 1,
        currentAnimationSubStep: 0,
        currentTransformerLayer: 0,
        isPlaying: isAuto,
        instantTransition: false,
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

    case ActionTypes.SET_VIEW_TYPE:
      return {
        ...state,
        viewType: action.payload.viewType,
      };

    case ActionTypes.SET_ANIMATION_SPEED:
      return {
        ...state,
        animationSpeed: action.payload.speed,
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

    case ActionTypes.SET_SELECTED_MODEL_INDEX:
      return {
        ...state,
        selectedModelIndex: action.payload.index,
      };

    case ActionTypes.SET_SELECTED_TEMPERATURE_EMOJI:
      return {
        ...state,
        selectedTemperatureEmoji: action.payload.emoji,
      };

    case ActionTypes.SET_SHOW_SPECIAL_TOKENS:
      return {
        ...state,
        showSpecialTokens: action.payload.showSpecialTokens,
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
  const isFirstRender = useRef(true);

  // Apply theme side effect
  useThemeEffect(state.theme);

  /**
   * Load a specific example by ID
   */
  const loadExample = useCallback(
    async (exampleId) => {
      try {
        dispatch({ type: ActionTypes.LOAD_EXAMPLE_START });
        // Only allow special tokens toggle to affect inference (text generation) view.
        // Training view should never display special tokens.
        const allowSpecial = state.viewType === 'inference' ? state.showSpecialTokens : false;
        const data = await examplesApi.getExample(exampleId, state.viewType, allowSpecial);
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
    },
    [state.viewType, state.showSpecialTokens]
  );

  /**
   * Load all examples from examples.json
   */
  const loadExamples = useCallback(
    async (language = null) => {
      try {
        dispatch({ type: ActionTypes.LOAD_EXAMPLES_START });
        const examples = await examplesApi.listExamples(language, state.viewType);
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
    },
    [state.viewType, loadExample]
  );

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
   * Go back one animation sub-step
   */
  const prevAnimationSubStep = useCallback(() => {
    dispatch({ type: ActionTypes.PREV_ANIMATION_SUB_STEP });
  }, []);

  /**
   * Skip to the next token (end of current step)
   */
  const skipToNextToken = useCallback(() => {
    dispatch({ type: ActionTypes.SKIP_TO_NEXT_TOKEN });
  }, []);

  /**
   * Skip to the end of generation (all tokens)
   */
  const skipToEnd = useCallback(() => {
    dispatch({ type: ActionTypes.SKIP_TO_END });
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
    // Get current state synchronously through a ref pattern
    // First dispatch the toggle
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
   * Set view type (inference or training)
   */
  const setViewType = useCallback((viewType) => {
    dispatch({
      type: ActionTypes.SET_VIEW_TYPE,
      payload: { viewType },
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

  /** Set selected model by index in MODEL_REGISTRY */
  const setSelectedModelIndex = useCallback((index) => {
    dispatch({
      type: ActionTypes.SET_SELECTED_MODEL_INDEX,
      payload: { index },
    });
  }, []);

  /** Set selected temperature emoji (🧊 | 🌡️ | 🌶️) */
  const setSelectedTemperatureEmoji = useCallback((emoji) => {
    dispatch({
      type: ActionTypes.SET_SELECTED_TEMPERATURE_EMOJI,
      payload: { emoji },
    });
  }, []);

  /** Set whether to show special tokens in visualization */
  const setShowSpecialTokens = useCallback((showSpecialTokens) => {
    dispatch({
      type: ActionTypes.SET_SHOW_SPECIAL_TOKENS,
      payload: { showSpecialTokens },
    });
  }, []);

  /**
   * Called when a step's visualization animation completes.
   * Appends the selected token to the generated answer, and
   * either advances to the next step (auto-play) or stops at the end.
   */
  const onStepAnimationComplete = useCallback((auto = false) => {
    dispatch({ type: ActionTypes.STEP_ANIMATION_COMPLETE, payload: { auto } });
  }, []);

  // Load examples on mount with initial language
  useEffect(() => {
    loadExamples(initialState.language);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reload examples when language changes (but not on first render)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    loadExamples(state.language);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.language]);

  // Reload examples when view type changes
  useEffect(() => {
    if (isFirstRender.current) {
      return;
    }
    loadExamples(state.language);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.viewType]);

  // Reload current example when showSpecialTokens changes
  useEffect(() => {
    if (isFirstRender.current) {
      return;
    }
    if (state.currentExampleId) {
      loadExample(state.currentExampleId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.showSpecialTokens]);

  // Set initial theme on mount
  useEffect(() => {
    document.body.setAttribute('data-theme', state.theme);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const actions = useMemo(
    () => ({
      loadExample,
      loadExamples,
      nextStep,
      nextAnimationSubStep,
      prevAnimationSubStep,
      skipToNextToken,
      skipToEnd,
      reset,
      toggleTheme,
      toggleLanguage,
      setLanguage,
      setViewType,
      setAnimationSpeed,
      setIsPlaying,
      setIsPaused,
      setAutoGenerate,
      setSelectedModelIndex,
      setSelectedTemperatureEmoji,
      setShowSpecialTokens,
      onStepAnimationComplete,
    }),
    [
      loadExample,
      loadExamples,
      nextStep,
      nextAnimationSubStep,
      prevAnimationSubStep,
      skipToNextToken,
      skipToEnd,
      reset,
      toggleTheme,
      toggleLanguage,
      setLanguage,
      setViewType,
      setAnimationSpeed,
      setIsPlaying,
      setIsPaused,
      setAutoGenerate,
      setSelectedModelIndex,
      setSelectedTemperatureEmoji,
      setShowSpecialTokens,
      onStepAnimationComplete,
    ]
  );

  const value = useMemo(
    () => ({
      state,
      actions,
    }),
    [state, actions]
  );

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
