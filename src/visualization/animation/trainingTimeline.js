import { gsap } from 'gsap';
import { ALL_SELECTORS as SEL } from '../core/selectors';

// Utilities
const qsa = (root, selector) => (root ? Array.from(root.querySelectorAll(selector)) : []);
const setIfAny = (root, selector, vars) => {
  const nodes = qsa(root, selector);
  if (!nodes.length) return;

  // Safely handle class changes for SVG elements (className is read-only on SVG)
  if (vars && typeof vars === 'object' && Object.prototype.hasOwnProperty.call(vars, 'className')) {
    const cn = vars.className;
    nodes.forEach((node) => {
      if (typeof cn === 'string') {
        if (cn.startsWith('+= ')) {
          const toAdd = cn.slice(3).trim();
          if (toAdd) node.classList.add(toAdd);
        } else if (cn.startsWith('+-=')) {
          // no-op guard in case of malformed prefix
        } else if (cn.startsWith('+=')) {
          const toAdd = cn.slice(2).trim();
          if (toAdd) node.classList.add(toAdd);
        } else if (cn.startsWith('-=')) {
          const toRemove = cn.slice(2).trim();
          if (toRemove) node.classList.remove(toRemove);
        } else {
          // Replace the whole class attribute
          node.setAttribute('class', cn);
        }
      }
    });
    // Remove className from vars before passing other props to gsap
    const { className: _className, ...rest } = vars;
    if (Object.keys(rest).length) {
      gsap.set(nodes, rest);
    }
    return;
  }

  gsap.set(nodes, vars);
};

/**
 * Initialize all elements as hidden prior to running the training step animation.
 * Keeps the API symmetric with the text generation timeline.
 */
export function setInitialStates(svgElement, subStep, isInitialStep, labelsSvgElement = null) {
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
  // Hide stack again in backprop step 13+ (unrolling to first block)
  const showStack = prev >= 5 && prev < 13;
  setIfAny(svgElement, SEL.transformerShadowBox, { opacity: showStack ? 1 : 0 });
  setIfAny(svgElement, SEL.transformerStackLabel, { opacity: showStack ? 1 : 0 });

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

  // Training-specific step 9: target vector and single arrow to target token
  setIfAny(svgElement, SEL.targetVector, { opacity: prev >= 9 ? 1 : 0 });
  setIfAny(svgElement, SEL.targetToProbArrow, { opacity: prev >= 9 ? 0.7 : 0 });
  // Highlight rectangle around target column spanning from output vector to target vector
  setIfAny(svgElement, SEL.trainingTargetHighlightRect, { opacity: prev >= 9 ? 1 : 0 });

  // Training-specific step 9+: difference labels and arrows to all tokens
  setIfAny(svgElement, SEL.targetDiffLabel, { opacity: prev >= 9 ? 1 : 0 });
  setIfAny(svgElement, SEL.targetDiffArrow, { opacity: prev >= 9 ? 0.7 : 0 });

  // Backpropagation mode (steps 11-16+)
  // Use prev >= 10 so that at substep 11 we already initialize backprop state
  const isBackprop = prev >= 10;

  if (isBackprop) {
    // Grey out hidden states (internal embeddings and projections)
    setIfAny(svgElement, SEL.insideTopEmbeddingsAll, { className: '+=hidden-state-grey' });
    setIfAny(svgElement, SEL.insideBottomEmbeddingsAll, { className: '+=hidden-state-grey' });
    setIfAny(svgElement, SEL.insideFfnEmbeddingsAll, { className: '+=hidden-state-grey' });
    setIfAny(svgElement, SEL.bottomEmbeddingGroupAll, { className: '+=hidden-state-grey' });
    setIfAny(svgElement, SEL.extractedEmbedding, { className: '+=hidden-state-grey' });
    setIfAny(svgElement, SEL.extractedHorizontal, { className: '+=hidden-state-grey' });
    setIfAny(svgElement, SEL.embeddingGroupAll, { className: '+=hidden-state-grey' });
    setIfAny(svgElement, SEL.logprobVector, { className: '+=hidden-state-grey' });
    // Keep output distribution and target vector vivid for backprop context

    // Hide existing stage labels but keep Backprop label visible during backprop
    if (labelsSvgElement) {
      setIfAny(labelsSvgElement, '.stage-label:not(.stage-label-backprop)', { opacity: 0 });
      // Ensure the Backprop label stays visible across substeps after re-render
      setIfAny(labelsSvgElement, '.stage-label-backprop', { opacity: 1, className: '+=active' });
    }
  }

  setIfAny(svgElement, SEL.distributionHighlightRect, { opacity: 0 });
  setIfAny(svgElement, SEL.appendPathArrow, { opacity: 0 });
  setIfAny(svgElement, SEL.previewTokenText, { opacity: 0 });
  setIfAny(svgElement, SEL.previewTokenUnderline, { opacity: 0 });
}

/**
 * Build a GSAP timeline that plays through sub-steps 0..10 for training.
 * Steps 0-8: same as text generation (but no highlight/append)
 * Step 9: show target vector and arrow to target token probability
 * Step 10: replace percentages with differences and show arrows from all target cells
 */
