import { useApp } from '../contexts/AppContext';
import { useI18n } from '../i18n/I18nProvider';
import { useState } from 'react';
import { getTokenColor } from '../visualization/core/colors';
import { processTokenForText } from '../utils/tokenProcessing';
import '../styles/main.css';
import Icon from '@mdi/react';
import { mdiPlay, mdiPause, mdiChevronDown } from '@mdi/js';

/**
 * InputSection Component
 * Minimalistic example selector and prompt display
 */
function InputSection() {
  const { state, actions } = useApp();
  const { t } = useI18n();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleExampleChange = (index) => {
    const exampleId = state.examples[index].id;
    actions.loadExample(exampleId);
    setIsDropdownOpen(false);
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

  // Find current example index
  const currentIndex = state.examples.findIndex((ex) => ex.id === state.currentExampleId);

  // Get tokens from the initial step if visualization has started
  const shouldShowTokens = state.currentStep > 0 && state.currentExample;
  const tokens = shouldShowTokens ? state.currentExample.generation_steps[0].tokens : [];

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
                  <Icon path={mdiChevronDown} size={0.65} />
                </button>

                {isDropdownOpen && (
                  <div className="dropdown-menu">
                    {state.examples.map((example, index) => (
                      <button
                        key={example.id}
                        className={`dropdown-item ${index === currentIndex ? 'active' : ''}`}
                        onClick={() => handleExampleChange(index)}
                      >
                        <div className="dropdown-item-content">
                          <span className="dropdown-item-prompt">{example.prompt}</span>
                          {example.model_id && (
                            <span className="dropdown-item-model">{example.model_id}</span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="prompt-text-chat">
                {shouldShowTokens ? (
                  <span className="tokenized-text">
                    {tokens.map((token, index) => (
                      <span
                        key={index}
                        className="token-with-underline"
                        style={{
                          borderBottom: `4px solid ${getTokenColor(index)}`,
                        }}
                      >
                        {processTokenForText(token)}
                      </span>
                    ))}
                  </span>
                ) : (
                  state.currentExample.prompt
                )}
              </div>
              <button
                onClick={handlePlayPause}
                className="btn-play"
                aria-label={state.isPlaying ? t('pause') : t('play')}
                title={state.isPlaying ? t('pause') : t('play')}
              >
                <Icon path={state.isPlaying ? mdiPause : mdiPlay} size={0.7} />
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default InputSection;
