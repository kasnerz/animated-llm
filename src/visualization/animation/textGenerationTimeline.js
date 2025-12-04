import { gsap } from 'gsap';
import { ALL_SELECTORS as SEL } from '../core/selectors';
import { TEXT_GEN_STEPS } from '../core/constants';

// Utilities
const qsa = (root, selector) => (root ? Array.from(root.querySelectorAll(selector)) : []);

const setIfAny = (root, selector, vars) => {
  const nodes = qsa(root, selector);
  if (!nodes.length) return;

  // Automatically manage pointer-events for tooltip elements based on opacity
  // This prevents tooltips from appearing on invisible elements
  if (vars.opacity !== undefined) {
    const hasTooltip = nodes.some((node) => node.hasAttribute('data-tooltip-id'));
    if (hasTooltip && vars.pointerEvents === undefined) {
      vars = { ...vars, pointerEvents: vars.opacity > 0 ? 'all' : 'none' };
    }
  }

  gsap.set(nodes, vars);
};

const toIfAny = (tl, root, selector, vars, pos) => {
  const nodes = qsa(root, selector);
  if (!nodes.length) return;

  // Automatically manage pointer-events for tooltip elements based on opacity
  // This prevents tooltips from appearing on invisible elements
  if (vars.opacity !== undefined) {
    const hasTooltip = nodes.some((node) => node.hasAttribute('data-tooltip-id'));
    if (hasTooltip && vars.pointerEvents === undefined) {
      vars = { ...vars, pointerEvents: vars.opacity > 0 ? 'all' : 'none' };
    }
  }

  tl.to(nodes, vars, pos);
};

