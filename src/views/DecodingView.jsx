import { useEffect, useState, useRef, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { useI18n } from '../i18n/I18nProvider';
import { processTokenForText, isSpecialToken } from '../utils/tokenProcessing';
import { getViridisColor } from '../utils/colorSchemes';
import { LAYOUT } from '../visualization/core/constants';
import { MODEL_REGISTRY, getModelInfo, getTemperatureEmoji } from '../config/modelConfig';
import Icon from '@mdi/react';
import { mdiPlay, mdiPause, mdiChevronDown, mdiCodeTags } from '@mdi/js';
import '../styles/visualization.css';
import '../styles/main.css';
import '../styles/decoding-view.css';

/**
 * DecodingView Component
 * Simplified decoding algorithms visualization
 * Steps:
 * 0: Tokenize prompt (show tokens with specials ON)
 * 1: Show Transformer box
 * 2: Show probability distribution bars
 * 3: Highlight selected next token
 * 4: Append selected token to top sequence
 */
function DecodingView() {
  const { state, actions } = useApp();
  const { t } = useI18n();

  // Local sub-step state for decoding animation
  const [subStep, setSubStep] = useState(0);

  // UI state for dropdowns
  const [isPromptDropdownOpen, setIsPromptDropdownOpen] = useState(false);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isTempDropdownOpen, setIsTempDropdownOpen] = useState(false);

  // Refs for click outside detection
  const modelDropdownRef = useRef(null);
  const tempDropdownRef = useRef(null);

  // Force special tokens ON for this view
  useEffect(() => {
    const prev = state.showSpecialTokens;
    if (!prev) actions.setShowSpecialTokens(true);
    return () => {
      // Restore previous user preference on unmount
      actions.setShowSpecialTokens(prev);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter examples by selected model and temperature
  const filteredExamples = useMemo(() => {
    const modelEntry = MODEL_REGISTRY[state.selectedModelIndex];
    const modelPattern = modelEntry
      ? typeof modelEntry.pattern === 'string'
        ? new RegExp(modelEntry.pattern, 'i')
        : modelEntry.pattern
      : null;

    return state.examples.filter((ex) => {
      const byModel = modelPattern ? modelPattern.test(ex.model_id || '') : true;
      const byTemp = getTemperatureEmoji(ex.temperature) === state.selectedTemperatureEmoji;
      return byModel && byTemp;
    });
  }, [state.examples, state.selectedModelIndex, state.selectedTemperatureEmoji]);

  // Ensure current example matches filter; if not, auto-load first matching
  useEffect(() => {
    if (!state.currentExampleId && filteredExamples.length > 0) return;
    const isCurrentValid = filteredExamples.some((ex) => ex.id === state.currentExampleId);
    if (!isCurrentValid && filteredExamples.length > 0) {
      actions.loadExample(filteredExamples[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.selectedModelIndex, state.selectedTemperatureEmoji, filteredExamples.length]);

  // Close model dropdown when clicking outside
  useEffect(() => {
    if (!isModelDropdownOpen) return;

    const handleWindowClick = (event) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target)) {
        setIsModelDropdownOpen(false);
      }
    };

    window.addEventListener('pointerdown', handleWindowClick);
    return () => window.removeEventListener('pointerdown', handleWindowClick);
  }, [isModelDropdownOpen]);

  // Close temperature dropdown when clicking outside
  useEffect(() => {
    if (!isTempDropdownOpen) return;

    const handleWindowClick = (event) => {
      if (tempDropdownRef.current && !tempDropdownRef.current.contains(event.target)) {
        setIsTempDropdownOpen(false);
      }
    };

    window.addEventListener('pointerdown', handleWindowClick);
    return () => window.removeEventListener('pointerdown', handleWindowClick);
  }, [isTempDropdownOpen]);

  // Calculate current generation step index
  // state.currentStep is 1-based index of the step being displayed/generated
  const stepIndex = Math.max(0, state.currentStep - 1);
  const currentGen = state.currentExample?.generation_steps?.[stepIndex];
  const isSubsequentStep = state.currentStep > 1;

  // Determine which generation step to show in probability bars
  // If we are in a subsequent step but haven't reached the "update probabilities" phase (subStep 1),
  // show the previous step's probabilities to maintain continuity.
  let displayStepIndex = stepIndex;
  if (isSubsequentStep && subStep < 1) {
    displayStepIndex = stepIndex - 1;
  }
  const displayGen = state.currentExample?.generation_steps?.[displayStepIndex];

  // Track previous global step to reset subStep synchronously
  const [prevGlobalStep, setPrevGlobalStep] = useState(state.currentStep);

  if (state.currentStep !== prevGlobalStep) {
    setPrevGlobalStep(state.currentStep);
    setSubStep(state.currentStep > 1 ? 1 : 0);
  }

  // Drive local animation steps when global play is active
  useEffect(() => {
    if (!state.isPlaying) return;
    if (!currentGen) {
      // End of generation, stop playing
      actions.setIsPlaying(false);
      return;
    }

    // If we are at the end of the local animation cycle (step 2)
    if (subStep >= 2) {
      const timer = setTimeout(() => {
        actions.nextStep();
      }, 600);
      return () => clearTimeout(timer);
    }

    // Advance local sub-step
    const timer = setTimeout(() => {
      setSubStep((s) => s + 1);
      // If global currentStep still 0, advance it so InputSection shows tokens underline style consistently
      if (state.currentStep === 0) actions.nextStep();
    }, 600);
    return () => clearTimeout(timer);
  }, [state.isPlaying, subStep, currentGen, state.currentStep, actions]);

  // Keyboard shortcuts for manual stepping
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.matches('input, textarea')) return;

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (state.isPlaying) actions.setIsPlaying(false);

        if (subStep < 2) {
          setSubStep((s) => s + 1);
        } else {
          // If at end of local steps, move to next global step
          actions.nextStep();
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (state.isPlaying) actions.setIsPlaying(false);

        if (subStep > 0) {
          setSubStep((s) => s - 1);
        } else {
          // Move to previous global step (if possible)
          // We don't have easy access to prevStep logic that resets subStep to 2,
          // so we just rely on global prevStep which resets subStep to 0 via the other useEffect.
          // Ideally we would set subStep to 2 after prevStep, but that requires more state sync.
          actions.prevStep();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.isPlaying, subStep, actions]);

  if (!state.currentExample) {
    return (
      <div className="decoding-placeholder">
        <p className="placeholder-text">
          {t('select_example_prompt') || 'Select an example to begin.'}
        </p>
      </div>
    );
  }

  const tokens = currentGen?.tokens || [];
  const tokenIds = currentGen?.token_ids || [];
  const candidates = displayGen?.output_distribution?.candidates || [];
  const maxBars = LAYOUT.MAX_OUTPUT_TOKENS || 7;
  const shownCandidates = candidates.slice(0, maxBars);
  const selectedToken = currentGen?.selected_token?.token;
  const selectedTokenId = currentGen?.selected_token?.token_id;

  // Get current model info for displaying in transformer box
  const currentModelEntry = MODEL_REGISTRY[state.selectedModelIndex];
  const currentModelInfo = state.currentExample?.model_id
    ? getModelInfo(state.currentExample.model_id)
    : currentModelEntry
      ? { name: currentModelEntry.name, logo: currentModelEntry.logo, size: currentModelEntry.size }
      : null;

  // Handler functions
  const handleExampleChange = (exampleId) => {
    actions.loadExample(exampleId);
    setIsPromptDropdownOpen(false);
  };

  const handlePlayPause = () => {
    if (!state.currentExample) return;
    // If generation hasn't started yet, start and begin playing
    if (state.currentStep === 0) {
      actions.nextStep();
      actions.setIsPlaying(true);
      return;
    }
    actions.setIsPlaying(!state.isPlaying);
  };

  // Find current example index within filtered list
  const currentIndex = filteredExamples.findIndex((ex) => ex.id === state.currentExampleId);

  // Helper to determine token style based on probability
  const getTokenStyle = (isGenerated, genStep, tokenId) => {
    if (!isGenerated || !genStep) return {};

    // Find candidate with this token_id in the generation step that produced it
    const candidate = genStep.output_distribution?.candidates?.find((c) => c.token_id === tokenId);

    if (candidate) {
      const color = getViridisColor(candidate.prob);
      // Determine text color for contrast
      // Viridis stops: 0-2 are dark (white text), 3-5 are light (black text)
      // Stops length is 6.
      const idx = Math.floor(candidate.prob * 5);
      const textColor = idx <= 2 ? '#fff' : '#000';

      return {
        backgroundColor: color,
        color: textColor,
        borderColor: color,
      };
    }
    return {};
  };

  const promptLength = state.currentExample?.generation_steps?.[0]?.tokens?.length || 0;

  // Determine if we should show tokenized view
  const shouldShowTokens = state.currentStep > 0;

  // Get current temperature emoji for the transformer box
  const currentTempEmoji = state.currentExample
    ? getTemperatureEmoji(state.currentExample.temperature)
    : '🌡️';

  return (
    <div className="decoding-view-container">
      {/* Prompt box matching text generation view design */}
      <div className="decoding-prompt-container">
        <div className="chat-input-wrapper">
          <div
            className="chat-input-box"
            onClick={() => setIsPromptDropdownOpen(!isPromptDropdownOpen)}
          >
            {/* Dropdown selector */}
            <div className="prompt-dropdown">
              <button
                className="dropdown-toggle"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPromptDropdownOpen(!isPromptDropdownOpen);
                }}
                aria-label="Select prompt"
              >
                <Icon path={mdiChevronDown} size={0.65} />
              </button>

              {isPromptDropdownOpen && (
                <div className="dropdown-menu">
                  {filteredExamples.map((example, index) => (
                    <button
                      key={example.id}
                      className={`dropdown-item ${index === currentIndex ? 'active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExampleChange(example.id);
                      }}
                    >
                      <div className="dropdown-item-content">
                        <span className="dropdown-item-prompt">{example.prompt}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Prompt text or tokenized text */}
            <div className="prompt-main">
              <div className={`prompt-text-chat ${shouldShowTokens ? 'has-tokens' : ''}`}>
                {shouldShowTokens ? (
                  <span className="tokenized-text">
                    {tokens.map((tok, i) => {
                      const isGenerated = i >= promptLength;
                      const genStep = isGenerated
                        ? state.currentExample?.generation_steps?.[i - promptLength]
                        : null;
                      const tokenId = tokenIds[i];
                      const style = getTokenStyle(isGenerated, genStep, tokenId);

                      return (
                        <span
                          key={i}
                          className={`io-token ${isSpecialToken(tok) ? 'special' : ''}`}
                          style={style}
                        >
                          {processTokenForText(tok)}
                        </span>
                      );
                    })}
                    {/* Show appended token only in step 2 */}
                    {subStep === 2 && selectedToken && (
                      <span
                        className="io-token appended"
                        style={getTokenStyle(true, currentGen, selectedTokenId)}
                      >
                        {processTokenForText(selectedToken)}
                      </span>
                    )}
                  </span>
                ) : (
                  state.currentExample?.prompt || t('model_input') || 'Model Input'
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Arrow to transformer - always visible */}
      <div className="arrow arrow-down" aria-hidden>
        <div className="shaft" />
        <div className="head" />
      </div>

      {/* Transformer box with model selector and temperature - always visible */}
      <div className="transformer-box">
        {/* Model selector on the left */}
        <div className="transformer-left" ref={modelDropdownRef}>
          <button
            className="model-selector-btn"
            onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
            aria-label="Select model"
          >
            <img
              src={
                new URL(`../assets/model-logos/${currentModelEntry?.logo}`, import.meta.url).href
              }
              alt=""
              className="model-logo-btn"
            />
            <span className="model-name">{currentModelInfo?.name || 'Model'}</span>
            <Icon path={mdiChevronDown} size={0.6} />
          </button>

          {isModelDropdownOpen && (
            <div className="model-dropdown-menu">
              {MODEL_REGISTRY.map((entry, idx) => (
                <button
                  key={idx}
                  className={`model-dropdown-item ${state.selectedModelIndex === idx ? 'active' : ''}`}
                  onClick={() => {
                    actions.setSelectedModelIndex(idx);
                    setIsModelDropdownOpen(false);
                  }}
                  title={entry.name || 'Model'}
                >
                  <img
                    src={new URL(`../assets/model-logos/${entry.logo}`, import.meta.url).href}
                    alt=""
                    className="model-logo-small"
                  />
                  <span className="model-info">{entry.name || entry.size}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Temperature selector on the right */}
        <div className="transformer-right" ref={tempDropdownRef}>
          <button
            className="temp-selector-btn"
            onClick={() => setIsTempDropdownOpen(!isTempDropdownOpen)}
            aria-label="Select temperature"
            title="Temperature"
          >
            <span className="temp-emoji-btn" aria-hidden>
              {currentTempEmoji}
            </span>
          </button>

          {isTempDropdownOpen && (
            <div className="temp-dropdown-menu">
              {[
                { emoji: '🧊', value: '0.0' },
                { emoji: '🌡️', value: '1.0' },
                { emoji: '🌶️', value: '5.0' },
              ].map(({ emoji, value }) => (
                <button
                  key={emoji}
                  className={`temp-dropdown-item ${state.selectedTemperatureEmoji === emoji ? 'active' : ''}`}
                  onClick={() => {
                    actions.setSelectedTemperatureEmoji(emoji);
                    setIsTempDropdownOpen(false);
                  }}
                  aria-label={`Temperature ${value}`}
                  title={`Temperature ${value}`}
                >
                  <span className="temp-emoji" aria-hidden>
                    {emoji}
                  </span>
                  <span className="temp-value">{value}</span>
                </button>
              ))}
            </div>
          )}

          {/* Special tokens toggle button */}
          <button
            onClick={() => actions.setShowSpecialTokens(!state.showSpecialTokens)}
            className={`btn-special-tokens ${state.showSpecialTokens ? 'active' : ''}`}
            aria-label={t('show_special_tokens') || 'Toggle special tokens'}
            title={t('show_special_tokens') || 'Toggle special tokens'}
          >
            <Icon path={mdiCodeTags} size={1} />
          </button>

          {/* Play/Pause button */}
          <button
            onClick={handlePlayPause}
            className="btn-play-transformer"
            aria-label={state.isPlaying ? t('pause') : t('play')}
            title={state.isPlaying ? t('pause') : t('play')}
          >
            <Icon path={state.isPlaying ? mdiPause : mdiPlay} size={0.85} />
          </button>
        </div>
      </div>

      {/* Arrow to probabilities */}
      {(subStep >= 1 || isSubsequentStep) && (
        <div className="arrow arrow-down" aria-hidden>
          <div className="shaft" />
          <div className="head" />
        </div>
      )}

      {/* Probability bars */}
      {(subStep >= 1 || isSubsequentStep) && (
        <div className="probabilities-wrapper">
          <div className="probabilities-label-side">{t('model_output') || 'Model Output'}</div>
          <div className="probability-bars">
            {shownCandidates.map((c, idx) => {
              let pct = (c.prob * 100).toFixed(2);
              if (pct === '0.00' && c.prob > 0) {
                pct = (c.prob * 100).toPrecision(1);
              }
              const isSelected = subStep >= 1 && c.token === selectedToken;
              return (
                <div key={idx} className={`prob-row ${isSelected ? 'selected' : ''}`}>
                  {isSelected && <div className="row-selection-outline" />}
                  <div className="prob-label">
                    <span className="prob-token">{processTokenForText(c.token)}</span>
                    <span className="prob-percent">{pct}%</span>
                  </div>
                  <div className="prob-bar-wrapper">
                    <div
                      className="prob-bar"
                      style={{
                        width: `${Math.max(4, c.prob * 100)}%`,
                        backgroundColor: getViridisColor(c.prob),
                      }}
                    />
                  </div>
                  {/* Arrow back up to IO box when appending - rendered inside the selected row */}
                  {isSelected && subStep === 2 && (
                    <div className="append-arrow-container">
                      <svg className="append-arrow-svg">
                        <path
                          d={`M 0 -15 h 110 q 20 0 20 -20 V -${190 + idx * 30} q 0 -20 -20 -20 h -5`}
                          fill="none"
                          stroke="#969595"
                          strokeWidth="1.5"
                          strokeDasharray="4,4"
                          markerEnd="url(#arrowhead-grey)"
                        />
                        <defs>
                          <marker
                            id="arrowhead-grey"
                            markerWidth="6"
                            markerHeight="6"
                            refX="5"
                            refY="3"
                            orient="auto"
                          >
                            <path d="M0,0 L6,3 L0,6" fill="#969595" />
                          </marker>
                        </defs>
                      </svg>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Removed old append-arrow div */}
    </div>
  );
}

export default DecodingView;
