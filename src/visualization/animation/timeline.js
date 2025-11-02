/**
 * GSAP timeline builder for sub-step animations
 * Pure function that returns animation configuration based on step state
 */
import { gsap } from 'gsap';
import { ALL_SELECTORS as SEL } from '../core/selectors';

/**
 * Set initial states for all elements based on current sub-step
 * @param {HTMLElement} svgElement - SVG DOM element
 * @param {number} subStep - Current animation sub-step
 * @param {boolean} isInitialStep - Whether this is step 1
 */
export function setInitialStates(svgElement, subStep, isInitialStep) {
  if (isInitialStep) {
    // Initial visualization: set states based on what should already be visible
    gsap.set(svgElement.querySelectorAll(SEL.token), { opacity: subStep >= 0 ? 1 : 0 });
    gsap.set(svgElement.querySelectorAll(SEL.tokenId), { opacity: subStep >= 1 ? 1 : 0 });
    gsap.set(svgElement.querySelectorAll(SEL.tokenIdArrow), { opacity: subStep >= 1 ? 1 : 0 });

    gsap.set(svgElement.querySelectorAll(SEL.embeddingGroupAll), {
      opacity: subStep >= 2 ? 1 : 0,
      y: subStep >= 2 ? 0 : -8,
    });
    gsap.set(svgElement.querySelectorAll(SEL.idToEmbArrow), { opacity: subStep >= 2 ? 1 : 0 });

    gsap.set(svgElement.querySelectorAll(SEL.transformerBox), {
      opacity: subStep >= 3 ? 1 : 0,
      scaleY: subStep >= 3 ? 1 : 0.95,
      transformOrigin: '50% 0%',
    });
    gsap.set(svgElement.querySelectorAll(SEL.insideTopEmbeddingsAll), {
      opacity: subStep >= 3 ? 1 : 0,
      y: subStep >= 3 ? 0 : -8,
    });
    gsap.set(svgElement.querySelectorAll(SEL.outerToBlockArrow), { opacity: subStep >= 3 ? 1 : 0 });
    gsap.set(svgElement.querySelectorAll(SEL.attentionMashAll), { opacity: subStep >= 3 ? 1 : 0 });

    gsap.set(svgElement.querySelectorAll(SEL.insideBottomEmbeddingsAll), {
      opacity: subStep >= 4 ? 1 : 0,
      y: subStep >= 4 ? 0 : 8,
    });
    gsap.set(svgElement.querySelectorAll(SEL.ffnArrow), { opacity: subStep >= 4 ? 1 : 0 });

    gsap.set(svgElement.querySelectorAll(SEL.bottomEmbeddingGroupAll), {
      opacity: subStep >= 5 ? 1 : 0,
      y: subStep >= 5 ? 0 : 8,
    });

    gsap.set(svgElement.querySelectorAll(SEL.extractedEmbedding), { opacity: 0 });
    gsap.set(svgElement.querySelectorAll(SEL.extractedPathArrow), {
      opacity: subStep >= 7 ? 1 : 0,
    });
    gsap.set(svgElement.querySelectorAll(SEL.extractedHorizontal), {
      opacity: subStep >= 7 ? 1 : 0,
    });
    gsap.set(svgElement.querySelectorAll(SEL.logprobArrow), { opacity: subStep >= 7 ? 1 : 0 });
    gsap.set(svgElement.querySelectorAll(SEL.logprobVector), { opacity: subStep >= 7 ? 1 : 0 });

    gsap.set(svgElement.querySelectorAll(SEL.distributionBar), {
      opacity: subStep >= 8 ? 1 : 0,
      scaleY: subStep >= 8 ? 1 : 0.1,
      transformOrigin: '50% 100%',
    });
    gsap.set(svgElement.querySelectorAll(SEL.distributionLabels), {
      opacity: subStep >= 8 ? 1 : 0,
    });
  } else {
    // Subsequent steps: keep previous stacks visible based on sub-step
    gsap.set(svgElement.querySelectorAll(SEL.tokenPrev), { opacity: 1 });
    gsap.set(svgElement.querySelectorAll(SEL.tokenNew), { opacity: subStep >= 0 ? 1 : 0 });

    gsap.set(svgElement.querySelectorAll(SEL.tokenIdPrev), { opacity: 1 });
    gsap.set(svgElement.querySelectorAll(SEL.tokenIdNew), { opacity: subStep >= 1 ? 1 : 0 });

    gsap.set(svgElement.querySelectorAll(SEL.tokenIdArrowPrev), { opacity: 1 });
    gsap.set(svgElement.querySelectorAll(SEL.tokenIdArrowNew), { opacity: subStep >= 1 ? 1 : 0 });

    gsap.set(svgElement.querySelectorAll(SEL.embeddingColPrev), { opacity: 1, y: 0 });
    gsap.set(svgElement.querySelectorAll(SEL.embeddingColNew), {
      opacity: subStep >= 2 ? 1 : 0,
      y: subStep >= 2 ? 0 : -8,
    });

    gsap.set(svgElement.querySelectorAll(SEL.idToEmbArrowPrev), { opacity: 1 });
    gsap.set(svgElement.querySelectorAll(SEL.idToEmbArrowNew), { opacity: subStep >= 2 ? 1 : 0 });

    gsap.set(svgElement.querySelectorAll(SEL.transformerBox), {
      opacity: 1,
      scaleY: 1,
      transformOrigin: '50% 0%',
    });

    gsap.set(svgElement.querySelectorAll(SEL.insideTopEmbeddingColPrev), { opacity: 1, y: 0 });
    gsap.set(svgElement.querySelectorAll(SEL.insideTopEmbeddingColNew), {
      opacity: subStep >= 3 ? 1 : 0,
      y: subStep >= 3 ? 0 : -8,
    });

    gsap.set(svgElement.querySelectorAll(SEL.outerToBlockArrowPrev), { opacity: 1 });
    gsap.set(svgElement.querySelectorAll(SEL.outerToBlockArrowNew), {
      opacity: subStep >= 3 ? 1 : 0,
    });

    gsap.set(svgElement.querySelectorAll(SEL.attentionMashAll), { opacity: 1 });

    gsap.set(svgElement.querySelectorAll(SEL.insideBottomEmbeddingColPrev), { opacity: 1, y: 0 });
    gsap.set(svgElement.querySelectorAll(SEL.insideBottomEmbeddingColNew), {
      opacity: subStep >= 4 ? 1 : 0,
      y: subStep >= 4 ? 0 : 8,
    });

    gsap.set(svgElement.querySelectorAll(SEL.ffnArrowPrev), { opacity: 1 });
    gsap.set(svgElement.querySelectorAll(SEL.ffnArrowNew), { opacity: subStep >= 4 ? 1 : 0 });

    gsap.set(svgElement.querySelectorAll(SEL.bottomEmbeddingColPrev), { opacity: 1, y: 0 });
    gsap.set(svgElement.querySelectorAll(SEL.bottomEmbeddingColNew), {
      opacity: subStep >= 5 ? 1 : 0,
      y: subStep >= 5 ? 0 : 8,
    });

    gsap.set(svgElement.querySelectorAll(SEL.extractedEmbedding), { opacity: 0 });
    gsap.set(svgElement.querySelectorAll(SEL.extractedPathArrow), {
      opacity: subStep >= 7 ? 1 : 0,
    });
    gsap.set(svgElement.querySelectorAll(SEL.extractedHorizontal), {
      opacity: subStep >= 7 ? 1 : 0,
    });
    gsap.set(svgElement.querySelectorAll(SEL.logprobArrow), { opacity: subStep >= 7 ? 1 : 0 });
    gsap.set(svgElement.querySelectorAll(SEL.logprobVector), { opacity: subStep >= 7 ? 1 : 0 });

    gsap.set(svgElement.querySelectorAll(SEL.distributionBar), {
      opacity: subStep >= 8 ? 1 : 0,
      scaleY: subStep >= 8 ? 1 : 0.1,
      transformOrigin: '50% 100%',
    });
    gsap.set(svgElement.querySelectorAll(SEL.distributionLabels), {
      opacity: subStep >= 8 ? 1 : 0,
    });
  }
}

