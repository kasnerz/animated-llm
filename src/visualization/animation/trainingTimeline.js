import { gsap } from 'gsap';
import { ALL_SELECTORS as SEL } from '../core/selectors';
import { TRAINING_STEPS } from '../core/constants';

// Utilities
const qsa = (root, selector) => (root ? Array.from(root.querySelectorAll(selector)) : []);

const setIfAny = (root, selector, vars) => {
  const nodes = qsa(root, selector);
  if (!nodes.length) return;

  if (vars && typeof vars === 'object' && Object.prototype.hasOwnProperty.call(vars, 'className')) {
    const cn = vars.className;
    nodes.forEach((node) => {
      if (typeof cn === 'string') {
        if (cn.startsWith('+= ')) {
          const toAdd = cn.slice(3).trim();
          if (toAdd) node.classList.add(toAdd);
        } else if (cn.startsWith('+=')) {
          const toAdd = cn.slice(2).trim();
          if (toAdd) node.classList.add(toAdd);
        } else if (cn.startsWith('-=')) {
          const toRemove = cn.slice(2).trim();
          if (toRemove) node.classList.remove(toRemove);
        } else {
          node.setAttribute('class', cn);
        }
      }
    });
    const { className: _className, ...rest } = vars;
    if (Object.keys(rest).length) {
      gsap.set(nodes, rest);
    }
    return;
  }

  gsap.set(nodes, vars);
};

const toIfAny = (tl, root, selector, vars, pos) => {
  const nodes = qsa(root, selector);
  if (!nodes.length) return;

  if (vars && typeof vars === 'object' && Object.prototype.hasOwnProperty.call(vars, 'className')) {
    const cn = vars.className;
    tl.call(
      () => {
        nodes.forEach((node) => {
          if (typeof cn === 'string') {
            if (cn.startsWith('+= ')) {
              const toAdd = cn.slice(3).trim();
              if (toAdd) node.classList.add(toAdd);
            } else if (cn.startsWith('+=')) {
              const toAdd = cn.slice(2).trim();
              if (toAdd) node.classList.add(toAdd);
            } else if (cn.startsWith('-=')) {
              const toRemove = cn.slice(2).trim();
              if (toRemove) node.classList.remove(toRemove);
            } else {
              node.setAttribute('class', cn);
            }
          }
        });
      },
      null,
      pos
    );
    const { className: _className, ...rest } = vars;
    if (Object.keys(rest).length) {
      tl.to(nodes, rest, pos);
    }
    return;
  }
  tl.to(nodes, vars, pos);
};

/**
 * Initialize all elements as hidden prior to running the training step animation.
 */
