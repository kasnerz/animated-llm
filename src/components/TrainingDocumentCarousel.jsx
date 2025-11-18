import { useApp } from '../contexts/AppContext';
import { useI18n } from '../i18n/I18nProvider';
import { useEffect, useMemo, useRef } from 'react';
import { processTokenForText } from '../utils/tokenProcessing';
import { MODEL_REGISTRY, getTemperatureEmoji } from '../config/modelConfig';
import translations from '../i18n/translations';
import '../styles/training-carousel.css';
import Icon from '@mdi/react';
import { mdiPlay, mdiPause, mdiChevronLeft, mdiChevronRight } from '@mdi/js';

/**
 * TrainingDocumentCarousel Component
 *
 * Displays a carousel of document excerpts with left/center/right positioning
 * Used in TrainingView to show multiple documents with the active one in the center
 */
function TrainingDocumentCarousel() {
  const { state, actions } = useApp();
  const { language } = useI18n();

  // Helper to get nested translations
  const getTrainingTranslation = (key) => {
    const currentLang = translations[language];
    const fallbackLang = translations.en;
    return currentLang?.training?.[key] || fallbackLang?.training?.[key] || key;
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

  // Navigation functions
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < filteredExamples.length - 1;

  const handlePrev = () => {
    if (canGoPrev) {
      actions.loadExample(filteredExamples[currentIndex - 1].id);
    }
  };

  const handleNext = () => {
    if (canGoNext) {
      actions.loadExample(filteredExamples[currentIndex + 1].id);
    }
  };

  // Get documents for carousel: left, center, right
  const leftDoc = currentIndex > 0 ? filteredExamples[currentIndex - 1] : null;
  const centerDoc = currentIndex >= 0 ? filteredExamples[currentIndex] : null;
  const rightDoc =
    currentIndex < filteredExamples.length - 1 ? filteredExamples[currentIndex + 1] : null;

  const activeDocContentRef = useRef(null);

  // Training view: show tokenized document with progressive underline/target/grey styles
  const shouldShowTrainingTokens = state.currentStep > 0 && state.currentExample;
  const allDocTokens = state.currentExample?.tokens || [];
  const trainingSteps = state.currentExample?.training_steps || [];
  const effTrainIdx = Math.max(1, state.currentStep); // skip step 0 (no inputs)
  const currentTrain = shouldShowTrainingTokens ? trainingSteps[effTrainIdx] : null;
  const inputCount = currentTrain?.input_tokens?.length || 0; // k

  // Compute the index of the token that is currently being predicted ("active" token)
  const activeTokenIndex = shouldShowTrainingTokens
    ? Math.min(allDocTokens.length - 1, Math.max(0, inputCount))
    : -1;

  // When the active token moves, ensure it stays within the visible area of the
  // compact single-line document view by adjusting scrollLeft on the content container.
  useEffect(() => {
    const container = activeDocContentRef.current;
    if (!container || activeTokenIndex < 0) return;

    const tokenNodes = container.querySelectorAll('.token-with-highlight');
    const target = tokenNodes[activeTokenIndex];
    if (!target) return;

    const containerRect = container.getBoundingClientRect();
    const tokenRect = target.getBoundingClientRect();

    // Use current scroll position as baseline
    const currentScroll = container.scrollLeft || 0;

    // Compute token position relative to container content box
    const offsetLeft = tokenRect.left - containerRect.left + currentScroll;
    const offsetRight = tokenRect.right - containerRect.left + currentScroll;

    // Only adjust when the token goes out of view to keep motion minimal
    if (offsetLeft < currentScroll) {
      container.scrollTo({ left: offsetLeft, behavior: 'smooth' });
    } else if (offsetRight > currentScroll + containerRect.width) {
      const nextScroll = offsetRight - containerRect.width;
      container.scrollTo({ left: nextScroll, behavior: 'smooth' });
    }
  }, [activeTokenIndex, state.currentExampleId]);

  // Helper to render a document
  const renderDocument = (example, position, isActive) => {
    if (!example) return null;

    const exampleIndex = filteredExamples.findIndex((ex) => ex.id === example.id);
    const displayText = example.prompt || example.text || '';
    const sourceLabel =
      example.source || `${getTrainingTranslation('document')} ${exampleIndex + 1}`;

    return (
      <div
        key={example.id}
        className={`carousel-document ${position} ${isActive ? 'active' : 'inactive'}`}
      >
        {/* Document paper */}
        <div className="document-paper">
          {/* Paper texture overlay */}
          <div className="paper-texture"></div>

          {/* Document header with source label */}
          <div className="document-header">
            <div className="document-source-label">{sourceLabel}</div>
          </div>

          {/* Document content */}
          <div className="document-content-compact">
            <div className="document-text-compact" ref={isActive ? activeDocContentRef : undefined}>
              {isActive && shouldShowTrainingTokens ? (
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

          {/* Play button - only for active document */}
          {isActive && (
            <div className="document-play-button">
              <button
                className="btn-play-document"
                onClick={handlePlayPause}
                disabled={!state.currentExample}
                aria-label={state.isPlaying ? 'Pause' : 'Play'}
              >
                <Icon path={state.isPlaying ? mdiPause : mdiPlay} size={1} />
              </button>
            </div>
          )}
        </div>

        {/* Torn edge */}
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
      </div>
    );
  };

  return (
    <section className="training-carousel-section">
      {/* Navigation arrows */}
      <button
        className={`carousel-nav-arrow left ${!canGoPrev ? 'disabled' : ''}`}
        onClick={handlePrev}
        disabled={!canGoPrev}
        aria-label="Previous document"
      >
        <Icon path={mdiChevronLeft} size={1.5} />
      </button>

      {/* Carousel container */}
      <div className="carousel-container">
        {/* Documents */}
        <div className="carousel-track">
          <div className="carousel-document-wrapper left">
            {renderDocument(leftDoc, 'left', false)}
          </div>
          <div className="carousel-document-wrapper center">
            {renderDocument(centerDoc, 'center', true)}
          </div>
          <div className="carousel-document-wrapper right">
            {renderDocument(rightDoc, 'right', false)}
          </div>
        </div>
      </div>

      <button
        className={`carousel-nav-arrow right ${!canGoNext ? 'disabled' : ''}`}
        onClick={handleNext}
        disabled={!canGoNext}
        aria-label="Next document"
      >
        <Icon path={mdiChevronRight} size={1.5} />
      </button>
    </section>
  );
}

export default TrainingDocumentCarousel;
