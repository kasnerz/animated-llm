import { useApp } from '../contexts/AppContext';
import { useI18n } from '../i18n/I18nProvider';
import { useEffect, useMemo, useRef, useState } from 'react';
import { processTokenForText } from '../utils/tokenProcessing';
import { MODEL_REGISTRY, getTemperatureEmoji } from '../config/modelConfig';
import translations from '../i18n/translations';
import { Tooltip } from 'react-tooltip';
import '../styles/training-carousel.css';
import Icon from '@mdi/react';
import { mdiPlay, mdiPause, mdiChevronLeft, mdiChevronRight } from '@mdi/js';

// Import document source icons
import wikipediaIcon from '../assets/docs/wikipedia.png';
import bookIcon from '../assets/docs/book.png';
import pythonIcon from '../assets/docs/python.png';

/**
 * Helper function to determine the document source icon based on the source string
 * @param {string} source - The source field from the example data
 * @returns {string|null} - The icon URL or null if no icon matches
 */
const getSourceIcon = (source) => {
  if (!source) return null;
  const lowerSource = source.toLowerCase();

  // Check for Wikipedia URLs
  if (lowerSource.includes('wikipedia.org')) {
    return wikipediaIcon;
  }

  // Check for Python code
  if (lowerSource.includes('python') || lowerSource.includes('.py')) {
    return pythonIcon;
  }

  // Check for book sources (if it's not a URL and not Python, assume it's a book)
  if (!lowerSource.startsWith('http')) {
    return bookIcon;
  }

  return null;
};

/**
 * TrainingDocumentCarousel Component
 *
 * Displays a carousel of document excerpts with left/center/right positioning
 * Used in PretrainingModelView to show multiple documents with the active one in the center
 */
function TrainingDocumentCarousel({ showPlayButton = true }) {
  const { state, actions } = useApp();
  const { language, t } = useI18n();
  const containerRef = useRef(null);
  const trackRef = useRef(null);
  const leftWrapRef = useRef(null);
  const centerWrapRef = useRef(null);
  const rightWrapRef = useRef(null);

  // internal sliding state to animate between documents smoothly
  const [isSliding, setIsSliding] = useState(false);

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
      // If temperature is missing, don't exclude the example (relevant for inference view)
      const byTemp =
        state.viewType === 'inference'
          ? ex.temperature == null
            ? true
            : getTemperatureEmoji(ex.temperature) === state.selectedTemperatureEmoji
          : true;
      return byModel && byTemp;
    });
  }, [state.examples, state.selectedModelIndex, state.selectedTemperatureEmoji, state.viewType]);

  // Find current example index within filtered list
  const currentIndex = filteredExamples.findIndex((ex) => ex.id === state.currentExampleId);

  // Auto-recover: if no active example but we have filtered ones, load the first
  useEffect(() => {
    if (state.viewType !== 'training') return;
    if (currentIndex === -1 && filteredExamples.length > 0) {
      const firstId = filteredExamples[0].id;
      if (firstId) actions.loadExample(firstId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, filteredExamples.length, state.viewType]);

  // Navigation functions
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < filteredExamples.length - 1;

  const animateTo = (targetEl, onDone) => {
    if (!containerRef.current || !trackRef.current || !targetEl) return onDone?.();
    const containerRect = containerRef.current.getBoundingClientRect();
    const targetRect = targetEl.getBoundingClientRect();
    const containerCenter = containerRect.left + containerRect.width / 2;
    const targetCenter = targetRect.left + targetRect.width / 2;
    const dx = containerCenter - targetCenter; // translate track so target centers

    setIsSliding(true);
    const track = trackRef.current;
    // Ensure transition is enabled
    track.style.transition = '';
    // Trigger animation
    requestAnimationFrame(() => {
      track.style.transform = `translateX(${dx}px)`;
    });

    const handleEnd = (evt) => {
      if (evt.propertyName !== 'transform') return;
      track.removeEventListener('transitionend', handleEnd);
      // Snap back to neutral without animating
      track.style.transition = 'none';
      track.style.transform = 'translateX(0px)';
      // Force reflow to apply immediate reset
      track.offsetHeight; // reflow
      setIsSliding(false);
      // Re-enable default transition for next time
      track.style.transition = '';
      onDone?.();
    };
    track.addEventListener('transitionend', handleEnd);
  };

  const handlePrev = () => {
    if (!canGoPrev || isSliding) return;
    const target = leftWrapRef.current;
    const nextId = filteredExamples[currentIndex - 1]?.id;
    animateTo(target, () => {
      if (nextId) actions.loadExample(nextId);
    });
  };

  const handleNext = () => {
    if (!canGoNext || isSliding) return;
    const target = rightWrapRef.current;
    const nextId = filteredExamples[currentIndex + 1]?.id;
    animateTo(target, () => {
      if (nextId) actions.loadExample(nextId);
    });
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
    const sourceIcon = getSourceIcon(example.source);

    return (
      <div
        key={example.id}
        className={`carousel-document ${position} ${isActive ? 'active' : 'inactive'}`}
      >
        {/* Document paper */}
        <div
          className="document-paper"
          data-tooltip-id={isActive ? 'training-document-tooltip' : undefined}
        >
          {/* Paper texture overlay */}
          <div className="paper-texture"></div>

          {/* Document header with source label */}
          <div className="document-header">
            {sourceIcon && <img src={sourceIcon} alt="" className="document-source-icon" />}
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

          {/* Play button - only for active document and when enabled */}
          {isActive && showPlayButton && (
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
        className={`carousel-nav-arrow left ${!canGoPrev || isSliding ? 'disabled' : ''}`}
        onClick={handlePrev}
        disabled={!canGoPrev || isSliding}
        aria-label="Previous document"
      >
        <Icon path={mdiChevronLeft} size={1.5} />
      </button>

      {/* Carousel container */}
      <div className="carousel-container" ref={containerRef}>
        {/* Documents */}
        <div className="carousel-track" ref={trackRef}>
          <div className="carousel-document-wrapper left" ref={leftWrapRef}>
            {renderDocument(leftDoc, 'left', false)}
          </div>
          <div className="carousel-document-wrapper center" ref={centerWrapRef}>
            {renderDocument(centerDoc, 'center', true)}
          </div>
          <div className="carousel-document-wrapper right" ref={rightWrapRef}>
            {renderDocument(rightDoc, 'right', false)}
          </div>
        </div>
      </div>

      <button
        className={`carousel-nav-arrow right ${!canGoNext || isSliding ? 'disabled' : ''}`}
        onClick={handleNext}
        disabled={!canGoNext || isSliding}
        aria-label="Next document"
      >
        <Icon path={mdiChevronRight} size={1.5} />
      </button>

      {/* Tooltip */}
      <Tooltip
        id="training-document-tooltip"
        place="top"
        content={t('tooltip_training_document')}
      />
    </section>
  );
}

export default TrainingDocumentCarousel;