export function buildTimeline(
  svgElement,
  subStep,
  isInitialStep,
  animDuration,
  onStepComplete,
  labelsSvgElement = null
) {
  const tl = gsap.timeline({
    onComplete: onStepComplete,
  });
  // Reference to avoid lint unused-param error (reserved for future first-pass tweaks)
  void isInitialStep;
  const toIfAny = (selector, vars, pos, root = svgElement) => {
    const nodes = qsa(root, selector);
    if (!nodes.length) return;
    if (
      vars &&
      typeof vars === 'object' &&
      Object.prototype.hasOwnProperty.call(vars, 'className')
    ) {
      const cn = vars.className;
      // Schedule class change at the specified position
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
    case 9:
      // Training-specific: show target vector, single up arrow, and differences + all up arrows
      toIfAny(SEL.targetVector, { opacity: 1, duration: animDuration });
      toIfAny(SEL.targetToProbArrow, { opacity: 0.7, duration: animDuration }, '<');
      toIfAny(SEL.targetDiffLabel, { opacity: 1, duration: animDuration }, '<');
      toIfAny(SEL.targetDiffArrow, { opacity: 0.7, duration: animDuration }, '<');
      // Fade in the target highlight rectangle in the same step
      toIfAny(
        SEL.trainingTargetHighlightRect,
        { opacity: 1, duration: animDuration * 0.45, ease: 'power1.out' },
        '<'
      );
      break;
    case 10:
      // Immediately enter backprop mode after showing target diffs
      // 1) Grey out hidden states
      toIfAny(SEL.insideTopEmbeddingsAll, { className: '+=hidden-state-grey' });
      toIfAny(SEL.insideBottomEmbeddingsAll, { className: '+=hidden-state-grey' }, '<');
      toIfAny(SEL.insideFfnEmbeddingsAll, { className: '+=hidden-state-grey' }, '<');
      toIfAny(SEL.bottomEmbeddingGroupAll, { className: '+=hidden-state-grey' }, '<');
      toIfAny(SEL.extractedEmbedding, { className: '+=hidden-state-grey' }, '<');
      toIfAny(SEL.extractedHorizontal, { className: '+=hidden-state-grey' }, '<');
      toIfAny(SEL.embeddingGroupAll, { className: '+=hidden-state-grey' }, '<');
      toIfAny(SEL.logprobVector, { className: '+=hidden-state-grey' }, '<');

      // 2) Replace stage labels with Backpropagation label
      if (labelsSvgElement) {
        // Hide all existing stage labels
        toIfAny(
          '.stage-label:not(.stage-label-backprop)',
          { opacity: 0, duration: animDuration * 0.3 },
          undefined,
          labelsSvgElement
        );
        // Show Backprop label and make it active
        toIfAny(
          '.stage-label-backprop',
          { opacity: 1, className: '+=active', duration: animDuration * 0.5 },
          '<',
          labelsSvgElement
        );
      }

      // 3) Keep the target highlight rectangle visible during backprop
      toIfAny(SEL.trainingTargetHighlightRect, { opacity: 1, duration: 0.001 });

      // 4) Highlight connections from/to last embedding vector in bold purple (merged from old step 12)
      // Use specific selectors because the generic class might be missing if not in backprop mode
      toIfAny(
        `.extracted-path-arrow, ${SEL.insideBottomEmbeddingColNew} rect`,
        {
          className: '+=bp-connection-purple',
          duration: animDuration * 0.6,
        },
        '<'
      );
      break;
    case 11:
      // Make FFN connections in last block bold green/red
      toIfAny('.bp-last-block-ffn-connection.green', {
        className: '+=bp-connection-green',
        duration: animDuration * 0.6,
      });
      // Run red in parallel so all connections pop at once
      toIfAny(
        '.bp-last-block-ffn-connection.red',
        {
          className: '+=bp-connection-red',
          duration: animDuration * 0.6,
        },
        '<'
      );
      break;
    case 12:
      // Make attention connections in last block bold green/red
      toIfAny('.bp-last-block-attention-connection.green', {
        className: '+=bp-connection-green',
        duration: animDuration * 0.6,
      });
      // Run red in parallel so all connections pop at once
      toIfAny(
        '.bp-last-block-attention-connection.red',
        {
          className: '+=bp-connection-red',
          duration: animDuration * 0.6,
        },
        '<'
      );
      break;
    case 13:
      // Unroll stack to first block only (keep first fully visible, hide the rest)
      toIfAny('.transformer-shadow-box', { opacity: 0, duration: animDuration * 0.3 });
      toIfAny('.transformer-stack-label', { opacity: 0, duration: animDuration * 0.3 }, '<');
      toIfAny('.transformer-box', { opacity: 1, duration: animDuration * 0.3 }, '<');
      toIfAny('.bp-first-block-ffn-connection.green', {
        className: '+=bp-connection-green',
        duration: animDuration * 0.6,
      });
      // Run red in parallel so all connections pop at once
      toIfAny(
        '.bp-first-block-ffn-connection.red',
        {
          className: '+=bp-connection-red',
          duration: animDuration * 0.6,
        },
        '<'
      );
      break;
    case 14:
      // Highlight attention connections in the first block
      toIfAny('.bp-first-block-attention-connection.green', {
        className: '+=bp-connection-green',
        duration: animDuration * 0.6,
      });
      // Run red in parallel so all connections pop at once
      toIfAny(
        '.bp-first-block-attention-connection.red',
        {
          className: '+=bp-connection-red',
          duration: animDuration * 0.6,
        },
        '<'
      );
      break;
    case 15:
      // Connections between outer embeddings and top embeddings (first layer)
      toIfAny('.bp-outer-embedding-connection.green', {
        className: '+=bp-connection-green',
        duration: animDuration * 0.6,
      });
      // Run red in parallel so all connections pop at once
      toIfAny(
        '.bp-outer-embedding-connection.red',
        {
          className: '+=bp-connection-red',
          duration: animDuration * 0.6,
        },
        '<'
      );
      break;
    default:
      break;
  }

  // Do not auto-advance after substep 15; require explicit user navigation
  return tl;
}
