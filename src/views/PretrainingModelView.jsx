import { useApp } from '../contexts/AppContext';
import GeneratedAnswer from '../components/GeneratedAnswer';
import TrainingCanvas from '../components/TrainingCanvas';
import TrainingDocumentCarousel from '../components/TrainingDocumentCarousel';
import InitialHint from '../components/InitialHint';

/**
 * PretrainingModelView Component
 * View for training animation with document carousel
 * Uses TrainingDocumentCarousel component to show multiple documents
 */
function PretrainingModelView() {
  const { state } = useApp();

  return (
    <>
      {/* Main content */}
      {state.currentExample && (
        <>
          {/* Document carousel section */}
          <div className="training-carousel-wrapper">
            <TrainingDocumentCarousel />
          </div>
          {/* Training-specific animation */}
          <TrainingCanvas />

          {/* Initial hint - only shown before animation starts */}
          {state.currentStep === 0 && !state.isPlaying && <InitialHint />}
        </>
      )}

      {/* Bottom section - only after generation starts */}
      {/* Hide GeneratedAnswer in training view */}
    </>
  );
}

export default PretrainingModelView;
