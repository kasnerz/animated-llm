import React from 'react';
import { useApp } from '../contexts/AppContext';
import '../styles/generated-answer.css';

function GeneratedAnswer() {
  const { state } = useApp();

  if (!state.currentExample) return null;

  return (
    <section className="generated-answer-section">
      <div className="generated-answer-box" aria-live="polite">
        <div className="generated-answer-label">Model answer</div>
        <div className="generated-answer-text">
          {state.generatedAnswer}
          {state.generatedAnswer && state.generatedAnswer.length > 0 ? (
            <span className="answer-caret">|</span>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export default GeneratedAnswer;
