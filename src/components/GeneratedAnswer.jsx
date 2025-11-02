import React from 'react';
import { useApp } from '../contexts/AppContext';
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
          {state.generatedAnswer}
          <span className="answer-caret">|</span>
        </div>
      </div>
    </section>
  );
}

export default GeneratedAnswer;
