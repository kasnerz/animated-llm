/**
 * GSAP timeline builder for sub-step animations
 * Pure function that returns animation configuration based on step state
 */
import { gsap } from 'gsap';
import { ALL_SELECTORS as SEL } from '../core/selectors';

// Helper utilities to avoid GSAP warnings when selectors return no elements
const qsa = (root, selector) => (root ? Array.from(root.querySelectorAll(selector)) : []);
const setIfAny = (root, selector, vars) => {
  const nodes = qsa(root, selector);
  if (nodes.length) gsap.set(nodes, vars);
};

/**
 * Set initial states for all elements based on current sub-step
 * @param {HTMLElement} svgElement - SVG DOM element
 * @param {number} subStep - Current animation sub-step
 * @param {boolean} isInitialStep - Whether this is step 1
 */
export function setInitialStates(svgElement, subStep, isInitialStep) {
  // Initialize to the previous sub-step's visual state so we can animate only the delta
  const prev = Math.max(0, (typeof subStep === 'number' ? subStep : 0) - 1);
  // Read transformer state flags from DOM (set by renderer)
  const tg = svgElement ? svgElement.querySelector(SEL.transformerGroup) : null;
  const curLayer = tg ? Number(tg.getAttribute('data-current-layer') || '0') : 0;
  const totalLayers = tg ? Number(tg.getAttribute('data-num-layers') || '1') : 1;
  const keepStackVisible = totalLayers > 1 && curLayer > 0; // second pass
  if (isInitialStep) {
    // Initial visualization: set states based on what should already be visible
    setIfAny(svgElement, SEL.token, { opacity: prev >= 0 ? 1 : 0 });
    setIfAny(svgElement, SEL.tokenId, { opacity: prev >= 1 ? 1 : 0 });
    setIfAny(svgElement, SEL.tokenIdArrow, { opacity: prev >= 1 ? 1 : 0 });

    setIfAny(svgElement, SEL.embeddingGroupAll, {
      opacity: prev >= 2 ? 1 : 0,
      y: prev >= 2 ? 0 : -8,
    });
    setIfAny(svgElement, SEL.idToEmbArrow, { opacity: prev >= 2 ? 1 : 0 });

    setIfAny(svgElement, SEL.transformerBox, {
      opacity: prev >= 3 ? 1 : 0,
      scaleY: prev >= 3 ? 1 : 0.95,
      transformOrigin: '50% 0%',
    });
    setIfAny(svgElement, SEL.insideTopEmbeddingsAll, {
      opacity: prev >= 3 ? 1 : 0,
      y: prev >= 3 ? 0 : -8,
    });
    setIfAny(svgElement, SEL.outerToBlockArrow, { opacity: prev >= 3 ? 1 : 0 });
    setIfAny(svgElement, SEL.shadowToBlockArrow, { opacity: prev >= 3 ? 1 : 0 });

    setIfAny(svgElement, SEL.insideBottomEmbeddingsAll, {
      opacity: prev >= 4 ? 1 : 0,
      y: prev >= 4 ? 0 : 8,
    });
    setIfAny(svgElement, SEL.attentionMashAll, { opacity: prev >= 4 ? 1 : 0 });

    setIfAny(svgElement, SEL.insideFfnEmbeddingsAll, {
      opacity: prev >= 5 ? 1 : 0,
      y: prev >= 5 ? 0 : 8,
    });
    setIfAny(svgElement, SEL.ffnArrow, { opacity: prev >= 5 ? 1 : 0 });
    setIfAny(svgElement, SEL.ffnArrowIn, { opacity: prev >= 5 ? 1 : 0 });
    setIfAny(svgElement, SEL.ffnArrowOut, { opacity: prev >= 5 ? 1 : 0 });
    setIfAny(svgElement, SEL.ffnProjectionBox, { opacity: prev >= 5 ? 1 : 0 });

    // Transformer stack reveal (shadows + label) — keep visible once revealed within the step
    {
      const nodes = qsa(svgElement, SEL.transformerShadowBox);
      if (nodes.length) {
        const anyRevealed = nodes.some((n) => n.getAttribute('data-revealed') === '1');
        gsap.set(nodes, { opacity: anyRevealed || keepStackVisible || prev >= 6 ? 1 : 0 });
      }
    }
    {
      const nodes = qsa(svgElement, SEL.transformerStackLabel);
      if (nodes.length) {
        const anyRevealed = nodes.some((n) => n.getAttribute('data-revealed') === '1');
        gsap.set(nodes, { opacity: anyRevealed || keepStackVisible || prev >= 6 ? 1 : 0 });
      }
    }

    // Bottom outside embeddings removed. Proceed directly to extraction after FFN.
    setIfAny(svgElement, SEL.extractedEmbedding, { opacity: 0 });
    setIfAny(svgElement, SEL.extractedPathArrow, {
      opacity: prev >= 7 ? 1 : 0,
    });
    setIfAny(svgElement, SEL.extractedHorizontal, {
      opacity: prev >= 7 ? 1 : 0,
    });
    setIfAny(svgElement, SEL.logprobArrow, { opacity: prev >= 8 ? 1 : 0 });
    setIfAny(svgElement, SEL.logprobVector, { opacity: prev >= 8 ? 1 : 0 });

    setIfAny(svgElement, SEL.distributionBar, {
      opacity: prev >= 9 ? 1 : 0,
      scaleY: prev >= 9 ? 1 : 0.1,
      transformOrigin: '50% 100%',
    });
    setIfAny(svgElement, SEL.distributionLabels, {
      opacity: prev >= 9 ? 1 : 0,
    });
    // Distribution items (arrows + labels) should be visible when distribution labels are
    setIfAny(svgElement, SEL.distributionItem, { opacity: prev >= 9 ? 1 : 0, y: 0 });
    // Highlight rectangle appears at the highlight sub-step (10)
    setIfAny(svgElement, SEL.distributionHighlightRect, { opacity: prev >= 10 ? 1 : 0 });
    // Append path arrow appears at sub-step 11 and stays through 12
    setIfAny(svgElement, SEL.appendPathArrow, { opacity: prev >= 11 ? 1 : 0 });
    // Preview token (text and underline) appears at sub-step 11
    setIfAny(svgElement, SEL.previewTokenText, { opacity: prev >= 11 ? 1 : 0 });
    setIfAny(svgElement, SEL.previewTokenUnderline, { opacity: prev >= 11 ? 1 : 0 });
  } else {
    // Subsequent steps: keep previous stacks visible based on sub-step
    setIfAny(svgElement, SEL.tokenPrev, { opacity: 1 });
    setIfAny(svgElement, SEL.tokenNew, { opacity: prev >= 0 ? 1 : 0 });

    setIfAny(svgElement, SEL.tokenIdPrev, { opacity: 1 });
    setIfAny(svgElement, SEL.tokenIdNew, { opacity: prev >= 1 ? 1 : 0 });

    setIfAny(svgElement, SEL.tokenIdArrowPrev, { opacity: 1 });
    setIfAny(svgElement, SEL.tokenIdArrowNew, { opacity: prev >= 1 ? 1 : 0 });

    setIfAny(svgElement, SEL.embeddingColPrev, { opacity: 1, y: 0 });
    setIfAny(svgElement, SEL.embeddingColNew, {
      opacity: prev >= 2 ? 1 : 0,
      y: prev >= 2 ? 0 : -8,
    });

    setIfAny(svgElement, SEL.idToEmbArrowPrev, { opacity: 1 });
    setIfAny(svgElement, SEL.idToEmbArrowNew, { opacity: prev >= 2 ? 1 : 0 });

    setIfAny(svgElement, SEL.transformerBox, {
      opacity: 1,
      scaleY: 1,
      transformOrigin: '50% 0%',
    });

    setIfAny(svgElement, SEL.insideTopEmbeddingColPrev, { opacity: 1, y: 0 });
    setIfAny(svgElement, SEL.insideTopEmbeddingColNew, {
      opacity: prev >= 3 ? 1 : 0,
      y: prev >= 3 ? 0 : -8,
    });

    setIfAny(svgElement, SEL.outerToBlockArrowPrev, { opacity: 1 });
    setIfAny(svgElement, SEL.outerToBlockArrowNew, { opacity: prev >= 3 ? 1 : 0 });
    setIfAny(svgElement, SEL.shadowToBlockArrowPrev, { opacity: 1 });
    setIfAny(svgElement, SEL.shadowToBlockArrowNew, { opacity: prev >= 3 ? 1 : 0 });

    setIfAny(svgElement, SEL.insideBottomEmbeddingColPrev, { opacity: 1, y: 0 });
    setIfAny(svgElement, SEL.insideBottomEmbeddingColNew, {
      opacity: prev >= 4 ? 1 : 0,
      y: prev >= 4 ? 0 : 8,
    });
    setIfAny(svgElement, SEL.attentionMashAll, { opacity: prev >= 4 ? 1 : 0 });

    setIfAny(svgElement, SEL.insideFfnEmbeddingColPrev, { opacity: 1, y: 0 });
    setIfAny(svgElement, SEL.insideFfnEmbeddingColNew, {
      opacity: prev >= 5 ? 1 : 0,
      y: prev >= 5 ? 0 : 8,
    });

    setIfAny(svgElement, SEL.ffnArrowPrev, { opacity: 1 });
    setIfAny(svgElement, SEL.ffnArrowNew, { opacity: prev >= 5 ? 1 : 0 });
    setIfAny(svgElement, SEL.ffnArrowInPrev, { opacity: 1 });
    setIfAny(svgElement, SEL.ffnArrowInNew, { opacity: prev >= 5 ? 1 : 0 });
    setIfAny(svgElement, SEL.ffnArrowOutPrev, { opacity: 1 });
    setIfAny(svgElement, SEL.ffnArrowOutNew, { opacity: prev >= 5 ? 1 : 0 });
    setIfAny(svgElement, SEL.ffnProjectionBoxPrev, { opacity: 1 });
    setIfAny(svgElement, SEL.ffnProjectionBoxNew, { opacity: prev >= 5 ? 1 : 0 });

    // Transformer stack reveal (shadows + label) — keep visible once revealed within the step
    {
      const nodes = qsa(svgElement, SEL.transformerShadowBox);
      if (nodes.length) {
        const anyRevealed = nodes.some((n) => n.getAttribute('data-revealed') === '1');
        gsap.set(nodes, { opacity: anyRevealed || keepStackVisible || prev >= 6 ? 1 : 0 });
      }
    }
    {
      const nodes = qsa(svgElement, SEL.transformerStackLabel);
      if (nodes.length) {
        const anyRevealed = nodes.some((n) => n.getAttribute('data-revealed') === '1');
        gsap.set(nodes, { opacity: anyRevealed || keepStackVisible || prev >= 6 ? 1 : 0 });
      }
    }

    // Bottom outside embeddings removed. Proceed directly to extraction after FFN.
    setIfAny(svgElement, SEL.extractedEmbedding, { opacity: 0 });
    setIfAny(svgElement, SEL.extractedPathArrow, {
      opacity: prev >= 7 ? 1 : 0,
    });
    setIfAny(svgElement, SEL.extractedHorizontal, {
      opacity: prev >= 7 ? 1 : 0,
    });
    setIfAny(svgElement, SEL.logprobArrow, { opacity: prev >= 8 ? 1 : 0 });
    setIfAny(svgElement, SEL.logprobVector, { opacity: prev >= 8 ? 1 : 0 });

    setIfAny(svgElement, SEL.distributionBar, {
      opacity: prev >= 9 ? 1 : 0,
      scaleY: prev >= 9 ? 1 : 0.1,
      transformOrigin: '50% 100%',
    });
    setIfAny(svgElement, SEL.distributionLabels, {
      opacity: prev >= 9 ? 1 : 0,
    });
    setIfAny(svgElement, SEL.distributionItem, { opacity: prev >= 9 ? 1 : 0, y: 0 });
    setIfAny(svgElement, SEL.distributionHighlightRect, { opacity: prev >= 10 ? 1 : 0 });
    setIfAny(svgElement, SEL.appendPathArrow, { opacity: prev >= 11 ? 1 : 0 });
    setIfAny(svgElement, SEL.previewTokenText, { opacity: prev >= 11 ? 1 : 0 });
    setIfAny(svgElement, SEL.previewTokenUnderline, { opacity: prev >= 11 ? 1 : 0 });
  }
}

