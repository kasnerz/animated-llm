import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Icon from '@mdi/react';
import {
  mdiChevronDown,
  mdiPause,
  mdiPlay,
  mdiSpeedometerSlow,
  mdiSpeedometerMedium,
  mdiSpeedometer,
} from '@mdi/js';
import { useApp } from '../contexts/AppContext';
import { useI18n } from '../i18n/I18nProvider';
import { ANIMATION_SPEEDS } from '../visualization/core/constants';
import InitialHint from '../components/InitialHint';
import ModelCapabilities from '../components/ModelCapabilities';
import LossCurve from '../components/LossCurve';
import TrainingDocumentCarousel from '../components/TrainingDocumentCarousel';
import { MODEL_REGISTRY, getModelInfo } from '../config/modelConfig';
import { processTokenForList } from '../utils/tokenProcessing';
import { probabilityScale, formatProbability } from '../utils/probabilityFormat';
import { Tooltip } from 'react-tooltip';
import '../styles/pretraining-simple.css';

const MAX_DISTRIBUTION_ROWS = 8;

/**
 * Get a candidate's probability. Very small probabilities are stored as 0 in the data
 * (low-precision softmax), so fall back to the more precise log-probability.
 * @param {object} candidate - Object with `prob` and optionally `logprob`
 * @returns {number} Probability in [0, 1]
 */
function candidateProb(candidate) {
  if (candidate?.prob > 0) return candidate.prob;
  if (typeof candidate?.logprob === 'number') return Math.exp(candidate.logprob);
  return 0;
}

/**
 * Format a probability for the training view with one decimal place.
 * Non-zero values below 0.1% are shown as "<0.1%" instead of a misleading "0.0%".
 * @param {number} prob - Probability in [0, 1]
 * @returns {string} Formatted percentage
 */