export function setInitialStates(svgElement, subStep) {
  if (!svgElement) return;

  const isVisible = (start, end) => {
    // Use previous step state for initialization to allow animation to current step
    const prevStep = subStep - 1;
    if (end !== undefined) {
      return prevStep >= start && prevStep < end;
    }
    return prevStep >= start;
  };

  // Step 0: Token (and Token ID)
  const showToken = isVisible(TEXT_GEN_STEPS.TOKEN);
  setIfAny(svgElement, SEL.token, { opacity: showToken ? 1 : 0 });
  setIfAny(svgElement, SEL.tokenId, { opacity: showToken ? 1 : 0 });
  setIfAny(svgElement, SEL.tokenIdArrow, { opacity: showToken ? 1 : 0 });

  // Step 1: Embedding
  const showEmb = isVisible(TEXT_GEN_STEPS.EMBEDDING);
  setIfAny(svgElement, SEL.embeddingGroupAll, { opacity: showEmb ? 1 : 0, y: showEmb ? 0 : -8 });
  setIfAny(svgElement, SEL.idToEmbArrow, { opacity: showEmb ? 1 : 0 });

  // Step 2: Block Input (First)
  const showBlock = isVisible(TEXT_GEN_STEPS.BLOCK_INPUT_FIRST);
  setIfAny(svgElement, SEL.transformerBox, {
    opacity: showBlock ? 1 : 0,
    scaleY: showBlock ? 1 : 0.95,
    transformOrigin: '50% 0%',
  });

  const prevStep = subStep - 1;

  // Inside Top Embeddings
  const showTopEmbeddings =
    (prevStep >= TEXT_GEN_STEPS.BLOCK_INPUT_FIRST && prevStep < TEXT_GEN_STEPS.STACK_REVEAL) ||
    prevStep >= TEXT_GEN_STEPS.BLOCK_INPUT_LAST;
  setIfAny(svgElement, SEL.insideTopEmbeddingsAll, {
    opacity: showTopEmbeddings ? 1 : 0,
    y: showTopEmbeddings ? 0 : -8,
  });

  // Outer to Block Arrow: Visible 2..6. Hidden at 6+ (Last Layer uses Shadow Arrow).
  const showOuterArrow = isVisible(
    TEXT_GEN_STEPS.BLOCK_INPUT_FIRST,
    TEXT_GEN_STEPS.BLOCK_INPUT_LAST
  );
  setIfAny(svgElement, SEL.outerToBlockArrow, { opacity: showOuterArrow ? 1 : 0 });

  // Shadow Arrow: Visible 6.. (Last Layer).
  const showShadowArrow = isVisible(TEXT_GEN_STEPS.BLOCK_INPUT_LAST);
  setIfAny(svgElement, SEL.shadowToBlockArrow, { opacity: showShadowArrow ? 1 : 0 });
  setIfAny(svgElement, '.positional-through-arrow', { opacity: showShadowArrow ? 1 : 0 });

  setIfAny(svgElement, `${SEL.positionalEmb} circle`, { opacity: showBlock ? 0.9 : 0 });
  setIfAny(svgElement, `${SEL.positionalEmb} text`, { opacity: showBlock ? 1 : 0 });

  // Step 3: Attention (First)
  const showAttn =
    (prevStep >= TEXT_GEN_STEPS.ATTENTION_FIRST && prevStep < TEXT_GEN_STEPS.STACK_REVEAL) ||
    prevStep >= TEXT_GEN_STEPS.ATTENTION_LAST;
  const showBottomEmbeddings = showAttn;
  setIfAny(svgElement, SEL.insideBottomEmbeddingsAll, {
    opacity: showBottomEmbeddings ? 1 : 0,
    y: showBottomEmbeddings ? 0 : 8,
  });
  setIfAny(svgElement, SEL.attentionMashAll, { opacity: showAttn ? 1 : 0 });

  // Step 4: FFN (First)
  const showFfn =
    (prevStep >= TEXT_GEN_STEPS.FFN_FIRST && prevStep < TEXT_GEN_STEPS.STACK_REVEAL) ||
    prevStep >= TEXT_GEN_STEPS.FFN_LAST;
  const showFfnEmbeddings = showFfn;
  setIfAny(svgElement, SEL.insideFfnEmbeddingsAll, {
    opacity: showFfnEmbeddings ? 1 : 0,
    y: showFfnEmbeddings ? 0 : 8,
  });
  setIfAny(svgElement, SEL.ffnArrow, { opacity: showFfn ? 1 : 0 });
  setIfAny(svgElement, SEL.ffnArrowIn, { opacity: showFfn ? 1 : 0 });
  setIfAny(svgElement, SEL.ffnArrowOut, { opacity: showFfn ? 1 : 0 });
  setIfAny(svgElement, SEL.ffnProjectionBox, { opacity: showFfn ? 1 : 0 });

  // Step 5: Stack Reveal
  const showStack = isVisible(TEXT_GEN_STEPS.STACK_REVEAL);
  setIfAny(svgElement, SEL.transformerShadowBox, { opacity: showStack ? 1 : 0 });
  setIfAny(svgElement, SEL.transformerStackLabel, { opacity: showStack ? 1 : 0 });

  // Step 9: Extraction
  const showExtracted = isVisible(TEXT_GEN_STEPS.EXTRACTION);
  setIfAny(svgElement, SEL.extractedEmbedding, { opacity: showExtracted ? 1 : 0 });
  setIfAny(svgElement, SEL.extractedPathArrow, { opacity: showExtracted ? 1 : 0 });
  setIfAny(svgElement, SEL.extractedHorizontal, { opacity: showExtracted ? 1 : 0 });

  // Step 10: Logprob
  const showLogprob = isVisible(TEXT_GEN_STEPS.LOGPROB);
  setIfAny(svgElement, SEL.logprobArrow, { opacity: showLogprob ? 1 : 0 });
  setIfAny(svgElement, SEL.logprobVector, { opacity: showLogprob ? 1 : 0 });

  // Step 11: Distribution
  const showDist = isVisible(TEXT_GEN_STEPS.DISTRIBUTION);
  setIfAny(svgElement, SEL.distributionBar, {
    opacity: showDist ? 1 : 0,
    scaleY: showDist ? 1 : 0.1,
    transformOrigin: '50% 100%',
  });
  setIfAny(svgElement, SEL.distributionLabels, { opacity: showDist ? 1 : 0 });
  setIfAny(svgElement, SEL.distributionItem, { opacity: showDist ? 1 : 0 });

  // Step 12: Highlight
  const showHighlight = isVisible(TEXT_GEN_STEPS.HIGHLIGHT);
  setIfAny(svgElement, SEL.distributionHighlightRect, { opacity: showHighlight ? 1 : 0 });

  // Step 13: Append
  const showAppend = isVisible(TEXT_GEN_STEPS.APPEND);
  setIfAny(svgElement, SEL.appendPathArrow, { opacity: showAppend ? 1 : 0 });

  // Step 14: Preview
  const showPreview = isVisible(TEXT_GEN_STEPS.PREVIEW);
  setIfAny(svgElement, SEL.previewTokenText, { opacity: showPreview ? 1 : 0 });
  setIfAny(svgElement, SEL.previewTokenUnderline, { opacity: showPreview ? 1 : 0 });

  // Labels
  // Label logic if needed in the future
}

