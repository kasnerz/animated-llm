import { useApp } from '../contexts/AppContext';
import InfoBox from '../components/InfoBox';
import InitialHint from '../components/InitialHint';

/**
 * PretrainingSimpleView Component
 * Simplified view for pretraining visualization
 * TODO: Implement pretraining simple visualization
 */
function PretrainingSimpleView() {
  const { state } = useApp();

  return (
    <div className="pretraining-simple-container">
      {/* Info box with contextual guidance */}
      <InfoBox />

      {/* Main content - to be implemented */}
      {state.currentExample && (
        <>
          {/* TODO: Add pretraining simple visualization components */}
          <div className="pretraining-simple-placeholder">
            <p>Pretraining Simple View - Coming Soon</p>
          </div>

          {/* Initial hint - only shown before animation starts */}
          {state.currentStep === 0 && !state.isPlaying && <InitialHint />}
        </>
      )}
    </div>
  );
}

export default PretrainingSimpleView;
