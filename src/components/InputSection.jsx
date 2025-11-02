import { useApp } from '../contexts/AppContext';
import { useTranslation } from '../utils/i18n';
import { useState } from 'react';
import '../styles/main.css';

/**
 * InputSection Component
 * Minimalistic example selector and prompt display
 */
function InputSection() {
  const { state, actions } = useApp();
  const { t } = useTranslation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleExampleChange = (index) => {
    const exampleId = state.examples[index].id;
    actions.loadExample(exampleId);
    setIsDropdownOpen(false);
  };

  const handleGenerate = () => {
    // Start generation: move to first step and begin animation
    if (state.currentStep === 0) {
      actions.nextStep();
    }
  };

  const isAtEnd = state.currentExample &&
    state.currentStep > 0;  // Disable after first click

  // Find current example index
  const currentIndex = state.examples.findIndex(ex => ex.id === state.currentExampleId);

  return (
    <section className="input-section-minimal">
      {/* ChatGPT-style prompt display */}
      {state.currentExample && (
        <div className="prompt-container">
          <div className="chat-input-wrapper">
            <div className="chat-input-box">
              {/* Dropdown selector */}
              <div className="prompt-dropdown">
                <button
                  className="dropdown-toggle"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  aria-label="Select prompt"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>

                {isDropdownOpen && (
                  <div className="dropdown-menu">
                    {state.examples.map((example, index) => (
                      <button
                        key={example.id}
                        className={`dropdown-item ${index === currentIndex ? 'active' : ''}`}
                        onClick={() => handleExampleChange(index)}
                      >
                        {example.prompt}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="prompt-text-chat">
                {state.currentExample.prompt}
                <span className="prompt-cursor">|</span>
              </div>
              <button
                onClick={handleGenerate}
                disabled={isAtEnd || state.isPlaying}
                className="btn-play"
                aria-label={state.currentStep === 0 ? t('start_generation') : t('next_token')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset button */}
      {state.currentStep > 0 && (
        <div className="reset-container">
          <button
            onClick={actions.reset}
            className="btn-minimal btn-reset-minimal"
          >
            {t('reset')}
          </button>
        </div>
      )}
    </section>
  );
}

export default InputSection;
