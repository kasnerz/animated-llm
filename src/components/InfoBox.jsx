import { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { useI18n } from '../i18n/I18nProvider';
import translations from '../i18n/translations';
import Icon from '@mdi/react';
import { mdiInformationSlabCircle } from '@mdi/js';
import '../styles/info-box.css';

/**
 * InfoBox Component
 * Displays contextual guidance based on the current view and animation step
 */
function InfoBox() {
  const { state } = useApp();
  const { language } = useI18n();
  const [isVisible, setIsVisible] = useState(false);

  // Helper to get nested translations
  const getInfoboxTranslation = (key) => {
    const currentLang = translations[language];
    const fallbackLang = translations.en;
    return currentLang?.infobox?.[key] || fallbackLang?.infobox?.[key] || key;
  };

  // Don't show on mobile or home page
  if (window.innerWidth <= 768 || !state.currentExample) {
    return null;
  }

  const { viewType, currentStep, currentAnimationSubStep, currentExample } = state;

  // Get the content based on view type and current step
  const getContent = () => {
    if (viewType === 'inference') {
      return getInferenceContent();
    } else if (viewType === 'training') {
      return getTrainingContent();
    }
    return { heading: '', description: '' };
  };

  const getInferenceContent = () => {
    // Before animation starts
    if (currentStep === 0) {
      return {
        heading: getInfoboxTranslation('ready_to_generate_heading'),
        description: getInfoboxTranslation('ready_to_generate_desc'),
      };
    }

    // Get the user's prompt
    // const userPrompt = currentExample?.prompt || '';
    // const truncatedPrompt = userPrompt.length > 50
    //     ? userPrompt.slice(0, 50) + '...'
    //     : userPrompt;

    // Get generated text so far
    // const generatedSoFar = state.generatedAnswer || '';

    // Steps 1-8 (up to step 8 inclusive in the forward pass)
    if (currentAnimationSubStep <= 8) {
      if (currentStep === 1) {
        // First token
        return {
          heading: getInfoboxTranslation('predicting_next_token_heading'),
          description: getInfoboxTranslation('predicting_user_input_desc'),
        };
      } else {
        // All other tokens
        return {
          heading: getInfoboxTranslation('predicting_next_token_heading'),
          description: getInfoboxTranslation('predicting_generated_desc'),
        };
      }
    }

    // Steps 9-12 (output layer and selection)
    if (currentAnimationSubStep >= 9 && currentAnimationSubStep <= 12) {
      return {
        heading: getInfoboxTranslation('predicting_next_token_heading'),
        description: getInfoboxTranslation('selecting_token_desc'),
      };
    }

    return { heading: '', description: '' };
  };

  const getTrainingContent = () => {
    // Before animation starts
    if (currentStep === 0) {
      return {
        heading: getInfoboxTranslation('ready_to_train_heading'),
        description: getInfoboxTranslation('ready_to_train_desc'),
      };
    }

    // Get the current step data
    const trainingSteps = currentExample?.training_steps || [];
    const stepData = trainingSteps[currentStep - 1];

    if (!stepData) {
      return { heading: '', description: '' };
    }

    // Get the text generated so far (from input_tokens)
    // const inputTokens = stepData.input_tokens || [];
    // const inputText = inputTokens.join('').replace(/Ġ/g, ' ');
    // const truncatedText = inputText.length > 50
    //     ? inputText.slice(0, 50) + '...'
    //     : inputText;

    // Get the next token (target token)
    // const nextToken = stepData.target_token || '';

    // Steps 0-9 inclusive: Forward pass
    if (currentAnimationSubStep <= 9) {
      return {
        heading: getInfoboxTranslation('forward_pass_heading'),
        description: getInfoboxTranslation('forward_pass_desc'),
      };
    }

    // Steps 10-15: Backward pass
    if (currentAnimationSubStep >= 10 && currentAnimationSubStep <= 15) {
      return {
        heading: getInfoboxTranslation('backward_pass_heading'),
        description: getInfoboxTranslation('backward_pass_desc'),
      };
    }

    return { heading: '', description: '' };
  };

  const content = getContent();

  // Don't render if no content
  if (!content.heading && !content.description) {
    return null;
  }

  if (!isVisible) {
    return (
      <div
        className={`info-box-toggle ${viewType === 'inference' ? 'info-box-toggle-inference' : ''}`}
        onClick={() => setIsVisible(true)}
      >
        <Icon path={mdiInformationSlabCircle} size={1.5} className="info-icon" />
      </div>
    );
  }

  return (
    <div className={`info-box ${viewType === 'inference' ? 'info-box-inference' : ''}`}>
      <button
        className="info-box-close"
        onClick={() => setIsVisible(false)}
        aria-label="Hide info box"
      >
        ×
      </button>
      <h2 className="info-box-heading">{content.heading}</h2>
      {content.description && <p className="info-box-description">{content.description}</p>}
    </div>
  );
}

export default InfoBox;