function formatTrainingProbability(prob) {
  if (prob > 0 && prob < 0.001) return '<0.1%';
  return formatProbability(prob, 1);
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

function PretrainingSimpleView() {
  const { state, actions } = useApp();
  const { t } = useI18n();
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isSpeedDropdownOpen, setIsSpeedDropdownOpen] = useState(false);
  const modelDropdownRef = useRef(null);
  const speedDropdownRef = useRef(null);

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 760);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Use state to track previous values for comparison
  const [prevState, setPrevState] = useState({
    currentStep: state.currentStep,
    currentExampleId: state.currentExampleId,
  });
  const [subStep, setSubStep] = useState(0);
  // The probability list starts collapsed and stays open until another document is selected
  const [showProbabilities, setShowProbabilities] = useState(false);

  // Check if we need to reset substep based on state changes
  if (
    state.currentStep !== prevState.currentStep ||
    state.currentExampleId !== prevState.currentExampleId
  ) {
    if (state.currentExampleId !== prevState.currentExampleId && showProbabilities) {
      setShowProbabilities(false);
    }
    // Update previous state and reset substep
    setPrevState({
      currentStep: state.currentStep,
      currentExampleId: state.currentExampleId,
    });
    if (subStep !== (state.currentStep > 0 ? 1 : 0)) {
      setSubStep(state.currentStep > 0 ? 1 : 0);
    }
  }

  const trainingSteps = state.currentExample?.training_steps || [];
  const effectiveStepIndex = useMemo(() => {
    if (!trainingSteps.length) return -1;
    let stepIndex = state.currentStep;

    // If we are in a subsequent step (step > 1) but haven't reached substep 2 yet,
    // we should show the previous step's data to delay the update.
    if (stepIndex > 1 && subStep < 2) {
      stepIndex = stepIndex - 1;
    }

    const safeIndex = Math.max(1, stepIndex);
    return Math.min(trainingSteps.length - 1, safeIndex);
  }, [trainingSteps.length, state.currentStep, subStep]);

  const currentTrainStep =
    effectiveStepIndex >= 0 ? trainingSteps[effectiveStepIndex] : trainingSteps[0];

  const targetTokenLabel =
    currentTrainStep?.target_token || currentTrainStep?.target_token_prediction?.token;

  const currentSpeedEntry =
    ANIMATION_SPEEDS.find((s) => s.value === state.animationSpeed) || ANIMATION_SPEEDS[1];

  // Close dropdown on outside click
  useEffect(() => {
    if (!isModelDropdownOpen) return;
    const handleClick = (event) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target)) {
        setIsModelDropdownOpen(false);
      }
    };
    window.addEventListener('pointerdown', handleClick);
    return () => window.removeEventListener('pointerdown', handleClick);
  }, [isModelDropdownOpen]);

  // Close speed dropdown on outside click
  useEffect(() => {
    if (!isSpeedDropdownOpen) return;
    const handleClick = (event) => {
      if (speedDropdownRef.current && !speedDropdownRef.current.contains(event.target)) {
        setIsSpeedDropdownOpen(false);
      }
    };
    window.addEventListener('pointerdown', handleClick);
    return () => window.removeEventListener('pointerdown', handleClick);
  }, [isSpeedDropdownOpen]);

  const handlePlayPause = useCallback(() => {
    if (!state.currentExample) return;
    if (state.currentStep === 0) {
      actions.nextStep();
      actions.setIsPlaying(true);
      return;
    }
    actions.setIsPlaying(!state.isPlaying);
  }, [state.currentExample, state.currentStep, state.isPlaying, actions]);

  // Keyboard shortcuts for manual stepping
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.matches('input, textarea')) return;

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (state.isPlaying) actions.setIsPlaying(false);

        const maxLocalSubStep = 3;
        if (subStep < maxLocalSubStep) {
          setSubStep((s) => s + 1);
        } else {
          actions.nextStep();
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (state.isPlaying) actions.setIsPlaying(false);

        if (subStep > 0) {
          setSubStep((s) => s - 1);
        } else {
          actions.prevStep();
        }
      } else if (e.key === ' ') {
        e.preventDefault();
        handlePlayPause();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.isPlaying, subStep, actions, handlePlayPause]);

  // Drive simplified animation loop
  useEffect(() => {
    if (!state.isPlaying) return;
    if (!state.currentExample) return;
    const maxLocalSubStep = 3; // 0..3
    const delay = (state.animationSpeed || 15) * 45;

    if (subStep >= maxLocalSubStep) {
      const timer = setTimeout(() => {
        actions.nextStep();
      }, delay);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(() => {
      setSubStep((s) => s + 1);
      if (state.currentStep === 0) {
        actions.nextStep();
      }
    }, delay);
    return () => clearTimeout(timer);
  }, [
    state.isPlaying,
    subStep,
    state.currentExample,
    state.currentStep,
    actions,
    state.animationSpeed,
  ]);

  // Get current model info for displaying in transformer box
  // If the selected model doesn't have training_view enabled, fall back to the first valid model
  const currentModelEntry = MODEL_REGISTRY[state.selectedModelIndex]?.training_view
    ? MODEL_REGISTRY[state.selectedModelIndex]
    : MODEL_REGISTRY.find((entry) => entry.training_view);
  const currentModelInfo = state.currentExample?.model_id
    ? getModelInfo(state.currentExample.model_id)
    : currentModelEntry
      ? {
          name: currentModelEntry.name,
          logo: currentModelEntry.logo,
          size: currentModelEntry.size,
          id: currentModelEntry.id,
          repo: currentModelEntry.repo,
          instruction_tuned: currentModelEntry.instruction_tuned,
          reasoning: currentModelEntry.reasoning,
        }
      : null;
  const transformerLogo = currentModelInfo?.logo || currentModelEntry?.logo;
  const transformerName = currentModelInfo?.name || currentModelEntry?.name || 'Model';

  const distribution = useMemo(() => {
    if (!currentTrainStep) return { rows: [], probScale: 1, shownTokenCount: 0 };
    const maxRows = isMobile ? 5 : MAX_DISTRIBUTION_ROWS;
    const predictions = currentTrainStep.predictions || [];
    const targetId = currentTrainStep.target_token_id;
    const targetToken = currentTrainStep.target_token;
    const targetCandidate =
      currentTrainStep.target_token_prediction ||
      (targetToken
        ? {
            token: targetToken,
            token_id: targetId,
            prob: 0,
          }
        : null);

    const hasTargetInPredictions = predictions.some((p) => {
      if (!p) return false;
      if (targetId != null && p.token_id === targetId) return true;
      if (targetId == null && targetToken && p.token === targetToken) return true;
      return false;
    });

    let rows = predictions.slice(0, maxRows);

    if (!hasTargetInPredictions && targetCandidate) {
      if (predictions.length >= maxRows) {
        rows = [
          ...predictions.slice(0, maxRows - 2),
          { token: '...', token_id: null, prob: 0, isEllipsis: true },
          { ...targetCandidate, isInjectedTarget: true },
        ];
      } else {
        rows = [...rows, { ...targetCandidate, isInjectedTarget: true }];
      }
    }

    const seen = new Set();
    const normalized = [];
    rows.forEach((row) => {
      if (!row) return;
      if (row.isEllipsis || row.token === '...') {
        if (!normalized.some((item) => item.isEllipsis)) {
          normalized.push({ ...row, isEllipsis: true });
        }
        return;
      }
      const key = row.token_id ?? row.token;
      if (key && seen.has(key)) return;
      if (key) seen.add(key);
      normalized.push(row);
    });

    // Renormalize when the stored probabilities sum above 1 (low-precision softmax)
    const probScale = probabilityScale([
      ...predictions.map((p) => candidateProb(p)),
      ...(!hasTargetInPredictions && targetCandidate ? [candidateProb(targetCandidate)] : []),
    ]);

    const visible = normalized.slice(0, maxRows);

    const displayRows = visible.map((row, index) => {
      const isEllipsis = row.isEllipsis || row.token === '...';
      const isTarget =
        !isEllipsis &&
        ((targetId != null && row.token_id === targetId) ||
          (targetId == null && targetToken && row.token === targetToken));
      const predictedProb = candidateProb(row) * probScale;
      const targetProb = isTarget ? 1 : 0;
      const deltaPct = (targetProb - predictedProb) * 100;
      const displayToken = isEllipsis ? '⋯' : processTokenForList(row.token);

      return {
        id: `${row.token_id ?? row.token ?? index}-${index}`,
        displayToken,
        rawToken: row.token,
        predictedProb,
        targetProb,
        diff: deltaPct,
        isTarget,
        isEllipsis,
      };
    });

    // Aggregate everything not listed into a final "other tokens" row
    const tokenRows = displayRows.filter((row) => !row.isEllipsis);
    const shownProb = tokenRows.reduce((acc, row) => acc + row.predictedProb, 0);
    const otherProb = Math.max(0, 1 - shownProb);
    displayRows.push({
      id: 'other-tokens',
      predictedProb: otherProb,
      targetProb: 0,
      diff: -otherProb * 100,
      isTarget: false,
      isEllipsis: false,
      isOther: true,
    });

    return { rows: displayRows, probScale, shownTokenCount: tokenRows.length };
  }, [currentTrainStep, isMobile]);

  const distributionRows = distribution.rows;

  const lossSummary = useMemo(() => {
    const targetRow = distributionRows.find((r) => r.isTarget);
    const p =
      currentTrainStep?.target_prob != null
        ? candidateProb({
            prob: currentTrainStep.target_prob,
            logprob: currentTrainStep.target_logprob,
          }) * distribution.probScale
        : (targetRow?.predictedProb ?? 0);
    const error =
      currentTrainStep?.loss != null
        ? Number(currentTrainStep.loss)
        : p > 0
          ? -Math.log(p)
          : Infinity;
    return { prob: p, error };
  }, [distributionRows, distribution.probScale, currentTrainStep]);

  const errorLabel = (t('model_error_log_p') || 'Model error (−log(p))').replace(/:\s*$/, '');

  const placeholderMessage = (
    <div className="decoding-placeholder">
      <p className="placeholder-text">
        {t('select_example_prompt') || 'Select an example to begin.'}
      </p>
    </div>
  );

  const isSubsequentStep = state.currentStep > 1;
  const showDocArrow = !!state.currentExample;
  const showTransformer = state.currentExample; // Always show when example is loaded
  const showDistributions = (subStep >= 2 || isSubsequentStep) && distribution.shownTokenCount > 0;
  const showFeedback = subStep >= 3;
  const showProcessing = subStep === 2;

  return (
    <div className="pretraining-simple-container">
      {!state.currentExample && placeholderMessage}

      {state.currentExample && (
        <div className="pretraining-simple-main">
          <div className="pretraining-simple-docs">
            <TrainingDocumentCarousel showPlayButton={false} />
          </div>

          {showDocArrow && (
            <div
              className={`pretraining-doc-arrow ${showProcessing ? 'active' : ''}`}
              aria-hidden="true"
            >
              <div className="shaft" />
              <div className="head" />
            </div>
          )}

          {showTransformer && (
            <div
              className={`transformer-box training-simple ${showFeedback ? 'feedback-active' : ''} ${showProcessing ? 'processing-active' : ''}`}
            >
              <div className="transformer-left" ref={modelDropdownRef}>
                <button
                  className="model-selector-btn"
                  onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                  aria-label="Select model"
                  data-tooltip-id={isMobile ? undefined : 'model-selector-tooltip'}
                  data-tooltip-content={t('tooltip_select_model')}
                >
                  {transformerLogo && (
                    <img
                      src={
                        new URL(`../assets/model-logos/${transformerLogo}`, import.meta.url).href
                      }
                      alt=""
                      className="model-logo-btn"
                    />
                  )}
                  <span className="model-name">{transformerName}</span>
                  <Icon path={mdiChevronDown} size={0.6} />
                </button>

                {isModelDropdownOpen && (
                  <div className="model-dropdown-menu">
                    {MODEL_REGISTRY.map((entry, idx) =>
                      entry.training_view ? (
                        <button
                          key={idx}
                          className={`model-dropdown-item ${state.selectedModelIndex === idx ? 'active' : ''}`}
                          onClick={() => {
                            actions.setSelectedModelIndex(idx);
                            setIsModelDropdownOpen(false);
                            // When switching models in training view, load the first matching example
                            if (state.viewType === 'training') {
                              try {
                                const pattern =
                                  typeof entry.pattern === 'string'
                                    ? new RegExp(entry.pattern, 'i')
                                    : entry.pattern;
                                const match = (state.examples || []).find((ex) =>
                                  pattern ? pattern.test(ex.model_id || '') : true
                                );
                                if (match?.id) {
                                  actions.loadExample(match.id);
                                }
                              } catch {
                                // no-op on pattern issues
                              }
                            }
                          }}
                          title={entry.name || 'Model'}
                        >
                          <img
                            src={
                              new URL(`../assets/model-logos/${entry.logo}`, import.meta.url).href
                            }
                            alt=""
                            className="model-logo-small"
                          />
                          <span className="model-info">{entry.name || entry.size}</span>
                        </button>
                      ) : null
                    )}
                  </div>
                )}

                <ModelCapabilities model={currentModelInfo} />
              </div>

              <div className="transformer-right">
                {/* Speed selector */}
                <div
                  className="speed-selector-wrapper"
                  ref={speedDropdownRef}
                  style={{ position: 'relative', marginRight: '8px' }}
                >
                  <button
                    className="speed-selector-btn"
                    onClick={() => setIsSpeedDropdownOpen(!isSpeedDropdownOpen)}
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
          )}

          {showDistributions && !showFeedback && (
            <div
              className={`arrow arrow-down ${showProcessing ? 'active' : ''}`}
              aria-hidden="true"
            >
              <div className="shaft" />
              <div className="head" />
            </div>
          )}

          {showFeedback && (
            <div className="arrow arrow-up gradient-feedback" aria-hidden="true">
              <div className="shaft" />
              <div className="head" />
            </div>
          )}

          {showDistributions && (
            <div className="pretraining-distribution-stage">
              <div className="pretraining-stage-column">
                <div className="loss-panel">
                  <div className="loss-stats">
                    <div className="loss-stat">
                      <span className="training-stat-label">
                        {t('target_token') || 'Target token'}
                      </span>
                      <span className="loss-stat-value">
                        <span className="target-token-highlight">
                          {processTokenForList(targetTokenLabel)}
                        </span>
                      </span>
                    </div>
                    <div className="loss-stat">
                      <span className="training-stat-label">{t('predicted_probability_p')}</span>
                      <span className="loss-stat-value prob">
                        {formatTrainingProbability(lossSummary.prob)}
                      </span>
                    </div>
                    <div className="loss-stat">
                      <span className="training-stat-label">{errorLabel}</span>
                      <span className="loss-stat-value error">
                        {Number.isFinite(lossSummary.error) ? lossSummary.error.toFixed(3) : '∞'}
                      </span>
                    </div>
                  </div>
                  <figure className="loss-chart">
                    <LossCurve
                      prob={lossSummary.prob}
                      error={lossSummary.error}
                      probLabel={t('loss_chart_x_label')}
                      errorLabel={t('loss_chart_y_label')}
                    />
                  </figure>
                </div>

                <button
                  type="button"
                  className={`probabilities-toggle ${showProbabilities ? 'open' : ''}`}
                  onClick={() => setShowProbabilities((open) => !open)}
                  aria-expanded={showProbabilities}
                  aria-controls="pretraining-probabilities"
                >
                  <Icon path={mdiChevronDown} size={0.75} className="probabilities-toggle-icon" />
                  {showProbabilities ? t('hide_probabilities') : t('show_probabilities')}
                </button>

                {showProbabilities && (
                  <div id="pretraining-probabilities" className="distribution-column output">
                    <div className="distribution-side-label">
                      {t('predicted_probabilities_top_tokens') || 'Predicted probabilities'}
                    </div>
                    <div className="distribution-body">
                      {distributionRows.map((row) => {
                        if (row.isEllipsis) {
                          return (
                            <div key={`out-${row.id}`} className="distribution-row ellipsis">
                              <div className="token-label">⋮</div>
                            </div>
                          );
                        }
                        const widthPct = Math.max(2, row.predictedProb * 100);
                        // Training raises the target's probability and lowers all the others
                        const change = showFeedback ? (row.isTarget ? 'push-up' : 'push-down') : '';
                        const rowClasses = [
                          'distribution-row',
                          row.isTarget && 'is-target',
                          row.isOther && 'other-row',
                          change,
                        ]
                          .filter(Boolean)
                          .join(' ');
                        return (
                          <div key={`out-${row.id}`} className={rowClasses}>
                            <div className={`token-label ${row.isOther ? 'other-label' : ''}`}>
                              {row.isOther ? (
                                t('other_tokens')
                              ) : row.isTarget ? (
                                <span className="target-token-highlight">{row.displayToken}</span>
                              ) : (
                                row.displayToken
                              )}
                            </div>
                            <div className="value-label">
                              {change && (
                                <span className="change-glyph" aria-hidden="true">
                                  {row.isTarget ? '▲' : '▼'}
                                </span>
                              )}
                              {formatTrainingProbability(row.predictedProb)}
                            </div>
                            <div className="bar-track">
                              {showFeedback && row.isTarget && <div className="goal-outline" />}
                              <div
                                className={`bar-fill ${row.isOther ? 'other-fill' : ''}`}
                                style={{ width: `${widthPct}%` }}
                              />
                              {/* Only draw the arrow when there is room for it next to the bar */}
                              {showFeedback && row.isTarget && widthPct < 92 && (
                                <div
                                  className="goal-arrow"
                                  style={{
                                    left: `${widthPct}%`,
                                    width: `${100 - widthPct}%`,
                                  }}
                                >
                                  <div className="goal-arrow-shaft" />
                                  <div className="goal-arrow-head" />
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {state.currentStep === 0 && subStep === 0 && !state.isPlaying && <InitialHint />}
        </div>
      )}

      {/* Tooltips */}
      <Tooltip id="model-selector-tooltip" place="bottom" />
      <Tooltip id="play-pause-tooltip" place="bottom" />
    </div>
  );
}

export default PretrainingSimpleView;
