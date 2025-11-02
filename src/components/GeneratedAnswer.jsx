import React from 'react';
import { useApp } from '../contexts/AppContext';
import { getTokenColor } from '../visualization/core/colors';
import { processTokenForText } from '../utils/tokenProcessing';
import { useI18n } from '../i18n/I18nProvider';
import '../styles/generated-answer.css';

function GeneratedAnswer() {
  const { state } = useApp();
  const { t } = useI18n();

  if (!state.currentExample || !state.generatedAnswer || state.generatedAnswer.length === 0) {
    return null;
  }

  return (
    <section className="generated-answer-section">
      <div className="generated-answer-container">
        <div className="generated-answer-label">{t('model_answer')}</div>
        <div className="generated-answer-text" aria-live="polite">
          {state.generatedTokens.map((tokenData, i) => (
            <span
              key={i}
              className="token-with-underline"
              style={{
                borderBottom: `4px solid ${getTokenColor(tokenData.index)}`,
              }}
            >
              {processTokenForText(tokenData.token)}
            </span>
          ))}
          <span className="answer-caret">|</span>
        </div>
      </div>
    </section>
  );
}

export default GeneratedAnswer;
