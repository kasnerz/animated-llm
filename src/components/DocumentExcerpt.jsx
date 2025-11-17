import { useApp } from '../contexts/AppContext';
import { useI18n } from '../i18n/I18nProvider';
import { useEffect, useMemo, useRef, useState } from 'react';
import { getTokenColor } from '../visualization/core/colors';
import { processTokenForText } from '../utils/tokenProcessing';
import { MODEL_REGISTRY, getTemperatureEmoji } from '../config/modelConfig';
import translations from '../i18n/translations';
import '../styles/document-excerpt.css';
import Icon from '@mdi/react';
import { mdiPlay, mdiPause, mdiChevronDown } from '@mdi/js';

/**
 * DocumentExcerpt Component
 *
 * Displays a realistic document excerpt with a ragged/torn bottom edge
 * Used in TrainingView to show input text that appears cut from a document
 */
function DocumentExcerpt() {
  const { state, actions } = useApp();
  const { language } = useI18n();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const actionMenuRef = useRef(null);

  // Helper to get nested translations
  const getTrainingTranslation = (key) => {
    const currentLang = translations[language];
    const fallbackLang = translations.en;
    return currentLang?.training?.[key] || fallbackLang?.training?.[key] || key;
  };

  const handleExampleChange = (exampleId) => {
    actions.loadExample(exampleId);
    setIsDropdownOpen(false);
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

  // Filter examples by selected model and temperature (skip filters for training view)
  const filteredExamples = useMemo(() => {
    // In training view, show all loaded examples regardless of model/temperature
    if (state.viewType === 'training') {
      return state.examples;
    }

    const modelEntry = MODEL_REGISTRY[state.selectedModelIndex];
    const modelPattern = modelEntry
      ? typeof modelEntry.pattern === 'string'
        ? new RegExp(modelEntry.pattern, 'i')
        : modelEntry.pattern
      : null;

    return state.examples.filter((ex) => {
      const byModel = modelPattern ? modelPattern.test(ex.model_id || '') : true;
      // If temperature is missing, don't exclude the example
      const byTemp =
        ex.temperature == null
          ? true
          : getTemperatureEmoji(ex.temperature) === state.selectedTemperatureEmoji;
      return byModel && byTemp;
    });
  }, [state.examples, state.selectedModelIndex, state.selectedTemperatureEmoji, state.viewType]);

  // Find current example index within filtered list
  const currentIndex = filteredExamples.findIndex((ex) => ex.id === state.currentExampleId);

  // Ensure current example matches filter; if not, auto-load first matching
  useEffect(() => {
    if (!state.currentExampleId && filteredExamples.length > 0) return; // will load on language load
    const isCurrentValid = filteredExamples.some((ex) => ex.id === state.currentExampleId);
    if (!isCurrentValid && filteredExamples.length > 0) {
      actions.loadExample(filteredExamples[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.selectedModelIndex, state.selectedTemperatureEmoji, filteredExamples.length]);

  // Inference view: show tokenized prompt line with per-token colors once animation starts
  const shouldShowInferenceTokens =
    state.viewType === 'inference' && state.currentStep > 0 && state.currentExample;
  const inferenceTokens = shouldShowInferenceTokens
    ? state.currentExample?.generation_steps?.[0]?.tokens || []
    : [];

  // Training view: show tokenized document with progressive underline/target/grey styles
  const shouldShowTrainingTokens =
    state.viewType === 'training' && state.currentStep > 0 && state.currentExample;
  const allDocTokens = state.currentExample?.tokens || [];
  const trainingSteps = state.currentExample?.training_steps || [];
  const effTrainIdx = Math.max(1, state.currentStep); // skip step 0 (no inputs)
  const currentTrain = shouldShowTrainingTokens ? trainingSteps[effTrainIdx] : null;
  const inputCount = currentTrain?.input_tokens?.length || 0; // k

  // Get the prompt text and split into lines for adaptive display
  const promptText = state.currentExample?.prompt || state.currentExample?.text || '';
  const promptLines = promptText.split('\n').filter((line) => line.trim());

  // Calculate which line to show based on current step
  // For now, show the first line, but this can be made adaptive based on animation progress
  const currentLineIndex = 0; // TODO: Make this adaptive based on currentStep
  const displayText = promptLines[currentLineIndex] || promptText;

  // Close the compact action menu when clicking outside of it
  useEffect(() => {
    if (!isActionMenuOpen) return;

    const handleClickOutside = (event) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target)) {
        setIsActionMenuOpen(false);
      }
    };

    window.addEventListener('pointerdown', handleClickOutside);
    return () => window.removeEventListener('pointerdown', handleClickOutside);
  }, [isActionMenuOpen]);

  return (
    <section className="document-excerpt-section">
      {state.currentExample && (
        <div className="document-excerpt-container">
          {/* Document paper (content only) */}
          <div className="document-paper">
            {/* Paper texture overlay */}
            <div className="paper-texture"></div>

            {/* Embedded selector at the top */}
            <div className="document-header">
              <div className="selector-wrapper-embedded">
                <button
                  className="selector-button-embedded"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  aria-label="Select document"
                >
                  <span className="selector-text-embedded">
                    {`${getTrainingTranslation('document')} ${currentIndex + 1}/${filteredExamples.length}`}
                  </span>
                  <Icon path={mdiChevronDown} size={0.55} />
                </button>

                {isDropdownOpen && (
                  <div className="selector-dropdown-embedded">
                    {filteredExamples.map((example, index) => (
                      <button
                        key={example.id}
                        className={`selector-item ${index === currentIndex ? 'active' : ''}`}
                        onClick={() => handleExampleChange(example.id)}
                      >
                        <span className="selector-item-number">#{index + 1}</span>
                        <span className="selector-item-text">{example.prompt}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Document content - single line */}
            <div className="document-content-compact">
              <div className="document-text-compact">
                {shouldShowInferenceTokens ? (
                  <span className="tokenized-text">
                    {inferenceTokens.map((token, index) => (
                      <span
                        key={index}
                        className="token-with-highlight"
                        style={{
                          backgroundColor: `${getTokenColor(index)}20`,
                          borderBottom: `2px solid ${getTokenColor(index)}`,
                        }}
                      >
                        {processTokenForText(token)}
                      </span>
                    ))}
                  </span>
                ) : shouldShowTrainingTokens ? (
                  <span className="tokenized-text">
                    {allDocTokens.map((tok, idx) => {
                      const isInput = idx < inputCount;
                      const isTarget = idx === inputCount; // predict next token
                      const cls = isTarget
                        ? 'doc-token-target'
                        : isInput
                          ? 'doc-token-input'
                          : 'doc-token-muted';
                      return (
                        <span key={idx} className={`token-with-highlight ${cls}`}>
                          {processTokenForText(tok)}
                        </span>
                      );
                    })}
                  </span>
                ) : (
                  displayText
                )}
              </div>
            </div>
          </div>

          {/* Torn/ragged edge rendered as a separate element directly below the document */}
          <div className="torn-edge-wrapper" aria-hidden="true">
            <svg
              className="torn-edge-compact"
              viewBox="0 0 100 8"
              preserveAspectRatio="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <polyline
                points="0,0 10,4 20,1 30,5 40,2 50,4 60,0 70,5 80,2 90,4 100,0"
                fill="none"
                stroke="var(--document-border)"
                strokeWidth="1.25"
                strokeLinecap="square"
                strokeLinejoin="bevel"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          </div>

          {/* Control buttons */}
          <div className="document-controls">
            <button
              className="btn-play-document"
              onClick={handlePlayPause}
              disabled={!state.currentExample}
              aria-label={state.isPlaying ? 'Pause' : 'Play'}
            >
              <Icon path={state.isPlaying ? mdiPause : mdiPlay} size={1} />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

export default DocumentExcerpt;
