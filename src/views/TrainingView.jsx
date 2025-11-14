import { useApp } from '../contexts/AppContext';
import GeneratedAnswer from '../components/GeneratedAnswer';
import VisualizationCanvas from '../components/VisualizationCanvas';

/**
 * TrainingView Component
 * View for training animation - similar to text generation but without input box
 */
function TrainingView() {
  const { state } = useApp();

  return (
    <>
      {/* Main content - reusing the transformer animation */}
      {state.currentExample && <VisualizationCanvas />}

      {/* Bottom section - only after generation starts */}
      {state.currentExample && state.currentStep > 0 && (
        <div className="floating-bottom-section">
          <GeneratedAnswer />
        </div>
      )}
    </>
  );
}

export default TrainingView;
