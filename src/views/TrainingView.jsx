import { useApp } from '../contexts/AppContext';
import GeneratedAnswer from '../components/GeneratedAnswer';
import TrainingCanvas from '../components/TrainingCanvas';
import TrainingDocumentCarousel from '../components/TrainingDocumentCarousel';
import InfoBox from '../components/InfoBox';
import InitialHint from '../components/InitialHint';

/**
 * TrainingView Component
 * View for training animation with document carousel
 * Uses TrainingDocumentCarousel component to show multiple documents
 */
function TrainingView() {
  const { state } = useApp();

  return (
    <>
      {/* Info box with contextual guidance */}
      <InfoBox />

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

export default TrainingView;
