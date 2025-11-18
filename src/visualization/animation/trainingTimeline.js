import { gsap } from 'gsap';
import { ALL_SELECTORS as SEL } from '../core/selectors';

// Utilities
const qsa = (root, selector) => (root ? Array.from(root.querySelectorAll(selector)) : []);
const setIfAny = (root, selector, vars) => {
  const nodes = qsa(root, selector);
  if (nodes.length) gsap.set(nodes, vars);
};

/**
 * Initialize all elements as hidden prior to running the training step animation.
 * Keeps the API symmetric with the text generation timeline.
 */
export function setInitialStates(svgElement, subStep, isInitialStep) {
  if (!svgElement) return;
  // Reference to avoid lint unused-param error (reserved for future first-pass tweaks)
  void isInitialStep;
  const prev = Math.max(0, (typeof subStep === 'number' ? subStep : 0) - 1);
  // Tokens and token IDs (shown together at step 0)
  setIfAny(svgElement, SEL.token, { opacity: prev >= 0 ? 1 : 0 });
  setIfAny(svgElement, SEL.tokenId, { opacity: prev >= 0 ? 1 : 0 });
  setIfAny(svgElement, SEL.tokenIdArrow, { opacity: prev >= 0 ? 1 : 0 });

  // Embeddings
  setIfAny(svgElement, SEL.embeddingGroupAll, {
    opacity: prev >= 1 ? 1 : 0,
    y: prev >= 1 ? 0 : -8,
  });
  setIfAny(svgElement, SEL.idToEmbArrow, { opacity: prev >= 1 ? 1 : 0 });

  // Transformer block and internals
  setIfAny(svgElement, SEL.transformerBox, {
    opacity: prev >= 2 ? 1 : 0,
    scaleY: prev >= 2 ? 1 : 0.95,
    transformOrigin: '50% 0%',
  });
  setIfAny(svgElement, SEL.insideTopEmbeddingsAll, {
    opacity: prev >= 2 ? 1 : 0,
    y: prev >= 2 ? 0 : -8,
  });
  setIfAny(svgElement, SEL.outerToBlockArrow, { opacity: prev >= 2 ? 1 : 0 });
  setIfAny(svgElement, SEL.shadowToBlockArrow, { opacity: prev >= 2 ? 1 : 0 });
  setIfAny(svgElement, `${SEL.positionalEmb} circle`, { opacity: prev >= 2 ? 0.9 : 0 });
  setIfAny(svgElement, `${SEL.positionalEmb} text`, { opacity: prev >= 2 ? 1 : 0 });

  setIfAny(svgElement, SEL.insideBottomEmbeddingsAll, {
    opacity: prev >= 3 ? 1 : 0,
    y: prev >= 3 ? 0 : 8,
  });
  setIfAny(svgElement, SEL.attentionMashAll, { opacity: prev >= 3 ? 1 : 0 });

  setIfAny(svgElement, SEL.insideFfnEmbeddingsAll, {
    opacity: prev >= 4 ? 1 : 0,
    y: prev >= 4 ? 0 : 8,
  });
  setIfAny(svgElement, SEL.ffnArrow, { opacity: prev >= 4 ? 1 : 0 });
  setIfAny(svgElement, SEL.ffnArrowIn, { opacity: prev >= 4 ? 1 : 0 });
  setIfAny(svgElement, SEL.ffnArrowOut, { opacity: prev >= 4 ? 1 : 0 });
  setIfAny(svgElement, SEL.ffnProjectionBox, { opacity: prev >= 4 ? 1 : 0 });

  // Stack reveal (optional)
  setIfAny(svgElement, SEL.transformerShadowBox, { opacity: prev >= 5 ? 1 : 0 });
  setIfAny(svgElement, SEL.transformerStackLabel, { opacity: prev >= 5 ? 1 : 0 });

  // Extraction to logprobs
  setIfAny(svgElement, SEL.extractedEmbedding, { opacity: prev >= 6 ? 1 : 0 });
  setIfAny(svgElement, SEL.extractedPathArrow, { opacity: prev >= 6 ? 1 : 0 });
  setIfAny(svgElement, SEL.extractedHorizontal, { opacity: prev >= 6 ? 1 : 0 });
  setIfAny(svgElement, SEL.logprobArrow, { opacity: prev >= 7 ? 1 : 0 });
  setIfAny(svgElement, SEL.logprobVector, { opacity: prev >= 7 ? 1 : 0 });

  // Distribution (no highlight/append in training)
  setIfAny(svgElement, SEL.distributionBar, {
    opacity: prev >= 8 ? 1 : 0,
    scaleY: prev >= 8 ? 1 : 0.1,
    transformOrigin: '50% 100%',
  });
  setIfAny(svgElement, SEL.distributionLabels, { opacity: prev >= 8 ? 1 : 0 });
  setIfAny(svgElement, SEL.distributionItem, { opacity: prev >= 8 ? 1 : 0 });
  setIfAny(svgElement, SEL.distributionHighlightRect, { opacity: 0 });
  setIfAny(svgElement, SEL.appendPathArrow, { opacity: 0 });
  setIfAny(svgElement, SEL.previewTokenText, { opacity: 0 });
  setIfAny(svgElement, SEL.previewTokenUnderline, { opacity: 0 });
}