/**
 * Build GSAP timeline for the current sub-step animation
 * @param {HTMLElement} svgElement - SVG DOM element
 * @param {number} subStep - Current animation sub-step
 * @param {boolean} isInitialStep - Whether this is step 1
 * @param {number} animDuration - Duration for each transition
 * @param {Function} onSubStepComplete - Callback when sub-step animation completes
 * @param {Function} onStepComplete - Callback when full step completes (only called on final sub-step)
 * @returns {gsap.core.Timeline} GSAP timeline
 */
export function buildTimeline(svgElement, subStep, isInitialStep, animDuration, onStepComplete) {
  const tl = gsap.timeline();
  const toIfAny = (selector, vars, position) => {
    const nodes = qsa(svgElement, selector);
    if (nodes.length) tl.to(nodes, vars, position);
  };

  // Optional: animate extracted embedding movement using stored deltas
  const animateExtraction = () => {
    const nodes = Array.from(svgElement.querySelectorAll(SEL.extractedEmbedding));
    nodes.forEach((el) => {
      const dx = Number(el.getAttribute('data-dx') || 0);
      const dy = Number(el.getAttribute('data-dy') || 0);
      const rot = Number(el.getAttribute('data-rotate') || 0);
      tl.to(el, { opacity: 1, duration: animDuration * 0.5 }, 0);
      if (dx !== 0 || dy !== 0) {
        // Move and rotate the extracted dummy rectangle so it aligns with the horizontal vector
        tl.to(
          el,
          { x: dx, y: dy, rotation: rot, transformOrigin: '50% 50%', duration: animDuration },
          '<'
        );
      }
    });
  };

  // Animate only the current sub-step delta
  switch (subStep) {
    case 0:
      toIfAny(isInitialStep ? SEL.token : SEL.tokenNew, { opacity: 1, duration: animDuration });
      break;
    case 1:
      toIfAny(isInitialStep ? SEL.tokenId : SEL.tokenIdNew, {
        opacity: 1,
        duration: animDuration,
      });
      toIfAny(
        isInitialStep ? SEL.tokenIdArrow : SEL.tokenIdArrowNew,
        { opacity: 1, duration: animDuration },
        '<'
      );
      break;
    case 2:
      toIfAny(isInitialStep ? SEL.embeddingGroupAll : SEL.embeddingColNew, {
        opacity: 1,
        y: 0,
        duration: animDuration,
      });
      toIfAny(
        isInitialStep ? SEL.idToEmbArrow : SEL.idToEmbArrowNew,
        { opacity: 1, duration: animDuration },
        '<'
      );
      break;
    case 3:
      if (isInitialStep) {
        toIfAny(SEL.transformerBox, { opacity: 1, scaleY: 1, duration: animDuration });
        toIfAny(SEL.insideTopEmbeddingsAll, { opacity: 1, y: 0, duration: animDuration }, '<');
        toIfAny(SEL.outerToBlockArrow, { opacity: 1, duration: animDuration }, '<');
        toIfAny(SEL.shadowToBlockArrow, { opacity: 1, duration: animDuration }, '<');
      } else {
        toIfAny(SEL.insideTopEmbeddingColNew, { opacity: 1, y: 0, duration: animDuration });
        toIfAny(SEL.outerToBlockArrowNew, { opacity: 1, duration: animDuration }, '<');
        toIfAny(SEL.shadowToBlockArrowNew, { opacity: 1, duration: animDuration }, '<');
      }
      break;
    case 4:
      toIfAny(isInitialStep ? SEL.insideBottomEmbeddingsAll : SEL.insideBottomEmbeddingColNew, {
        opacity: 1,
        y: 0,
        duration: animDuration,
      });
      toIfAny(SEL.attentionMashAll, { opacity: 1, duration: animDuration }, '<');
      break;
    case 5:
      toIfAny(isInitialStep ? SEL.insideFfnEmbeddingsAll : SEL.insideFfnEmbeddingColNew, {
        opacity: 1,
        y: 0,
        duration: animDuration,
      });
      toIfAny(
        isInitialStep ? SEL.ffnArrow : SEL.ffnArrowNew,
        { opacity: 1, duration: animDuration },
        '<'
      );
      toIfAny(
        isInitialStep ? SEL.ffnArrowIn : SEL.ffnArrowInNew,
        { opacity: 1, duration: animDuration },
        '<'
      );
      toIfAny(
        isInitialStep ? SEL.ffnArrowOut : SEL.ffnArrowOutNew,
        { opacity: 1, duration: animDuration },
        '<'
      );
      toIfAny(
        isInitialStep ? SEL.ffnProjectionBox : SEL.ffnProjectionBoxNew,
        { opacity: 1, duration: animDuration },
        '<'
      );
      break;
    case 6:
      // Reveal transformer stack (shadow cards) and 'Nx' label in a quick succession
      toIfAny(SEL.transformerShadowBox, {
        opacity: 1,
        stagger: 0.03,
        duration: animDuration * 0.4,
      });
      toIfAny(SEL.transformerStackLabel, { opacity: 1, duration: animDuration * 0.5 }, '<');
      // Mark as revealed so subsequent sub-steps in the same generation keep them visible
      {
        const nodes = qsa(svgElement, SEL.transformerShadowBox);
        if (nodes.length) tl.set(nodes, { attr: { 'data-revealed': '1' } }, '>-0.1');
      }
      {
        const nodes = qsa(svgElement, SEL.transformerStackLabel);
        if (nodes.length) tl.set(nodes, { attr: { 'data-revealed': '1' } }, '<');
      }
      break;
    case 7:
      animateExtraction();
      toIfAny(SEL.extractedPathArrow, { opacity: 1, duration: animDuration });
      toIfAny(SEL.extractedHorizontal, { opacity: 1, duration: animDuration });
      break;
    case 8:
      toIfAny(SEL.logprobArrow, { opacity: 1, duration: animDuration });
      toIfAny(SEL.logprobVector, { opacity: 1, duration: animDuration }, '<');
      break;
    case 9:
      // Show arrows + labels for all candidates without highlighting
      toIfAny(SEL.distributionItem, { opacity: 1, duration: animDuration });
      toIfAny(SEL.distributionBar, { opacity: 1, scaleY: 1, duration: animDuration }, '<');
      toIfAny(SEL.distributionLabels, { opacity: 1, duration: animDuration }, '<');
      break;
    case 10:
      // Highlight the selected output token: bolden and pulse the token label
      toIfAny(`${SEL.distributionItemSelected} ${SEL.distributionTokenLabel}`, {
        fontWeight: 700,
        duration: animDuration * 0.6,
      });
      // Subtle pulse (zoom in then out) on the token label
      toIfAny(
        `${SEL.distributionItemSelected} ${SEL.distributionTokenLabel}`,
        {
          scale: 1.12,
          transformOrigin: '50% 50%',
          duration: animDuration * 0.45,
          yoyo: true,
          repeat: 1,
          ease: 'power1.inOut',
        },
        '<+0.02'
      );
      // Slightly emphasize the percentage label too (no pulse)
      toIfAny(
        `${SEL.distributionItemSelected} ${SEL.distributionPercentageLabel}`,
        { fontWeight: 700, duration: animDuration * 0.35 },
        '<'
      );
      // Pulse the percentage label together with token label
      toIfAny(
        `${SEL.distributionItemSelected} ${SEL.distributionPercentageLabel}`,
        {
          scale: 1.12,
          transformOrigin: '50% 50%',
          duration: animDuration * 0.45,
          yoyo: true,
          repeat: 1,
          ease: 'power1.inOut',
        },
        '<+0.02'
      );

      // Show purple rounded outline around the selected item (covering arrow, token and percentage and the logprob cell)
      toIfAny(
        SEL.distributionHighlightRect,
        {
          opacity: 1,
          scale: 1,
          transformOrigin: '50% 50%',
          duration: animDuration * 0.45,
          ease: 'power1.out',
        },
        '<'
      );
      break;
    case 11:
      // Show the backmost append path arrow (drawn by renderer) and the preview token
      toIfAny(SEL.appendPathArrow, { opacity: 1, duration: animDuration * 0.6 });
      toIfAny(SEL.previewTokenText, { opacity: 1, duration: animDuration * 0.6 }, '<');
      toIfAny(SEL.previewTokenUnderline, { opacity: 1, duration: animDuration * 0.6 }, '<');
      break;
    case 12:
      // Arrow stays visible; tiny delay to allow user to see it before step completes
      tl.to({}, { duration: Math.max(0.05, animDuration * 0.3) });
      break;
    default:
      break;
  }

  if (subStep === 12 && typeof onStepComplete === 'function') {
    tl.eventCallback('onComplete', onStepComplete);
  }

  return tl;
}