/**
 * Build GSAP timeline for the current sub-step animation
 * @param {HTMLElement} svgElement - SVG DOM element
 * @param {number} subStep - Current animation sub-step
 * @param {boolean} isInitialStep - Whether this is step 1
 * @param {number} animDuration - Duration for each transition
 * @param {Function} onComplete - Callback when animation completes
 * @returns {gsap.core.Timeline} GSAP timeline
 */
export function buildTimeline(svgElement, subStep, isInitialStep, animDuration, onComplete) {
  const tl = gsap.timeline({
    onComplete: () => {
      if (onComplete) onComplete();
    },
  });

  // Initial step has special timeline
  if (isInitialStep) {
    tl.to(svgElement.querySelectorAll(SEL.token), { opacity: 1, duration: animDuration }, 0);
    tl.to(
      svgElement.querySelectorAll(SEL.tokenId),
      { opacity: 1, duration: animDuration },
      `+=${animDuration * 0.5}`
    );
    tl.to(
      svgElement.querySelectorAll(SEL.tokenIdArrow),
      { opacity: 1, duration: animDuration },
      '<'
    );

    tl.to(
      svgElement.querySelectorAll(SEL.embeddingGroupAll),
      { opacity: 1, y: 0, duration: animDuration },
      `+=${animDuration * 0.5}`
    );
    tl.to(
      svgElement.querySelectorAll(SEL.idToEmbArrow),
      { opacity: 1, duration: animDuration },
      '<'
    );

    tl.to(
      svgElement.querySelectorAll(SEL.transformerBox),
      { opacity: 1, scaleY: 1, duration: animDuration },
      `+=${animDuration * 0.5}`
    );
    tl.to(
      svgElement.querySelectorAll(SEL.insideTopEmbeddingsAll),
      { opacity: 1, y: 0, duration: animDuration },
      '<'
    );
    tl.to(
      svgElement.querySelectorAll(SEL.outerToBlockArrow),
      { opacity: 1, duration: animDuration },
      '<'
    );
    tl.to(
      svgElement.querySelectorAll(SEL.attentionMashAll),
      { opacity: 1, duration: animDuration },
      '<'
    );

    tl.to(
      svgElement.querySelectorAll(SEL.insideBottomEmbeddingsAll),
      { opacity: 1, y: 0, duration: animDuration },
      `+=${animDuration * 0.5}`
    );
    tl.to(svgElement.querySelectorAll(SEL.ffnArrow), { opacity: 1, duration: animDuration }, '<');

    tl.to(
      svgElement.querySelectorAll(SEL.bottomEmbeddingGroupAll),
      { opacity: 1, y: 0, duration: animDuration },
      `+=${animDuration * 0.5}`
    );

    tl.to(
      svgElement.querySelectorAll(SEL.extractedPathArrow),
      { opacity: 1, duration: animDuration },
      `+=${animDuration * 0.5}`
    );
    tl.to(
      svgElement.querySelectorAll(SEL.extractedHorizontal),
      { opacity: 1, duration: animDuration },
      '<'
    );

    tl.to(
      svgElement.querySelectorAll(SEL.logprobArrow),
      { opacity: 1, duration: animDuration },
      `+=${animDuration * 0.5}`
    );
    tl.to(
      svgElement.querySelectorAll(SEL.logprobVector),
      { opacity: 1, duration: animDuration },
      '<'
    );

    tl.to(
      svgElement.querySelectorAll(SEL.distributionBar),
      { opacity: 1, scaleY: 1, duration: animDuration },
      `+=${animDuration * 0.5}`
    );
    tl.to(
      svgElement.querySelectorAll(SEL.distributionLabels),
      { opacity: 1, duration: animDuration },
      '<'
    );
  } else {
    // Subsequent steps: animate new elements only
    tl.to(svgElement.querySelectorAll(SEL.tokenNew), { opacity: 1, duration: animDuration }, 0);

    tl.to(
      svgElement.querySelectorAll(SEL.tokenIdNew),
      { opacity: 1, duration: animDuration },
      `+=${animDuration * 0.5}`
    );
    tl.to(
      svgElement.querySelectorAll(SEL.tokenIdArrowNew),
      { opacity: 1, duration: animDuration },
      '<'
    );

    tl.to(
      svgElement.querySelectorAll(SEL.embeddingColNew),
      { opacity: 1, y: 0, duration: animDuration },
      `+=${animDuration * 0.5}`
    );
    tl.to(
      svgElement.querySelectorAll(SEL.idToEmbArrowNew),
      { opacity: 1, duration: animDuration },
      '<'
    );

    tl.to(
      svgElement.querySelectorAll(SEL.insideTopEmbeddingColNew),
      { opacity: 1, y: 0, duration: animDuration },
      `+=${animDuration * 0.5}`
    );
    tl.to(
      svgElement.querySelectorAll(SEL.outerToBlockArrowNew),
      { opacity: 1, duration: animDuration },
      '<'
    );

    tl.to(
      svgElement.querySelectorAll(SEL.insideBottomEmbeddingColNew),
      { opacity: 1, y: 0, duration: animDuration },
      `+=${animDuration * 0.5}`
    );
    tl.to(
      svgElement.querySelectorAll(SEL.ffnArrowNew),
      { opacity: 1, duration: animDuration },
      '<'
    );

    tl.to(
      svgElement.querySelectorAll(SEL.bottomEmbeddingColNew),
      { opacity: 1, y: 0, duration: animDuration },
      `+=${animDuration * 0.5}`
    );

    tl.to(
      svgElement.querySelectorAll(SEL.extractedPathArrow),
      { opacity: 1, duration: animDuration },
      `+=${animDuration * 0.5}`
    );
    tl.to(
      svgElement.querySelectorAll(SEL.extractedHorizontal),
      { opacity: 1, duration: animDuration },
      '<'
    );

    tl.to(
      svgElement.querySelectorAll(SEL.logprobArrow),
      { opacity: 1, duration: animDuration },
      `+=${animDuration * 0.5}`
    );
    tl.to(
      svgElement.querySelectorAll(SEL.logprobVector),
      { opacity: 1, duration: animDuration },
      '<'
    );

    tl.to(
      svgElement.querySelectorAll(SEL.distributionBar),
      { opacity: 1, scaleY: 1, duration: animDuration },
      `+=${animDuration * 0.5}`
    );
    tl.to(
      svgElement.querySelectorAll(SEL.distributionLabels),
      { opacity: 1, duration: animDuration },
      '<'
    );
  }

  return tl;
}