/**
 * Build a compact GSAP timeline that plays through sub-steps 0..8 automatically.
 * Skips output highlight (9) and append preview (10..11) to reflect teacher forcing.
 * Note: Token IDs are now shown together with tokens at step 0.
 */
export function buildTimeline(svgElement, subStep, isInitialStep, animDuration, onStepComplete) {
  const tl = gsap.timeline();
  // Reference to avoid lint unused-param error (reserved for future first-pass tweaks)
  void isInitialStep;
  const toIfAny = (selector, vars, pos) => {
    const nodes = qsa(svgElement, selector);
    if (nodes.length) tl.to(nodes, vars, pos);
  };

  switch (subStep) {
    case 0:
      // Show tokens and token IDs together
      toIfAny(SEL.token, { opacity: 1, duration: animDuration });
      toIfAny(SEL.tokenId, { opacity: 1, duration: animDuration }, '<');
      toIfAny(SEL.tokenIdArrow, { opacity: 1, duration: animDuration }, '<');
      break;
    case 1:
      toIfAny(SEL.embeddingGroupAll, { opacity: 1, y: 0, duration: animDuration });
      toIfAny(SEL.idToEmbArrow, { opacity: 1, duration: animDuration }, '<');
      break;
    case 2:
      toIfAny(SEL.transformerBox, { opacity: 1, scaleY: 1, duration: animDuration });
      toIfAny(SEL.insideTopEmbeddingsAll, { opacity: 1, y: 0, duration: animDuration }, '<');
      toIfAny(SEL.outerToBlockArrow, { opacity: 1, duration: animDuration }, '<');
      toIfAny(SEL.shadowToBlockArrow, { opacity: 1, duration: animDuration }, '<');
      toIfAny(`${SEL.positionalEmb} circle`, { opacity: 0.9, duration: animDuration }, '<');
      toIfAny(`${SEL.positionalEmb} text`, { opacity: 1, duration: animDuration }, '<');
      break;
    case 3:
      toIfAny(SEL.insideBottomEmbeddingsAll, { opacity: 1, y: 0, duration: animDuration });
      toIfAny(SEL.attentionMashAll, { opacity: 1, duration: animDuration }, '<');
      break;
    case 4:
      toIfAny(SEL.insideFfnEmbeddingsAll, { opacity: 1, y: 0, duration: animDuration });
      toIfAny(SEL.ffnArrow, { opacity: 1, duration: animDuration }, '<');
      toIfAny(SEL.ffnArrowIn, { opacity: 1, duration: animDuration }, '<');
      toIfAny(SEL.ffnArrowOut, { opacity: 1, duration: animDuration }, '<');
      toIfAny(SEL.ffnProjectionBox, { opacity: 1, duration: animDuration }, '<');
      break;
    case 5:
      toIfAny(SEL.transformerShadowBox, {
        opacity: 1,
        stagger: 0.03,
        duration: animDuration * 0.4,
      });
      toIfAny(SEL.transformerStackLabel, { opacity: 1, duration: animDuration * 0.5 }, '<');
      break;
    case 6:
      toIfAny(SEL.extractedEmbedding, { opacity: 1, duration: animDuration * 0.5 });
      toIfAny(SEL.extractedPathArrow, { opacity: 1, duration: animDuration }, '<');
      toIfAny(SEL.extractedHorizontal, { opacity: 1, duration: animDuration }, '<');
      break;
    case 7:
      toIfAny(SEL.logprobArrow, { opacity: 1, duration: animDuration });
      toIfAny(SEL.logprobVector, { opacity: 1, duration: animDuration }, '<');
      break;
    case 8:
      toIfAny(SEL.distributionItem, { opacity: 1, duration: animDuration });
      toIfAny(SEL.distributionBar, { opacity: 1, scaleY: 1, duration: animDuration }, '<');
      toIfAny(SEL.distributionLabels, { opacity: 1, duration: animDuration }, '<');
      break;
    default:
      break;
  }

  if (subStep === 8 && typeof onStepComplete === 'function') {
    tl.eventCallback('onComplete', onStepComplete);
  }
  return tl;
}
