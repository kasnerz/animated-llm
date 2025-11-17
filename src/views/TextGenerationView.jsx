import { useApp } from '../contexts/AppContext';
import GeneratedAnswer from '../components/GeneratedAnswer';
import TextGenerationCanvas from '../components/TextGenerationCanvas';
import InputSection from '../components/InputSection';

/**
 * TextGenerationView Component
 * The main view showing text generation with Transformer internals animation
 */
function TextGenerationView() {
  const { state } = useApp();

  return (
    <>
      {/* Main content */}
      {state.currentExample && (
        <>
          {/* Prompt input moved to canvas area */}
          <div className="canvas-input-section">
            <InputSection />
          </div>
          <TextGenerationCanvas />
        </>
      )}

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
