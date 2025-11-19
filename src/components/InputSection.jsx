import { useApp } from '../contexts/AppContext';
import { useI18n } from '../i18n/I18nProvider';
import { useEffect, useMemo, useRef, useState } from 'react';
import { getTokenColor } from '../visualization/core/colors';
import { processTokenForText, isSpecialToken } from '../utils/tokenProcessing';
import { MODEL_REGISTRY, getModelInfo, getTemperatureEmoji } from '../config/modelConfig';
import '../styles/main.css';
import Icon from '@mdi/react';
import { mdiPlay, mdiPause, mdiChevronDown, mdiTune, mdiDotsHorizontal } from '@mdi/js';

/**
 * InputSection Component
 *
 * REUSABLE COMPONENT - Can be used across different views
 * Provides minimalistic example selector and prompt display
 *
 * While currently used in TextGenerationView, this component is designed
 * to be reusable in other views that need prompt/example selection.
 */
function InputSection() {
  const { state, actions } = useApp();
  const { t } = useI18n();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const actionMenuRef = useRef(null);
  const settingsPopoverRef = useRef(null);

  const handleExampleChange = (exampleId) => {
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

  // Filter examples by selected model and temperature
  const filteredExamples = useMemo(() => {
    const modelEntry = MODEL_REGISTRY[state.selectedModelIndex];
    const modelPattern = modelEntry
      ? typeof modelEntry.pattern === 'string'
        ? new RegExp(modelEntry.pattern, 'i')
        : modelEntry.pattern
      : null;

    return state.examples.filter((ex) => {
      const byModel = modelPattern ? modelPattern.test(ex.model_id || '') : true;
      const byTemp = getTemperatureEmoji(ex.temperature) === state.selectedTemperatureEmoji;
      return byModel && byTemp;
    });
  }, [state.examples, state.selectedModelIndex, state.selectedTemperatureEmoji]);

  // Find current example index within filtered list
  const currentIndex = filteredExamples.findIndex((ex) => ex.id === state.currentExampleId);

  // Ensure current example matches filter; if not, auto-load first matching
  useEffect(() => {
    if (!state.currentExampleId && filteredExamples.length > 0) return; // will load on language load
    const isCurrentValid = filteredExamples.some((ex) => ex.id === state.currentExampleId);
    if (!isCurrentValid && filteredExamples.length > 0) {
      actions.loadExample(filteredExamples[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.selectedModelIndex, state.selectedTemperatureEmoji, filteredExamples.length]);

  // Get tokens from the initial step if visualization has started
  const shouldShowTokens = state.currentStep > 0 && state.currentExample;
  const tokens = shouldShowTokens ? state.currentExample.generation_steps[0].tokens : [];

  // Close the compact action menu when clicking outside of it
  useEffect(() => {
    if (!isActionMenuOpen) return;

    const handleClickOutside = (event) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target)) {
        setIsActionMenuOpen(false);
      }
    };

    window.addEventListener('pointerdown', handleClickOutside);
    return () => window.removeEventListener('pointerdown', handleClickOutside);
  }, [isActionMenuOpen]);

  // Close the settings popover when clicking outside of it
  useEffect(() => {
    if (!isSettingsOpen) return;

    const handleWindowClick = (event) => {
      if (settingsPopoverRef.current && !settingsPopoverRef.current.contains(event.target)) {
        setIsSettingsOpen(false);
      }
    };

    window.addEventListener('pointerdown', handleWindowClick);
    return () => window.removeEventListener('pointerdown', handleWindowClick);
  }, [isSettingsOpen]);

  return (
    <section className="input-section-minimal">
      {/* ChatGPT-style prompt display */}
      {state.currentExample && (
        <div className="prompt-container">
          <div className="chat-input-wrapper">
            <div className="chat-input-box" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
              <div className="prompt-main">
                {/* Dropdown selector */}
                <div className="prompt-dropdown">
                  <button
                    className="dropdown-toggle"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsDropdownOpen(!isDropdownOpen);
                    }}
                    aria-label="Select prompt"
                  >
                    <Icon path={mdiChevronDown} size={0.65} />
                  </button>

                  {isDropdownOpen && (
                    <div className="dropdown-menu">
                      {filteredExamples.map((example, index) => (
                        <button
                          key={example.id}
                          className={`dropdown-item ${index === currentIndex ? 'active' : ''}`}
                          onClick={() => handleExampleChange(example.id)}
                        >
                          <div className="dropdown-item-content">
                            <span className="dropdown-item-prompt">{example.prompt}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className={`prompt-text-chat ${shouldShowTokens ? 'has-tokens' : ''}`}>
                  {shouldShowTokens ? (
                    <span className="tokenized-text">
                      {tokens.map((token, index) => (
                        <span
                          key={index}
                          className={`token-with-underline ${isSpecialToken(token) ? 'special-token' : ''}`}
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
              </div>

              <div
                className="prompt-actions"
                ref={actionMenuRef}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Settings toggle (model & temperature) */}
                <button
                  onClick={() => {
                    setIsSettingsOpen((v) => !v);
                    setIsDropdownOpen(false);
                    setIsActionMenuOpen(false);
                  }}
                  className="btn-settings"
                  aria-label={t('settings') || 'Model and temperature'}
                  title={t('settings') || 'Model and temperature'}
                >
                  <Icon path={mdiTune} size={0.9} />
                </button>

                {/* Play/Pause */}
                <button
                  onClick={() => {
                    handlePlayPause();
                    setIsActionMenuOpen(false);
                  }}
                  className="btn-play"
                  aria-label={state.isPlaying ? t('pause') : t('play')}
                  title={state.isPlaying ? t('pause') : t('play')}
                >
                  <Icon path={state.isPlaying ? mdiPause : mdiPlay} size={0.7} />
                </button>

                <button
                  className={`btn-action-toggle ${isActionMenuOpen ? 'open' : ''}`}
                  onClick={() => setIsActionMenuOpen((v) => !v)}
                  aria-label={t('more_actions') || 'More prompt actions'}
                  title={t('more_actions') || 'More prompt actions'}
                >
                  <Icon path={mdiDotsHorizontal} size={0.85} />
                </button>

                {isActionMenuOpen && (
                  <div className="prompt-actions-menu">
                    <button
                      className="prompt-actions-item"
                      onClick={() => {
                        setIsSettingsOpen((v) => !v);
                        setIsDropdownOpen(false);
                        setIsActionMenuOpen(false);
                      }}
                    >
                      <Icon path={mdiTune} size={0.8} />
                      <span>{t('settings') || 'Settings'}</span>
                    </button>
                    <button
                      className="prompt-actions-item"
                      onClick={() => {
                        handlePlayPause();
                        setIsActionMenuOpen(false);
                      }}
                    >
                      <Icon path={state.isPlaying ? mdiPause : mdiPlay} size={0.7} />
                      <span>{state.isPlaying ? t('pause') : t('play')}</span>
                    </button>
                  </div>
                )}
              </div>

              {isSettingsOpen && (
                <div
                  className="settings-popover"
                  ref={settingsPopoverRef}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="settings-section">
                    <div className="settings-label">Model</div>
                    <div className="model-options">
                      {MODEL_REGISTRY.map((entry, idx) => (
                        <button
                          key={idx}
                          className={`model-option ${state.selectedModelIndex === idx ? 'selected' : ''}`}
                          onClick={() => {
                            actions.setSelectedModelIndex(idx);
                            setIsSettingsOpen(false);
                          }}
                          title={getModelInfo(entry.pattern.toString())?.name || 'Model'}
                          aria-label={`Model ${idx + 1}`}
                        >
                          <img
                            src={
                              new URL(`../assets/model-logos/${entry.logo}`, import.meta.url).href
                            }
                            alt=""
                            className="model-logo"
                          />
                          <span className="model-size">{entry.name || entry.size}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="settings-section">
                    <div className="settings-label">Temp</div>
                    <div className="temp-options">
                      {[
                        { emoji: '🧊', value: '0.0' },
                        { emoji: '🌡️', value: '1.0' },
                        { emoji: '🌶️', value: '5.0' },
                      ].map(({ emoji, value }) => (
                        <button
                          key={emoji}
                          className={`temp-option ${state.selectedTemperatureEmoji === emoji ? 'selected' : ''}`}
                          onClick={() => {
                            actions.setSelectedTemperatureEmoji(emoji);
                            setIsSettingsOpen(false);
                          }}
                          aria-label={`Temperature ${value}`}
                          title={`Temperature ${value}`}
                        >
                          <span className="temp-emoji" aria-hidden>
                            {emoji}
                          </span>
                          <span className="temp-value">{value}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="settings-section">
                    <div className="settings-toggle">
                      <label className="toggle-label">
                        <input
                          type="checkbox"
                          checked={state.showSpecialTokens}
                          onChange={(e) => {
                            actions.setShowSpecialTokens(e.target.checked);
                          }}
                          className="toggle-checkbox"
                        />
                        <span className="toggle-text">{t('show_special_tokens')}</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default InputSection;
