import { useEffect, useState, useRef, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { useI18n } from '../i18n/I18nProvider';
import { processTokenForText, isSpecialTokenContextual } from '../utils/tokenProcessing';
import { getViridisColor } from '../utils/colorSchemes';
import { LAYOUT, ANIMATION_SPEEDS } from '../visualization/core/constants';
import { MODEL_REGISTRY, getTemperatureEmoji } from '../config/modelConfig';
import Icon from '@mdi/react';
import {
  mdiPlay,
  mdiPause,
  mdiChevronDown,
  mdiCodeTags,
  mdiSnowflake,
  mdiThermometer,
  mdiFire,
  mdiSpeedometerSlow,
  mdiSpeedometerMedium,
  mdiSpeedometer,
} from '@mdi/js';
import InitialHint from '../components/InitialHint';
import { Tooltip } from 'react-tooltip';
import '../styles/visualization.css';
import '../styles/main.css';
import '../styles/decoding-view.css';

/**
 * Get icon path for temperature icon identifier
 * @param {string} iconId - Icon identifier ('snowflake', 'thermometer', 'fire')
 * @returns {string} MDI icon path
 */
function getTemperatureIconPath(iconId) {
  switch (iconId) {
    case 'snowflake':
      return mdiSnowflake;
    case 'thermometer':
      return mdiThermometer;
    case 'fire':
      return mdiFire;
    default:
      return mdiThermometer;
  }
}

/**
 * Get icon path for speed icon identifier
 * @param {string} iconId - Icon identifier
 * @returns {string} MDI icon path
 */
function getSpeedIconPath(iconId) {
  switch (iconId) {
    case 'mdiSpeedometerSlow':
      return mdiSpeedometerSlow;
    case 'mdiSpeedometerMedium':
      return mdiSpeedometerMedium;
    case 'mdiSpeedometer':
      return mdiSpeedometer;
    default:
      return mdiSpeedometerMedium;
  }
}

/**
 * GenerationSimpleView Component
 * Simplified decoding algorithms visualization
 * Steps:
 * 0: Tokenize prompt (show tokens with specials ON)
 * 1: Show Transformer box
 * 2: Show probability distribution bars
 * 3: Highlight selected next token
 * 4: Append selected token to top sequence
 */
function GenerationSimpleView() {
  const { state, actions } = useApp();
  const { t } = useI18n();

  // Mobile detection for arrow animation
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 760);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Local sub-step state for decoding animation
  const [subStep, setSubStep] = useState(0);

  // UI state for dropdowns
  const [isPromptDropdownOpen, setIsPromptDropdownOpen] = useState(false);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isTempDropdownOpen, setIsTempDropdownOpen] = useState(false);
  const [isSpeedDropdownOpen, setIsSpeedDropdownOpen] = useState(false);

  // Refs for click outside detection
  const modelDropdownRef = useRef(null);
  const tempDropdownRef = useRef(null);
  const speedDropdownRef = useRef(null);

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

  // Find current example index within filtered list
  const currentIndex = filteredExamples.findIndex((ex) => ex.id === state.currentExampleId);

  const handleExampleChange = (exampleId) => {
    actions.loadExample(exampleId);
    setIsPromptDropdownOpen(false);
  };

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

  // Close speed dropdown when clicking outside
  useEffect(() => {
    if (!isSpeedDropdownOpen) return;

    const handleWindowClick = (event) => {
      if (speedDropdownRef.current && !speedDropdownRef.current.contains(event.target)) {
        setIsSpeedDropdownOpen(false);
      }
    };

    window.addEventListener('click', handleWindowClick);
    return () => window.removeEventListener('click', handleWindowClick);
  }, [isSpeedDropdownOpen]);

  /**
   * Get style for a token based on whether it's generated and its probability
   * @param {boolean} isGenerated - Whether the token is generated
   * @param {object} genStep - Generation step data
   * @param {number} tokenId - Token ID
   * @returns {object} Style object
   */
  const getTokenStyle = (isGenerated, genStep, tokenId) => {
    if (!isGenerated || !genStep) return {};

    const candidate = genStep.output_distribution?.candidates?.find((c) => c.token_id === tokenId);

    if (candidate) {
      const bgColor = getViridisColor(candidate.prob);
      // Viridis is dark at low values and light at high values
      // Use white text for low probabilities (dark background)
      const color = candidate.prob < 0.5 ? '#fff' : '#000';
      return {
        backgroundColor: bgColor,
        color: color,
      };
    }
    return {};
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
    // When moving forward, start from substep 1 (show probabilities immediately if not first step)
    // When moving backward or to step 0, start from substep 0
    if (state.currentStep > prevGlobalStep) {
      setSubStep(state.currentStep > 1 ? 1 : 0);
    } else {
      setSubStep(0);
    }
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
    const delay = (state.animationSpeed || 15) * 40;

    if (subStep >= 2) {
      const timer = setTimeout(() => {
        actions.nextStep();
      }, delay);
      return () => clearTimeout(timer);
    }

    // Advance local sub-step
    const timer = setTimeout(() => {
      setSubStep((s) => s + 1);
      // If global currentStep still 0, advance it so InputSection shows tokens underline style consistently
      if (state.currentStep === 0) actions.nextStep();
    }, delay);
    return () => clearTimeout(timer);
  }, [state.isPlaying, subStep, currentGen, state.currentStep, actions, state.animationSpeed]);

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
  const promptLength = state.currentExample?.generation_steps?.[0]?.tokens?.length || 0;
  const shouldShowTokens = tokens.length > 0 && (state.currentStep > 0 || subStep > 0);
  const candidates = displayGen?.output_distribution?.candidates || [];
  const maxBars = LAYOUT.MAX_OUTPUT_TOKENS || 7;
  const shownCandidates = candidates.slice(0, maxBars);
  const selectedToken = currentGen?.selected_token?.token;
  const selectedTokenId = currentGen?.selected_token?.token_id;

  // Get current model info for displaying in transformer box
  // If the selected model doesn't have decoding_view enabled, fall back to the first valid model
  const currentModelEntry = MODEL_REGISTRY[state.selectedModelIndex];
  const currentTempIcon = state.selectedTemperatureEmoji;
  const currentSpeedEntry =
    ANIMATION_SPEEDS.find((s) => s.value === state.animationSpeed) || ANIMATION_SPEEDS[1];

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
                      const prevTok = i > 0 ? tokens[i - 1] : null;

                      // Get probability for tooltip
                      let probability = null;
                      if (isGenerated && genStep) {
                        const candidate = genStep.output_distribution?.candidates?.find(
                          (c) => c.token_id === tokenId
                        );
                        if (candidate) {
                          probability = (candidate.prob * 100).toFixed(2);
                          if (probability === '0.00' && candidate.prob > 0) {
                            probability = (candidate.prob * 100).toPrecision(2);
                          }
                        }
                      }

                      return (
                        <span
                          key={i}
                          className={`io-token ${isSpecialTokenContextual(tok, prevTok) ? 'special' : ''}`}
                          style={style}
                          data-tooltip-id={
                            isGenerated && probability && !isMobile
                              ? 'token-probability-tooltip'
                              : undefined
                          }
                          data-tooltip-content={
                            probability ? `${t('tooltip_probability')}: ${probability}%` : undefined
                          }
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
                        data-tooltip-id={!isMobile ? 'token-probability-tooltip' : undefined}
                        data-tooltip-content={(() => {
                          const candidate = currentGen?.output_distribution?.candidates?.find(
                            (c) => c.token_id === selectedTokenId
                          );
                          if (candidate) {
                            let prob = (candidate.prob * 100).toFixed(2);
                            if (prob === '0.00' && candidate.prob > 0) {
                              prob = (candidate.prob * 100).toPrecision(2);
                            }
                            return `${t('tooltip_probability')}: ${prob}%`;
                          }
                          return undefined;
                        })()}
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
            data-tooltip-id={isMobile ? undefined : 'model-selector-tooltip'}
            data-tooltip-content={t('tooltip_select_model')}
          >
            <img
              src={
                new URL(`../assets/model-logos/${currentModelEntry?.logo}`, import.meta.url).href
              }
              alt=""
              className="model-logo-btn"
            />
            <span className="model-name">{currentModelEntry?.name || 'Model'}</span>
            <Icon path={mdiChevronDown} size={0.6} />
          </button>

          {isModelDropdownOpen && (
            <div className="model-dropdown-menu">
              {MODEL_REGISTRY.map((entry, idx) =>
                entry.decoding_view ? (
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
                ) : null
              )}
            </div>
          )}
        </div>

        {/* Temperature selector on the right */}
        <div className="transformer-right" ref={tempDropdownRef}>
          {/* Speed selector */}
          <div
            className="speed-selector-wrapper"
            ref={speedDropdownRef}
            style={{ position: 'relative' }}
          >
            <button
              className="speed-selector-btn"
              onClick={() => {
                setIsTempDropdownOpen(false);
                setIsSpeedDropdownOpen(!isSpeedDropdownOpen);
              }}
              aria-label="Select speed"
              data-tooltip-id={isMobile ? undefined : 'speed-tooltip'}
              data-tooltip-content={t('tooltip_speed') || 'Animation Speed'}
            >
              <Icon path={getSpeedIconPath(currentSpeedEntry.icon)} size={0.8} color="#666" />
            </button>

            {isSpeedDropdownOpen && (
              <div className="speed-dropdown-menu">
                {ANIMATION_SPEEDS.map((speed) => (
                  <button
                    key={speed.id}
                    className={`speed-dropdown-item ${state.animationSpeed === speed.value ? 'active' : ''}`}
                    onClick={() => {
                      actions.setAnimationSpeed(speed.value);
                      setIsSpeedDropdownOpen(false);
                    }}
                  >
                    <Icon path={getSpeedIconPath(speed.icon)} size={0.7} color="#666" />
                    <span>{t(speed.label) || speed.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            className="temp-selector-btn"
            onClick={() => {
              setIsSpeedDropdownOpen(false);
              setIsTempDropdownOpen(!isTempDropdownOpen);
            }}
            aria-label="Select temperature"
            data-tooltip-id={isMobile ? undefined : 'temperature-tooltip'}
            data-tooltip-content={t('tooltip_temperature')}
          >
            <span className="temp-emoji-btn" aria-hidden>
              <Icon path={getTemperatureIconPath(currentTempIcon)} size={0.7} color="#666" />
            </span>
          </button>

          {isTempDropdownOpen && (
            <div className="temp-dropdown-menu">
              {[
                { icon: 'snowflake', value: '0.0' },
                { icon: 'thermometer', value: '1.0' },
                { icon: 'fire', value: '5.0' },
              ].map(({ icon, value }) => (
                <button
                  key={icon}
                  className={`temp-dropdown-item ${state.selectedTemperatureEmoji === icon ? 'active' : ''}`}
                  onClick={() => {
                    actions.setSelectedTemperatureEmoji(icon);
                    setIsTempDropdownOpen(false);
                  }}
                  aria-label={`Temperature ${value}`}
                  title={`Temperature ${value}`}
                >
                  <span className="temp-emoji" aria-hidden>
                    <Icon path={getTemperatureIconPath(icon)} size={0.7} color="#666" />
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
            data-tooltip-id={isMobile ? undefined : 'special-tokens-tooltip'}
            data-tooltip-content={t('tooltip_show_special_tokens')}
          >
            <Icon path={mdiCodeTags} size={1} />
          </button>

          {/* Play/Pause button */}
          <button
            onClick={handlePlayPause}
            className="btn-play-transformer"
            aria-label={state.isPlaying ? t('pause') : t('play')}
            data-tooltip-id={isMobile ? undefined : 'play-pause-tooltip'}
            data-tooltip-content={t('tooltip_start_animation')}
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
                          d={
                            isMobile
                              ? `M 0 -15 h 3 V -${260 + idx * 30} h -20`
                              : `M 0 -15 h 110 q 20 0 20 -20 V -${190 + idx * 30} q 0 -20 -20 -20 h -5`
                          }
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

      {/* Initial hint - only shown before animation starts */}
      {state.currentStep === 0 && subStep === 0 && !state.isPlaying && <InitialHint />}

      {/* Removed old append-arrow div */}

      {/* Tooltips */}
      <Tooltip id="model-selector-tooltip" place="bottom" />
      <Tooltip id="temperature-tooltip" place="bottom" />
      <Tooltip id="special-tokens-tooltip" place="bottom" />
      <Tooltip id="play-pause-tooltip" place="bottom" />
      <Tooltip id="token-probability-tooltip" place="top" clickable />
    </div>
  );
}

export default GenerationSimpleView;