export function setInitialStates(svgElement, subStep, isInitialStep, labelsSvgElement = null) {
  if (!svgElement) return;

  const isVisible = (start, end) => {
    // Use previous step state for initialization to allow animation to current step
    const prevStep = subStep - 1;
    if (end !== undefined) {
      return prevStep >= start && prevStep < end;
    }
    return prevStep >= start;
  };

  // --- 1. Visibility & Position (Standard Steps) ---

  // Step 0: Token
  const showToken = isVisible(TRAINING_STEPS.TOKEN);
  setIfAny(svgElement, SEL.token, { opacity: showToken ? 1 : 0 });
  setIfAny(svgElement, SEL.tokenId, { opacity: showToken ? 1 : 0 });
  setIfAny(svgElement, SEL.tokenIdArrow, { opacity: showToken ? 1 : 0 });

  // Step 1: Embedding
  const showEmb = isVisible(TRAINING_STEPS.EMBEDDING);
  setIfAny(svgElement, SEL.embeddingGroupAll, { opacity: showEmb ? 1 : 0, y: showEmb ? 0 : -8 });
  setIfAny(svgElement, SEL.idToEmbArrow, { opacity: showEmb ? 1 : 0 });

  // Step 2: Block Input (First)
  const showBlock = isVisible(TRAINING_STEPS.BLOCK_INPUT_FIRST);
  setIfAny(svgElement, SEL.transformerBox, {
    opacity: showBlock ? 1 : 0,
    scaleY: showBlock ? 1 : 0.95,
    transformOrigin: '50% 0%',
  });

  // Inside Top Embeddings: Visible during first pass (2..5) OR during second pass (6..)
  // But specifically, at step 6 (start), we want it hidden (so it can animate in).
  const prevStep = subStep - 1;
  const showTopEmbeddings =
    (prevStep >= TRAINING_STEPS.BLOCK_INPUT_FIRST && prevStep < TRAINING_STEPS.STACK_REVEAL) ||
    prevStep >= TRAINING_STEPS.BLOCK_INPUT_LAST;
  setIfAny(svgElement, SEL.insideTopEmbeddingsAll, {
    opacity: showTopEmbeddings ? 1 : 0,
    y: showTopEmbeddings ? 0 : -8,
  });

  setIfAny(svgElement, SEL.outerToBlockArrow, { opacity: showBlock ? 1 : 0 });

  // Shadow/Positional arrows: Visible from Step 2 end (subStep 3) until Step 16 start (subStep 16).
  // At Step 16 start (BACKPROP_FFN_FIRST), they are visible, then fade out during Step 16.
  const showShadowArrows = isVisible(
    TRAINING_STEPS.BLOCK_INPUT_FIRST,
    TRAINING_STEPS.BACKPROP_FFN_FIRST
  );
  setIfAny(svgElement, SEL.shadowToBlockArrow, { opacity: showShadowArrows ? 1 : 0 });
  setIfAny(svgElement, '.positional-through-arrow', { opacity: showShadowArrows ? 1 : 0 });

  setIfAny(svgElement, `${SEL.positionalEmb} circle`, { opacity: showBlock ? 0.9 : 0 });
  setIfAny(svgElement, `${SEL.positionalEmb} text`, { opacity: showBlock ? 1 : 0 });

  // Step 3: Attention (First)
  const showAttn =
    (prevStep >= TRAINING_STEPS.ATTENTION_FIRST && prevStep < TRAINING_STEPS.STACK_REVEAL) ||
    prevStep >= TRAINING_STEPS.ATTENTION_LAST;
  const showBottomEmbeddings = showAttn;
  setIfAny(svgElement, SEL.insideBottomEmbeddingsAll, {
    opacity: showBottomEmbeddings ? 1 : 0,
    y: showBottomEmbeddings ? 0 : 8,
  });
  setIfAny(svgElement, SEL.attentionMashAll, { opacity: showAttn ? 1 : 0 });

  // Step 4: FFN (First)
  const showFfn =
    (prevStep >= TRAINING_STEPS.FFN_FIRST && prevStep < TRAINING_STEPS.STACK_REVEAL) ||
    prevStep >= TRAINING_STEPS.FFN_LAST;
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
  // Hidden in Step 13. So visible until subStep 13 (inclusive).
  const showStack = isVisible(TRAINING_STEPS.STACK_REVEAL, TRAINING_STEPS.BACKPROP_FFN_FIRST);
  setIfAny(svgElement, SEL.transformerShadowBox, { opacity: showStack ? 1 : 0 });
  setIfAny(svgElement, SEL.transformerStackLabel, { opacity: showStack ? 1 : 0 });

  // Step 9: Extraction
  const showExtracted = isVisible(TRAINING_STEPS.EXTRACTION);
  setIfAny(svgElement, SEL.extractedEmbedding, { opacity: showExtracted ? 1 : 0 });
  setIfAny(svgElement, SEL.extractedPathArrow, { opacity: showExtracted ? 1 : 0 });
  setIfAny(svgElement, SEL.extractedHorizontal, { opacity: showExtracted ? 1 : 0 });

  // Step 10: Logprob
  const showLogprob = isVisible(TRAINING_STEPS.LOGPROB);
  setIfAny(svgElement, SEL.logprobArrow, { opacity: showLogprob ? 1 : 0 });
  setIfAny(svgElement, SEL.logprobVector, { opacity: showLogprob ? 1 : 0 });

  // Step 11: Distribution
  const showDist = isVisible(TRAINING_STEPS.DISTRIBUTION);
  setIfAny(svgElement, SEL.distributionBar, {
    opacity: showDist ? 1 : 0,
    scaleY: showDist ? 1 : 0.1,
    transformOrigin: '50% 100%',
  });
  setIfAny(svgElement, SEL.distributionLabels, { opacity: showDist ? 1 : 0 });
  setIfAny(svgElement, SEL.distributionItem, { opacity: showDist ? 1 : 0 });

  // Step 12: Target
  const showTarget = isVisible(TRAINING_STEPS.TARGET);
  setIfAny(svgElement, SEL.targetVector, { opacity: showTarget ? 1 : 0 });
  setIfAny(svgElement, SEL.targetToProbArrow, { opacity: showTarget ? 0.7 : 0 });
  setIfAny(svgElement, SEL.trainingTargetHighlightRect, { opacity: showTarget ? 1 : 0 });
  setIfAny(svgElement, SEL.targetDiffLabel, { opacity: showTarget ? 1 : 0 });
  setIfAny(svgElement, SEL.targetDiffArrow, { opacity: showTarget ? 0.7 : 0 });

  // --- 2. Classes & Backprop States (Step 10+) ---

  // Step 13: Backprop Start
  const isBackprop = isVisible(TRAINING_STEPS.BACKPROP_START);

  // Greyed out elements
  const greySelectors = [
    SEL.insideTopEmbeddingsAll,
    SEL.insideBottomEmbeddingsAll,
    SEL.insideFfnEmbeddingsAll,
    SEL.bottomEmbeddingGroupAll,
    SEL.extractedEmbedding,
    SEL.extractedHorizontal,
    SEL.embeddingGroupAll,
    SEL.logprobVector,
  ];
  greySelectors.forEach((sel) => {
    setIfAny(svgElement, sel, {
      className: isBackprop ? '+=hidden-state-grey' : '-=hidden-state-grey',
    });
  });

  // Labels
  if (labelsSvgElement) {
    setIfAny(labelsSvgElement, '.stage-label:not(.stage-label-backprop)', {
      opacity: isBackprop ? 0 : 1,
    });
    setIfAny(labelsSvgElement, '.stage-label-backprop', {
      opacity: isBackprop ? 1 : 0,
      className: isBackprop ? '+=active' : '-=active',
    });
  }

  // Backprop Connections (Purple/Green/Red)

  // Purple (Step 13+)
  const showPurple = isVisible(TRAINING_STEPS.BACKPROP_START);
  setIfAny(svgElement, '.extracted-path-arrow', {
    className: showPurple ? '+=bp-connection-purple' : '-=bp-connection-purple',
  });
  setIfAny(svgElement, `${SEL.insideBottomEmbeddingColNew} rect`, {
    className: showPurple ? '+=bp-connection-purple' : '-=bp-connection-purple',
  });

  // Green/Red flow
  const setConnectionColors = (selector, isActive) => {
    setIfAny(svgElement, `${selector}.green`, {
      className: isActive ? '+=bp-connection-green' : '-=bp-connection-green',
      opacity: isActive ? 1 : undefined,
    });
    setIfAny(svgElement, `${selector}.red`, {
      className: isActive ? '+=bp-connection-red' : '-=bp-connection-red',
      opacity: isActive ? 1 : undefined,
    });
  };

  setConnectionColors(
    '.bp-last-block-ffn-connection',
    subStep === TRAINING_STEPS.BACKPROP_FFN_LAST
  );
  setConnectionColors(
    '.bp-last-block-attention-connection',
    subStep === TRAINING_STEPS.BACKPROP_ATTN_LAST
  );
  setConnectionColors(
    '.bp-first-block-ffn-connection',
    subStep === TRAINING_STEPS.BACKPROP_FFN_FIRST
  );
  setConnectionColors(
    '.bp-first-block-attention-connection',
    subStep === TRAINING_STEPS.BACKPROP_ATTN_FIRST
  );

  // Outer embedding connection is special: it stays visible after step 15
  const showOuter = isVisible(TRAINING_STEPS.BACKPROP_EMBEDDING);
  setIfAny(svgElement, '.bp-outer-embedding-connection.green', {
    className: showOuter ? '+=bp-connection-green' : '-=bp-connection-green',
  });
  setIfAny(svgElement, '.bp-outer-embedding-connection.red', {
    className: showOuter ? '+=bp-connection-red' : '-=bp-connection-red',
  });
}

