import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Icon from '@mdi/react';
import { mdiChevronDown, mdiPause, mdiPlay } from '@mdi/js';
import { useApp } from '../contexts/AppContext';
import { useI18n } from '../i18n/I18nProvider';
import InfoBox from '../components/InfoBox';
import InitialHint from '../components/InitialHint';
import TrainingDocumentCarousel from '../components/TrainingDocumentCarousel';
import { MODEL_REGISTRY, getModelInfo } from '../config/modelConfig';
import { processTokenForText } from '../utils/tokenProcessing';
import { getViridisColor } from '../utils/colorSchemes';
import '../styles/pretraining-simple.css';

const MAX_DISTRIBUTION_ROWS = 10;

function PretrainingSimpleView() {
  const { state, actions } = useApp();
  const { t } = useI18n();
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const modelDropdownRef = useRef(null);

  // Use state to track previous values for comparison
  const [prevState, setPrevState] = useState({
    currentStep: state.currentStep,
    currentExampleId: state.currentExampleId,
  });
  const [subStep, setSubStep] = useState(0);

  // Check if we need to reset substep based on state changes
  if (
    state.currentStep !== prevState.currentStep ||
    state.currentExampleId !== prevState.currentExampleId
  ) {
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

    if (subStep >= maxLocalSubStep) {
      const timer = setTimeout(() => {
        actions.nextStep();
      }, 700);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(() => {
      setSubStep((s) => s + 1);
      if (state.currentStep === 0) {
        actions.nextStep();
      }
    }, 700);
    return () => clearTimeout(timer);
  }, [state.isPlaying, subStep, state.currentExample, state.currentStep, actions]);

  const currentModelEntry = MODEL_REGISTRY[state.selectedModelIndex];
  const currentModelInfo = state.currentExample?.model_id
    ? getModelInfo(state.currentExample.model_id)
    : currentModelEntry
      ? {
          name: currentModelEntry.name,
          logo: currentModelEntry.logo,
          size: currentModelEntry.size,
        }
      : null;
  const transformerLogo = currentModelInfo?.logo || currentModelEntry?.logo;
  const transformerName = currentModelInfo?.name || currentModelEntry?.name || 'Model';

  const distributionRows = useMemo(() => {
    if (!currentTrainStep) return [];
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

    let rows = predictions.slice(0, MAX_DISTRIBUTION_ROWS);

    if (!hasTargetInPredictions && targetCandidate) {
      if (predictions.length >= MAX_DISTRIBUTION_ROWS) {
        rows = [
          ...predictions.slice(0, MAX_DISTRIBUTION_ROWS - 2),
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

    return normalized.slice(0, MAX_DISTRIBUTION_ROWS).map((row, index) => {
      const isEllipsis = row.isEllipsis || row.token === '...';
      const isTarget =
        !isEllipsis &&
        ((targetId != null && row.token_id === targetId) ||
          (targetId == null && targetToken && row.token === targetToken));
      const predictedProb = typeof row.prob === 'number' && row.prob > 0 ? row.prob : 0;
      const targetProb = isTarget ? 1 : 0;
      const deltaPct = (targetProb - predictedProb) * 100;
      const displayToken = isEllipsis ? '⋯' : processTokenForText(row.token);

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
  }, [currentTrainStep]);

  const maxPredictionProb = Math.max(
    0.001,
    ...distributionRows.map((row) => row.predictedProb || 0)
  );

  const placeholderMessage = (
    <div className="decoding-placeholder">
      <p className="placeholder-text">
        {t('select_example_prompt') || 'Select an example to begin.'}
      </p>
    </div>
  );

  const isSubsequentStep = state.currentStep > 1;
  const showDocArrow = state.currentStep > 0 && state.currentExample;
  const showTransformer = state.currentExample; // Always show when example is loaded
  const showDistributions = (subStep >= 2 || isSubsequentStep) && distributionRows.length > 0;
  const showFeedback = subStep >= 3;
  const showProcessing = subStep === 2;

  return (
    <div className="pretraining-simple-container">
      <InfoBox />

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

              <div className="transformer-right">
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
              <div className="pretraining-simple-distributions">
                <div className="distribution-column output">
                  <div className="column-header">{t('model_output') || 'Model Output'}</div>
                  <div className="distribution-body">
                    {distributionRows.map((row) => {
                      const pctLabel = `${(row.predictedProb * 100).toFixed(1)}%`;
                      const widthPct = Math.max(4, (row.predictedProb / maxPredictionProb) * 90);
                      return (
                        <div
                          key={`out-${row.id}`}
                          className={`distribution-row ${row.isTarget ? 'is-target' : ''}`}
                        >
                          <div className="token-label">{row.displayToken}</div>
                          <div className="bar-track">
                            <div
                              className="bar-fill"
                              style={{
                                width: `${widthPct}%`,
                                backgroundColor: getViridisColor(row.predictedProb || 0),
                              }}
                            />
                          </div>
                          <div className="value-label">{row.isEllipsis ? '' : pctLabel}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="distribution-column diff">
                  <div className="column-header">{t('difference') || 'Difference'}</div>
                  <div className="distribution-body">
                    {distributionRows.map((row) => {
                      if (row.isEllipsis) {
                        return (
                          <div key={`diff-${row.id}`} className="distribution-row ellipsis">
                            <div className="value-label">⋯</div>
                          </div>
                        );
                      }

                      const diffLabel = `${row.diff > 0 ? '+' : ''}${row.diff.toFixed(1)}%`;
                      const trendClass = row.diff >= 0 ? 'positive' : 'negative';
                      return (
                        <div
                          key={`diff-${row.id}`}
                          className={`distribution-row diff-row ${trendClass}`}
                        >
                          <div className="value-label">{diffLabel}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="distribution-column target">
                  <div className="column-header">
                    {t('target_token') || 'Target token'}:{' '}
                    <span className="target-token-highlight">
                      {processTokenForText(targetTokenLabel)}
                    </span>
                  </div>
                  <div className="distribution-body">
                    {distributionRows.map((row) => {
                      const width = row.targetProb * 100;
                      return (
                        <div
                          key={`target-${row.id}`}
                          className={`distribution-row ${row.isTarget ? 'is-target' : ''}`}
                        >
                          <div className="token-label">{row.displayToken}</div>
                          <div className="bar-track target">
                            <div className="bar-fill target" style={{ width: `${width}%` }} />
                          </div>
                          <div className="value-label">
                            {row.targetProb > 0 ? '100%' : row.isEllipsis ? '' : '0%'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {state.currentStep === 0 && subStep === 0 && !state.isPlaying && <InitialHint />}
        </div>
      )}
    </div>
  );
}

export default PretrainingSimpleView;
