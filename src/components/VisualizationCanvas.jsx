/* eslint-disable no-unused-vars */
import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useApp } from '../contexts/AppContext';
import { useI18n } from '../i18n/I18nProvider';
import * as d3 from 'd3';
import { gsap } from 'gsap';
import { getTokenColor, getEmbeddingColor, getPurpleByProb } from '../visualization/core/colors';
import { setInitialStates, buildTimeline } from '../visualization/animation/textGenerationTimeline';
import {
  renderTokensLayer,
  renderOuterEmbeddingsLayer,
  renderTransformerBlockLayer,
  renderOutputLayer,
  renderStageLabels,
} from '../visualization/layers/renderLayers';
import { computeEmbeddingsForStep } from '../visualization/core/embeddings';
import '../styles/visualization.css';
import { processTokenForVisualization } from '../utils/tokenProcessing';
import { LAYOUT as CONSTS, TOKEN, TEXT_GEN_STEPS } from '../visualization/core/constants';
import Icon from '@mdi/react';
import {
  mdiArrowExpandHorizontal,
  mdiArrowCollapseHorizontal,
  mdiChevronLeft,
  mdiChevronRight,
} from '@mdi/js';

/**
 * VisualizationCanvas Component
 * Main SVG container for all D3 visualizations
 */
