import { useApp } from '../contexts/AppContext';
import GeneratedAnswer from '../components/GeneratedAnswer';
import VisualizationCanvas from '../components/VisualizationCanvas';

/**
 * TextGenerationView Component
 * The main view showing text generation with Transformer internals animation
 */
function TextGenerationView() {
  const { state } = useApp();

  return (
    <>
      {/* Main content */}
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

export default TextGenerationView;
