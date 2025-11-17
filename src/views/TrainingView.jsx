import { useApp } from '../contexts/AppContext';
import GeneratedAnswer from '../components/GeneratedAnswer';
import TrainingCanvas from '../components/TrainingCanvas';
import DocumentExcerpt from '../components/DocumentExcerpt';

/**
 * TrainingView Component
 * View for training animation with document excerpt input
 * Uses DocumentExcerpt component instead of chat-style input
 * TODO: Create dedicated TrainingCanvas when training-specific visualization is implemented
 */
function TrainingView() {
  const { state } = useApp();

  return (
    <>
      {/* Main content */}
      {state.currentExample && (
        <>
          {/* Document excerpt input section */}
          <div className="canvas-input-section">
            <DocumentExcerpt />
          </div>
          {/* Training-specific animation */}
          <TrainingCanvas />
        </>
      )}

      {/* Bottom section - only after generation starts */}
      {/* Hide GeneratedAnswer in training view */}
    </>
  );
}

export default TrainingView;