export function buildTimeline(svgElement, subStep, isInitialStep, animDuration, onStepComplete) {
  const tl = gsap.timeline({ onComplete: onStepComplete });
  const add = (sel, vars, pos) => toIfAny(tl, svgElement, sel, vars, pos);

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

  switch (subStep) {
    case TEXT_GEN_STEPS.TOKEN:
      add(SEL.token, { opacity: 1, duration: animDuration });
      add(SEL.tokenId, { opacity: 1, duration: animDuration }, '<');
      add(SEL.tokenIdArrow, { opacity: 1, duration: animDuration }, '<');
      break;
    case TEXT_GEN_STEPS.EMBEDDING:
      add(SEL.embeddingGroupAll, { opacity: 1, y: 0, duration: animDuration });
      add(SEL.idToEmbArrow, { opacity: 1, duration: animDuration }, '<');
      break;
    case TEXT_GEN_STEPS.BLOCK_INPUT_FIRST:
      add(SEL.transformerBox, { opacity: 1, scaleY: 1, duration: animDuration });
      add(SEL.insideTopEmbeddingsAll, { opacity: 1, y: 0, duration: animDuration }, '<');
      add(SEL.outerToBlockArrow, { opacity: 1, duration: animDuration }, '<');
      add(`${SEL.positionalEmb} circle`, { opacity: 0.9, duration: animDuration }, '<');
      add(`${SEL.positionalEmb} text`, { opacity: 1, duration: animDuration }, '<');
      break;
    case TEXT_GEN_STEPS.ATTENTION_FIRST:
      add(SEL.insideBottomEmbeddingsAll, { opacity: 1, y: 0, duration: animDuration });
      add(SEL.attentionMashAll, { opacity: 1, duration: animDuration }, '<');
      break;
    case TEXT_GEN_STEPS.FFN_FIRST:
      add(SEL.insideFfnEmbeddingsAll, { opacity: 1, y: 0, duration: animDuration });
      add(SEL.ffnArrow, { opacity: 1, duration: animDuration }, '<');
      add(SEL.ffnArrowIn, { opacity: 1, duration: animDuration }, '<');
      add(SEL.ffnArrowOut, { opacity: 1, duration: animDuration }, '<');
      add(SEL.ffnProjectionBox, { opacity: 1, duration: animDuration }, '<');
      break;
    case TEXT_GEN_STEPS.STACK_REVEAL:
      add(SEL.transformerShadowBox, { opacity: 1, stagger: 0.03, duration: animDuration * 0.4 });
      add(SEL.transformerStackLabel, { opacity: 1, duration: animDuration * 0.5 }, '<');
      // Ensure outer-to-block arrow is visible here too, as it persists until BLOCK_INPUT_LAST
      add(SEL.outerToBlockArrow, { opacity: 1, duration: animDuration * 0.5 }, '<');
      break;
    case TEXT_GEN_STEPS.BLOCK_INPUT_LAST:
      add(SEL.insideTopEmbeddingsAll, { opacity: 1, y: 0, duration: animDuration });
      add(SEL.shadowToBlockArrow, { opacity: 1, duration: animDuration }, '<');
      add('.positional-through-arrow', { opacity: 1, duration: animDuration }, '<');
      break;
    case TEXT_GEN_STEPS.ATTENTION_LAST:
      add(SEL.insideBottomEmbeddingsAll, { opacity: 1, y: 0, duration: animDuration });
      add(SEL.attentionMashAll, { opacity: 1, duration: animDuration }, '<');
      break;
    case TEXT_GEN_STEPS.FFN_LAST:
      add(SEL.insideFfnEmbeddingsAll, { opacity: 1, y: 0, duration: animDuration });
      add(SEL.ffnArrow, { opacity: 1, duration: animDuration }, '<');
      add(SEL.ffnArrowIn, { opacity: 1, duration: animDuration }, '<');
      add(SEL.ffnArrowOut, { opacity: 1, duration: animDuration }, '<');
      add(SEL.ffnProjectionBox, { opacity: 1, duration: animDuration }, '<');
      break;
    case TEXT_GEN_STEPS.EXTRACTION:
      animateExtraction();
      add(SEL.extractedPathArrow, { opacity: 1, duration: animDuration }, '<');
      add(SEL.extractedHorizontal, { opacity: 1, duration: animDuration }, '<');
      break;
    case TEXT_GEN_STEPS.LOGPROB:
      add(SEL.logprobArrow, { opacity: 1, duration: animDuration });
      add(SEL.logprobVector, { opacity: 1, duration: animDuration }, '<');
      break;
    case TEXT_GEN_STEPS.DISTRIBUTION:
      add(SEL.distributionItem, { opacity: 1, duration: animDuration });
      add(SEL.distributionBar, { opacity: 1, scaleY: 1, duration: animDuration }, '<');
      add(SEL.distributionLabels, { opacity: 1, duration: animDuration }, '<');
      break;
    case TEXT_GEN_STEPS.HIGHLIGHT:
      // Highlight the selected output token: bolden and pulse the token label
      add(`${SEL.distributionItemSelected} ${SEL.distributionTokenLabel}`, {
        fontWeight: 700,
        duration: animDuration * 0.6,
      });
      // Subtle pulse (zoom in then out) on the token label
      add(
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
      add(
        `${SEL.distributionItemSelected} ${SEL.distributionPercentageLabel}`,
        { fontWeight: 700, duration: animDuration * 0.35 },
        '<'
      );
      // Pulse the percentage label together with token label
      add(
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
      add(
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
    case TEXT_GEN_STEPS.APPEND:
      add(SEL.appendPathArrow, { opacity: 1, duration: animDuration * 0.6 });
      break;
    case TEXT_GEN_STEPS.PREVIEW:
      add(SEL.previewTokenText, { opacity: 1, duration: animDuration * 0.6 });
      add(SEL.previewTokenUnderline, { opacity: 1, duration: animDuration * 0.6 }, '<');
      break;
  }

  return tl;
}