/**
 * Build a GSAP timeline that plays through sub-steps 0..18 for training.
 */
export function buildTimeline(
  svgElement,
  subStep,
  isInitialStep,
  animDuration,
  onStepComplete,
  labelsSvgElement = null
) {
  const tl = gsap.timeline({ onComplete: onStepComplete });
  const add = (sel, vars, pos) => toIfAny(tl, svgElement, sel, vars, pos);

  switch (subStep) {
    case TRAINING_STEPS.TOKEN:
      add(SEL.token, { opacity: 1, duration: animDuration });
      add(SEL.tokenId, { opacity: 1, duration: animDuration }, '<');
      add(SEL.tokenIdArrow, { opacity: 1, duration: animDuration }, '<');
      break;
    case TRAINING_STEPS.EMBEDDING:
      add(SEL.embeddingGroupAll, { opacity: 1, y: 0, duration: animDuration });
      add(SEL.idToEmbArrow, { opacity: 1, duration: animDuration }, '<');
      break;
    case TRAINING_STEPS.BLOCK_INPUT_FIRST:
      add(SEL.transformerBox, { opacity: 1, scaleY: 1, duration: animDuration });
      add(SEL.insideTopEmbeddingsAll, { opacity: 1, y: 0, duration: animDuration }, '<');
      add(SEL.outerToBlockArrow, { opacity: 1, duration: animDuration }, '<');
      add(SEL.shadowToBlockArrow, { opacity: 1, duration: animDuration }, '<');
      add(`${SEL.positionalEmb} circle`, { opacity: 0.9, duration: animDuration }, '<');
      add(`${SEL.positionalEmb} text`, { opacity: 1, duration: animDuration }, '<');
      break;
    case TRAINING_STEPS.ATTENTION_FIRST:
      add(SEL.insideBottomEmbeddingsAll, { opacity: 1, y: 0, duration: animDuration });
      add(SEL.attentionMashAll, { opacity: 1, duration: animDuration }, '<');
      break;
    case TRAINING_STEPS.FFN_FIRST:
      add(SEL.insideFfnEmbeddingsAll, { opacity: 1, y: 0, duration: animDuration });
      add(SEL.ffnArrow, { opacity: 1, duration: animDuration }, '<');
      add(SEL.ffnArrowIn, { opacity: 1, duration: animDuration }, '<');
      add(SEL.ffnArrowOut, { opacity: 1, duration: animDuration }, '<');
      add(SEL.ffnProjectionBox, { opacity: 1, duration: animDuration }, '<');
      break;
    case TRAINING_STEPS.STACK_REVEAL:
      add(SEL.transformerShadowBox, { opacity: 1, stagger: 0.03, duration: animDuration * 0.4 });
      add(SEL.transformerStackLabel, { opacity: 1, duration: animDuration * 0.5 }, '<');
      break;
    case TRAINING_STEPS.BLOCK_INPUT_LAST:
      // Second pass input
      add(SEL.insideTopEmbeddingsAll, { opacity: 1, y: 0, duration: animDuration });
      break;
    case TRAINING_STEPS.ATTENTION_LAST:
      add(SEL.insideBottomEmbeddingsAll, { opacity: 1, y: 0, duration: animDuration });
      add(SEL.attentionMashAll, { opacity: 1, duration: animDuration }, '<');
      break;
    case TRAINING_STEPS.FFN_LAST:
      add(SEL.insideFfnEmbeddingsAll, { opacity: 1, y: 0, duration: animDuration });
      add(SEL.ffnArrow, { opacity: 1, duration: animDuration }, '<');
      add(SEL.ffnArrowIn, { opacity: 1, duration: animDuration }, '<');
      add(SEL.ffnArrowOut, { opacity: 1, duration: animDuration }, '<');
      add(SEL.ffnProjectionBox, { opacity: 1, duration: animDuration }, '<');
      break;
    case TRAINING_STEPS.EXTRACTION:
      add(SEL.extractedEmbedding, { opacity: 1, duration: animDuration * 0.5 });
      add(SEL.extractedPathArrow, { opacity: 1, duration: animDuration }, '<');
      add(SEL.extractedHorizontal, { opacity: 1, duration: animDuration }, '<');
      break;
    case TRAINING_STEPS.LOGPROB:
      add(SEL.logprobArrow, { opacity: 1, duration: animDuration });
      add(SEL.logprobVector, { opacity: 1, duration: animDuration }, '<');
      break;
    case TRAINING_STEPS.DISTRIBUTION:
      add(SEL.distributionItem, { opacity: 1, duration: animDuration });
      add(SEL.distributionBar, { opacity: 1, scaleY: 1, duration: animDuration }, '<');
      add(SEL.distributionLabels, { opacity: 1, duration: animDuration }, '<');
      break;
    case TRAINING_STEPS.TARGET:
      add(SEL.targetVector, { opacity: 1, duration: animDuration });
      add(SEL.targetToProbArrow, { opacity: 0.7, duration: animDuration }, '<');
      add(SEL.targetDiffLabel, { opacity: 1, duration: animDuration }, '<');
      add(SEL.targetDiffArrow, { opacity: 0.7, duration: animDuration }, '<');
      add(
        SEL.trainingTargetHighlightRect,
        { opacity: 1, duration: animDuration * 0.45, ease: 'power1.out' },
        '<'
      );
      break;
    case TRAINING_STEPS.BACKPROP_START: {
      const greySelectors = [
        SEL.insideTopEmbeddingsAll,
        SEL.insideBottomEmbeddingsAll,
        SEL.insideFfnEmbeddingsAll,
        SEL.bottomEmbeddingGroupAll,
        SEL.extractedEmbedding,
        SEL.extractedHorizontal,
        SEL.embeddingGroupAll,
        SEL.logprobVector,
      ];
      greySelectors.forEach((sel, i) =>
        add(sel, { className: '+=hidden-state-grey' }, i === 0 ? undefined : '<')
      );

      if (labelsSvgElement) {
        toIfAny(tl, labelsSvgElement, '.stage-label:not(.stage-label-backprop)', {
          opacity: 0,
          duration: animDuration * 0.3,
        });
        toIfAny(
          tl,
          labelsSvgElement,
          '.stage-label-backprop',
          { opacity: 1, className: '+=active', duration: animDuration * 0.5 },
          '<'
        );
      }
      add(SEL.trainingTargetHighlightRect, { opacity: 1, duration: 0.001 });
      add(
        `.extracted-path-arrow, ${SEL.insideBottomEmbeddingColNew} rect`,
        { className: '+=bp-connection-purple', duration: animDuration * 0.6 },
        '<'
      );
      break;
    }
    case TRAINING_STEPS.BACKPROP_FFN_LAST:
      add('.bp-last-block-ffn-connection.green', {
        className: '+=bp-connection-green',
        duration: animDuration * 0.6,
      });
      add(
        '.bp-last-block-ffn-connection.red',
        { className: '+=bp-connection-red', duration: animDuration * 0.6 },
        '<'
      );
      break;
    case TRAINING_STEPS.BACKPROP_ATTN_LAST:
      add('.bp-last-block-ffn-connection', { className: '-=bp-connection-green' });
      add('.bp-last-block-ffn-connection', { className: '-=bp-connection-red' }, '<');
      add(
        '.bp-last-block-attention-connection.green',
        { className: '+=bp-connection-green', duration: animDuration * 0.6 },
        '<'
      );
      add(
        '.bp-last-block-attention-connection.red',
        { className: '+=bp-connection-red', duration: animDuration * 0.6 },
        '<'
      );
      break;
    case TRAINING_STEPS.BACKPROP_FFN_FIRST:
      add('.bp-last-block-attention-connection', { className: '-=bp-connection-green' });
      add('.bp-last-block-attention-connection', { className: '-=bp-connection-red' }, '<');
      add('.transformer-shadow-box', { opacity: 0, duration: animDuration * 0.3 }, '<');
      add('.transformer-stack-label', { opacity: 0, duration: animDuration * 0.3 }, '<');
      add(SEL.shadowToBlockArrow, { opacity: 0, duration: animDuration * 0.3 }, '<');
      add('.viz-transformer-box', { opacity: 1, duration: animDuration * 0.3 }, '<');
      add(
        '.bp-first-block-ffn-connection.green',
        { className: '+=bp-connection-green', duration: animDuration * 0.6 },
        '<'
      );
      add(
        '.bp-first-block-ffn-connection.red',
        { className: '+=bp-connection-red', duration: animDuration * 0.6 },
        '<'
      );
      break;
    case TRAINING_STEPS.BACKPROP_ATTN_FIRST:
      add('.bp-first-block-ffn-connection', { className: '-=bp-connection-green' });
      add('.bp-first-block-ffn-connection', { className: '-=bp-connection-red' }, '<');
      add(
        '.bp-first-block-attention-connection.green',
        { className: '+=bp-connection-green', duration: animDuration * 0.6 },
        '<'
      );
      add(
        '.bp-first-block-attention-connection.red',
        { className: '+=bp-connection-red', duration: animDuration * 0.6 },
        '<'
      );
      break;
    case TRAINING_STEPS.BACKPROP_EMBEDDING:
      add('.bp-first-block-attention-connection', { className: '-=bp-connection-green' });
      add('.bp-first-block-attention-connection', { className: '-=bp-connection-red' }, '<');
      add(
        '.bp-outer-embedding-connection.green',
        { className: '+=bp-connection-green', opacity: 1, duration: animDuration * 0.6 },
        '<'
      );
      add(
        '.bp-outer-embedding-connection.red',
        { className: '+=bp-connection-red', opacity: 1, duration: animDuration * 0.6 },
        '<'
      );
      break;
  }

  return tl;
}