export default function VisualizationCanvas() {
  const { state, actions } = useApp();
  const { t } = useI18n();
  // Extract stable callbacks to avoid re-running effects when the provider re-renders
  const { onStepAnimationComplete } = actions;
  const svgRef = useRef(null);
  const labelsSvgRef = useRef(null);
  const scrollRef = useRef(null);
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(800);
  const [isExpanded, setIsExpanded] = useState(false);
  const [embeddingExpanded, setEmbeddingExpanded] = useState({});
  const [labelsVisible, setLabelsVisible] = useState(true);
  const tokensLayoutRef = useRef({
    positions: [],
    widths: [],
    visibleIndices: [],
    gap: 24,
    shouldCollapse: false,
  });
  const gsapRef = useRef(null);

  // Initialize SVG and get dimensions
  useEffect(() => {
    if (!svgRef.current || !scrollRef.current) return;

    const scrollContainer = scrollRef.current;
    const svg = d3.select(svgRef.current);
    const labelsSvg = d3.select(labelsSvgRef.current);

    // Update SVG dimensions based on scroll container (the actual viewport)
    const updateDimensions = () => {
      const rect = scrollContainer.getBoundingClientRect();
      // Round to avoid subpixel differences
      setContainerWidth(Math.round(rect.width) || 800);
      svg.attr('width', Math.round(rect.width));
      // Height is now set dynamically in the render effect based on actual content
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Clear and reset visualization when prompt (example) or language changes
  useEffect(() => {
    if (!svgRef.current) return;
    // Kill any running animations
    if (gsapRef.current && typeof gsapRef.current.kill === 'function') {
      try {
        gsapRef.current.kill();
      } catch (e) {
        console.debug('GSAP kill failed (safe to ignore):', e);
      }
      gsapRef.current = null;
    }
    // Clear SVGs
    try {
      d3.select(svgRef.current).selectAll('*').remove();
      if (labelsSvgRef.current) d3.select(labelsSvgRef.current).selectAll('*').remove();
    } catch (e) {
      console.debug('Clearing SVG failed (safe to ignore):', e);
    }
    // Reset local UI state (deferred to avoid setState-in-effect lint and cascading renders)
    const deferReset = () => {
      setIsExpanded(false);
      setEmbeddingExpanded({});
      tokensLayoutRef.current = {
        positions: [],
        widths: [],
        visibleIndices: [],
        gap: 24,
        shouldCollapse: false,
      };
      // Reset scroll position of the scroll container
      if (scrollRef.current) {
        try {
          scrollRef.current.scrollLeft = 0;
        } catch (e) {
          console.debug('Reset scroll failed (safe to ignore):', e);
        }
      }
    };
    // Use microtask to defer state updates out of the effect body
    if (typeof queueMicrotask === 'function') {
      queueMicrotask(deferReset);
    } else {
      setTimeout(deferReset, 0);
    }
  }, [state.currentExampleId, state.language]);

  // Also clear visualization when resetting to the beginning (currentStep === 0)
  // so that pressing 'r' (reset) wipes the canvas even if the example doesn't change.
  useEffect(() => {
    if (!svgRef.current) return;
    if (state.currentStep !== 0) return;

    // Kill any running animations
    if (gsapRef.current && typeof gsapRef.current.kill === 'function') {
      try {
        gsapRef.current.kill();
      } catch (e) {
        console.debug('GSAP kill failed (safe to ignore):', e);
      }
      gsapRef.current = null;
    }

    // Clear SVGs
    try {
      d3.select(svgRef.current).selectAll('*').remove();
      if (labelsSvgRef.current) d3.select(labelsSvgRef.current).selectAll('*').remove();
    } catch (e) {
      console.debug('Clearing SVG failed (safe to ignore):', e);
    }

    // Reset local UI state (deferred to avoid setState-in-effect lint and cascading renders)
    const deferReset = () => {
      setEmbeddingExpanded({});
      tokensLayoutRef.current = {
        positions: [],
        widths: [],
        visibleIndices: [],
        gap: 24,
        shouldCollapse: false,
      };
      // Reset scroll position of the scroll container
      if (scrollRef.current) {
        try {
          scrollRef.current.scrollLeft = 0;
        } catch (e) {
          console.debug('Reset scroll failed (safe to ignore):', e);
        }
      }
    };
    if (typeof queueMicrotask === 'function') queueMicrotask(deferReset);
    else setTimeout(deferReset, 0);
  }, [state.currentStep]);

  // Removed scroll tracking for the collapse toggle; the button is fixed to the viewport.

  // Keyboard shortcut: 'e' toggles collapse/expand of the middle tokens section
  // Matches interruptive behavior: pause animation if playing, then toggle
  useEffect(() => {
    const onKeyDown = (e) => {
      if (!e || e.target.matches('input, textarea')) return;
      if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        if (state.isPlaying) {
          actions.setIsPlaying(false);
        }
        setIsExpanded((v) => !v);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [state.isPlaying, actions]);

  // Render visualization based on current step
  useEffect(() => {
    if (!svgRef.current || !state.currentExample || state.currentStep === 0) return;

    const svg = d3.select(svgRef.current);
    const labelsSvg = d3.select(labelsSvgRef.current);
    const step = state.currentExample.generation_steps[state.currentStep - 1];
    const computedEmbeddings = computeEmbeddingsForStep(step, 3);
    const subStep = state.currentAnimationSubStep;
    const currentLayer = state.currentTransformerLayer;
    const numLayers = state.currentExample.model_info?.num_layers || 1;

    // Clear previous visualization
    svg.selectAll('*').remove();
    labelsSvg.selectAll('*').remove();

    // Create main groups for different visualization sections
    const g = svg.append('g').attr('class', 'visualization-main');

    const tokenGroup = g.append('g').attr('class', 'token-group');
    const embeddingGroup = g.append('g').attr('class', 'embedding-group'); // outside (top)
    const transformerGroup = g.append('g').attr('class', 'transformer-group'); // inside block
    const bottomEmbeddingGroup = g.append('g').attr('class', 'bottom-embedding-group'); // outside (bottom)
    const outputGroup = g.append('g').attr('class', 'output-group');
    const labelsGroup = labelsSvg.append('g').attr('class', 'stage-labels-group');

    // Get SVG dimensions - use full container width for layout (labels are now in a side panel)
    const width = containerWidth || CONSTS.DEFAULT_CONTAINER_WIDTH;
    const visualizationWidth = width; // Full width available for visualization

    // Determine if we need to collapse tokens
    const maxVisibleTokens = Math.floor(visualizationWidth / CONSTS.TOKEN_SPACING_ESTIMATE) - 1;
    const shouldCollapse = step.tokens.length > maxVisibleTokens && !isExpanded;

    // Layout configuration with proper spacing
    const layout = {
      tokenY: CONSTS.TOKEN_Y,
      embeddingY: CONSTS.EMBEDDING_Y,
      margin: CONSTS.MARGIN,
      leftBias: CONSTS.LEFT_BIAS,
      tokenSpacing: CONSTS.TOKEN_SPACING,
      blockPadding: CONSTS.BLOCK_PADDING,
    };

    // 1. Render tokens
    renderTokensLayer(
      tokenGroup,
      step,
      layout,
      visualizationWidth,
      shouldCollapse,
      maxVisibleTokens,
      tokensLayoutRef
    );

    // 2. Render embeddings
    const isDarkMode = state.theme === 'dark';
    const outerMeta = renderOuterEmbeddingsLayer(
      embeddingGroup,
      step,
      layout,
      tokensLayoutRef,
      embeddingExpanded,
      setEmbeddingExpanded,
      computedEmbeddings,
      isDarkMode
    );

    // 3. New transformer block pipeline with layer stacking
    const blockMeta = renderTransformerBlockLayer(
      transformerGroup,
      step,
      layout,
      tokensLayoutRef,
      outerMeta,
      currentLayer,
      computedEmbeddings,
      numLayers,
      isDarkMode
    );

    // 4. Project directly from FFN inside the transformer block (no outside bottom embeddings)
    const { visibleIndices: vi = [] } = tokensLayoutRef.current || {};
    const ffnMetas = blockMeta.insideBottomMeta || [];
    let rightmostIdx = -1;
    for (let i = vi.length - 1; i >= 0; i--) {
      if (vi[i] >= 0) {
        rightmostIdx = i;
        break;
      }
    }
    const ffnInfo = {
      afterBottomY: blockMeta.blockBottomY,
      topY: blockMeta.ffnY,
      metas: ffnMetas,
      rightmostIdx,
      rightmostActualIndex:
        rightmostIdx >= 0 ? (tokensLayoutRef.current?.visibleIndices?.[rightmostIdx] ?? -1) : -1,
      rightmostMeta: rightmostIdx >= 0 ? ffnMetas[rightmostIdx] : null,
      flowOffsetX: blockMeta.flowOffsetX || 0,
      flowOffsetY: blockMeta.flowOffsetY || 0,
    };

    // 5. Output distribution below — use centralized offset
    layout.outputY = ffnInfo.afterBottomY + CONSTS.OUTPUT_Y_OFFSET;
    // Compute center of current content (token stack) to align bottom outputs
    const {
      positions: posArr = [],
      widths: wArr = [],
      visibleIndices: visIdx = [],
    } = tokensLayoutRef.current || {};
    let minEdge = Number.POSITIVE_INFINITY;
    let maxEdge = Number.NEGATIVE_INFINITY;
    posArr.forEach((cx, i) => {
      if ((visIdx[i] ?? -1) >= 0) {
        const w = wArr[i] || 0;
        minEdge = Math.min(minEdge, cx - w / 2);
        maxEdge = Math.max(maxEdge, cx + w / 2);
      }
    });
    const contentCenterX =
      minEdge !== Number.POSITIVE_INFINITY && maxEdge !== Number.NEGATIVE_INFINITY
        ? (minEdge + maxEdge) / 2
        : visualizationWidth / 2;

    const outputsMeta = renderOutputLayer(
      outputGroup,
      step,
      layout,
      visualizationWidth,
      svgRef.current,
      ffnInfo,
      subStep,
      computedEmbeddings,
      contentCenterX,
      isDarkMode
    );

    // 6. Collect Y positions for stage labels
    // We need to determine Y positions for each stage based on the actual layout
    // Build shared stage positions for precise alignment
    layout.stageY = {
      stage_tokenization: layout.tokenY + 6,
      // Input embeddings: centered on the outer embedding vectors
      stage_input_embeddings: layout.embeddingY + (outerMeta.maxOuterHeight || 0) / 2,
      // Positional embeddings: centered on the arrow between outer embeddings and the first
      // transformer layer (position is added AFTER token embeddings are computed)
      stage_positional_embeddings: (() => {
        const outerBottom = layout.embeddingY + (outerMeta.maxOuterHeight || 0);
        const insideTopCenter =
          (blockMeta.insideTopY ?? blockMeta.blockTopY + CONSTS.BLOCK_PADDING) +
          (blockMeta.maxInsideTopHeight || 0) / 2;
        return outerBottom + (insideTopCenter - outerBottom) * 0.5;
      })(),
      stage_attention_layer: blockMeta.attentionCenterY ?? blockMeta.blockTopY + 40,
      // Center with the FFN projection box (same as attention layer approach)
      stage_feedforward_layer:
        blockMeta.ffnProjectionCenterY ?? blockMeta.ffnY + (blockMeta.maxFfnHeight || 0) / 2,
      stage_last_embedding: outputsMeta?.extractedCenterY ?? ffnInfo.afterBottomY + 20 + 15,
      // Use a stable fallback that matches the on-screen vector center when visible.
      // When visible, logprob center = horizY + 108, where horizY = afterBottomY + 20.
      // So center ≈ afterBottomY + 128 regardless of whether hv1 exists.
      stage_output_probabilities: outputsMeta?.logprobCenterY ?? ffnInfo.afterBottomY + 128,
      // Align with the midpoint between token and percentage rows (ellipsis); fallback below probabilities
      stage_next_token:
        outputsMeta?.selectionCenterY ??
        (outputsMeta?.logprobCenterY != null
          ? outputsMeta.logprobCenterY + 70
          : ffnInfo.afterBottomY + 198),
    };

    // 7. Render stage labels on the right
    // Determine the right edge of the content to anchor labels consistently
    const { visibleIndices = [], positions = [], widths = [] } = tokensLayoutRef.current || {};
    let rightmostContentX = 0;
    if (ffnInfo?.rightmostMeta) {
      rightmostContentX = ffnInfo.rightmostMeta.centerX + ffnInfo.rightmostMeta.width / 2;
    } else if (positions.length) {
      // Fallback to rightmost token box edge
      let maxX = 0;
      positions.forEach((cx, i) => {
        if (visibleIndices[i] >= 0) {
          const w = widths[i] || 0;
          maxX = Math.max(maxX, cx + w / 2);
        }
      });
      rightmostContentX = maxX;
    }

    // Render stage labels into the sticky right panel; anchor within the panel (x=0)
    // Show labels gradually only on first pass (step 1); after that show all labels
    const showLabelsGradually = state.currentStep === 1;

    // Map linear steps to stage IDs
    const stepsConfig = {
      [TEXT_GEN_STEPS.TOKEN]: 'tokenization',
      [TEXT_GEN_STEPS.EMBEDDING]: 'input_embedding',
      [TEXT_GEN_STEPS.BLOCK_INPUT_FIRST]: 'positional_embedding',
      [TEXT_GEN_STEPS.ATTENTION_FIRST]: 'attention',
      [TEXT_GEN_STEPS.FFN_FIRST]: 'feed_forward',
      [TEXT_GEN_STEPS.BLOCK_INPUT_LAST]: 'positional_embedding',
      [TEXT_GEN_STEPS.ATTENTION_LAST]: 'attention',
      [TEXT_GEN_STEPS.FFN_LAST]: 'feed_forward',
      [TEXT_GEN_STEPS.EXTRACTION]: 'output_embedding',
      [TEXT_GEN_STEPS.LOGPROB]: 'output_probabilities',
      [TEXT_GEN_STEPS.DISTRIBUTION]: 'output',
      [TEXT_GEN_STEPS.SELECTION]: 'output',
      [TEXT_GEN_STEPS.APPEND]: 'output',
      [TEXT_GEN_STEPS.COMPLETE]: 'output',
    };

    // Map stage keys to IDs for the renderer
    const stageYPositions = {
      tokenization: layout.stageY.stage_tokenization,
      input_embedding: layout.stageY.stage_input_embeddings,
      positional_embedding: layout.stageY.stage_positional_embeddings,
      attention: layout.stageY.stage_attention_layer,
      feed_forward: layout.stageY.stage_feedforward_layer,
      output_embedding: layout.stageY.stage_last_embedding,
      output_probabilities: layout.stageY.stage_output_probabilities,
      output: layout.stageY.stage_next_token,
    };

    const animSubStep = Math.min(15, subStep ?? 0);

    renderStageLabels(
      labelsGroup,
      stageYPositions,
      animSubStep,
      stepsConfig,
      state.theme === 'dark',
      showLabelsGradually,
      t
    );
    // Size the labels SVG to a fixed width for the floating panel
    // Match CSS panel width (expanded)
    const labelsWidth = 280;
    labelsSvg.attr('width', labelsWidth);

    // Calculate dynamic SVG height from actual rendered content using bounding boxes.
    // Consider BOTH the main visualization and the stage labels so the scroll bottom
    // is always within CONSTS.BOTTOM_PADDING of the lowest element.
    const mainG = svg.select('.visualization-main').node();
    const labelsGNode = labelsGroup && labelsGroup.node ? labelsGroup.node() : null;
    const getBottom = (node) => {
      if (!node || !node.getBBox) return 0;
      const b = node.getBBox();
      return b.y + b.height;
    };
    const contentBottom = Math.max(getBottom(mainG), getBottom(labelsGNode));
    const dynamicHeight = Math.max(600, Math.ceil(contentBottom + CONSTS.BOTTOM_PADDING));
    svg.attr('height', dynamicHeight);
    labelsSvg.attr('height', dynamicHeight);

    // Compute expanded width snapshot for render without accessing refs during render
    if (isExpanded) {
      const { positions = [], widths = [], visibleIndices = [] } = tokensLayoutRef.current || {};
      let rightmostEdge = 0;
      positions.forEach((centerX, i) => {
        if (visibleIndices[i] >= 0) {
          const w = widths[i] || 0;
          rightmostEdge = Math.max(rightmostEdge, centerX + w / 2);
        }
      });
      const extraPadding = 500;
      const calculatedWidth = rightmostEdge + extraPadding;
      const svgWidth = Math.max(containerWidth, calculatedWidth);
      svg.style('width', `${svgWidth}px`);
    } else {
      svg.style('width', '100%');
    }

    // Duration for transitions; when rewinding (ArrowLeft), disable animation
    const animDuration = state.instantTransition ? 0 : 0.6;
    const isInitialStep = state.currentStep === 1;

    // Use modular animation utilities
    setInitialStates(svgRef.current, subStep, isInitialStep);
    const stepCompleteCb = state.instantTransition
      ? null
      : () => onStepAnimationComplete(state.isPlaying);
    gsapRef.current = buildTimeline(
      svgRef.current,
      subStep,
      isInitialStep,
      animDuration,
      stepCompleteCb
    );
  }, [
    state.currentStep,
    state.currentExample,
    state.currentAnimationSubStep,
    state.currentTransformerLayer,
    // Re-render visualization immediately when theme changes so D3 colors update
    state.theme,
    state.instantTransition,
    state.isPlaying,
    isExpanded,
    embeddingExpanded,
    onStepAnimationComplete,
    t,
    containerWidth,
  ]);

  return (
    <section className={`visualization-section ${isExpanded ? 'expanded' : ''}`} ref={containerRef}>
      {/* Subtle collapse/expand toggle aligned with ellipsis axis; placed outside of scroll container to stay horizontally centered during horizontal scrolling */}
      {(() => {
        const step = state.currentExample?.generation_steps?.[state.currentStep - 1];
        if (!step) return null;

        // Compute scrollable content width and token threshold similar to SVG render
        const tokens = step.tokens || [];
        const widthForCalc = containerWidth || CONSTS.DEFAULT_CONTAINER_WIDTH;
        const scrollAreaWidth = widthForCalc; // Full width now since labels are floating

        const maxVisibleTokens = Math.floor(scrollAreaWidth / CONSTS.TOKEN_SPACING_ESTIMATE) - 1;
        // Show button whenever there are enough tokens that collapsing would be beneficial
        const shouldShow = tokens.length > maxVisibleTokens;
        if (!shouldShow) return null;

        return (
          <button
            className={`collapse-toggle ${isExpanded ? 'state-expanded' : 'state-collapsed'}`}
            onClick={() => setIsExpanded((v) => !v)}
            aria-label={isExpanded ? 'Collapse tokens' : 'Expand tokens'}
            title={isExpanded ? 'Collapse tokens' : 'Expand tokens'}
          >
            <Icon
              path={isExpanded ? mdiArrowCollapseHorizontal : mdiArrowExpandHorizontal}
              size={0.8}
            />
          </button>
        );
      })()}

      {/* Scrollable visualization area */}
      <div className="viz-scroll" ref={scrollRef}>
        <svg
          ref={svgRef}
          className="visualization-canvas"
          style={{
            transition: 'width 0.3s ease',
          }}
        />
      </div>

      {/* Stage labels panel - only after animation starts */}
      {state.currentStep > 0 && (
        <div className="viz-labels-panel">
          <button
            className="viz-labels-toggle"
            onClick={() => setLabelsVisible((v) => !v)}
            title={labelsVisible ? 'Hide stage labels' : 'Show stage labels'}
            aria-label={labelsVisible ? 'Hide stage labels' : 'Show stage labels'}
          >
            <Icon path={labelsVisible ? mdiChevronRight : mdiChevronLeft} size={0.9} />
          </button>
          <div className={`viz-labels-container ${labelsVisible ? 'expanded' : ''}`}>
            <div className="viz-labels-content">
              <svg ref={labelsSvgRef} className="visualization-labels-canvas" />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
