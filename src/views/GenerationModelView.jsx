import { useApp } from '../contexts/AppContext';
import GeneratedAnswer from '../components/GeneratedAnswer';
import TextGenerationCanvas from '../components/TextGenerationCanvas';
import InputSection from '../components/InputSection';
import InfoBox from '../components/InfoBox';
import InitialHint from '../components/InitialHint';

/**
 * GenerationModelView Component
 * The main view showing text generation with Transformer internals animation
 */
function GenerationModelView() {
  const { state } = useApp();

  return (
    <>
      {/* Info box with contextual guidance */}
      <InfoBox />

      {/* Main content */}
      {state.currentExample && (
        <>
          {/* Prompt input moved to canvas area */}
          <div className="canvas-input-section">
            <InputSection />
          </div>
          <TextGenerationCanvas />

          {/* Initial hint - only shown before animation starts */}
          {state.currentStep === 0 && !state.isPlaying && <InitialHint />}
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

export default GenerationModelView;
