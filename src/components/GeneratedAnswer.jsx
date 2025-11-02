import React from 'react';
import { useApp } from '../contexts/AppContext';
import { getTokenColor } from '../visualization/core/colors';
import '../styles/generated-answer.css';

function GeneratedAnswer() {
  const { state } = useApp();

  if (!state.currentExample || !state.generatedAnswer || state.generatedAnswer.length === 0) {
    return null;
  }

  return (
    <section className="generated-answer-section">
      <div className="generated-answer-container">
        <div className="generated-answer-label">Model answer</div>
        <div className="generated-answer-text" aria-live="polite">
          {state.generatedTokens.map((tokenData, i) => (
            <span
              key={i}
              className="token-with-underline"
              style={{
                borderBottom: `4px solid ${getTokenColor(tokenData.index)}`,
              }}
            >
              {tokenData.token}
            </span>
          ))}
          <span className="answer-caret">|</span>
        </div>
      </div>
    </section>
  );
}

export default GeneratedAnswer;
