/* eslint-disable no-unused-vars */
import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useApp } from '../contexts/AppContext';
import { useI18n } from '../i18n/I18nProvider';
import * as d3 from 'd3';
import { gsap } from 'gsap';
import { getTokenColor, getEmbeddingColor, getPurpleByProb } from '../visualization/core/colors';
import { setInitialStates, buildTimeline } from '../visualization/animation/timeline';
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
import { LAYOUT as CONSTS } from '../visualization/core/constants';
import Icon from '@mdi/react';
import { mdiArrowExpandHorizontal, mdiArrowCollapseHorizontal } from '@mdi/js';

/**
 * VisualizationCanvas Component
 * Main SVG container for all D3 visualizations
 */
function VisualizationCanvas() {
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
  const [scrollLeft, setScrollLeft] = useState(0);
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
    if (!svgRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const svg = d3.select(svgRef.current);
    const labelsSvg = d3.select(labelsSvgRef.current);

    // Update SVG dimensions based on container
    const updateDimensions = () => {
      const rect = container.getBoundingClientRect();
      setContainerWidth(rect.width || 800);
      svg.attr('width', rect.width);
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
      setScrollLeft(0);
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

  // Track horizontal scroll to align the collapse toggle with the ellipsis axis
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => setScrollLeft(el.scrollLeft || 0);
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

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

    // Get SVG dimensions - use full container width for layout
    const width = containerWidth || 800;
    // Dynamically size the sticky labels panel based on estimated token content width
    const estimateGap = 70; // keep in sync with renderTokensLayer spacing
    const estWidths = (step.tokens || []).map((tok) => Math.max(36, tok.length * 10 + 16));
    const estimatedContentWidth =
      estWidths.reduce((a, b) => a + b, 0) +
      ((step.tokens || []).length > 0 ? estimateGap * ((step.tokens || []).length - 1) : 0) +
      40;
    const maxLabelsWidth = Math.max(360, Math.round(width * 0.5));
    const minLabelsWidth = 340;
    const denom = Math.max(1, width - minLabelsWidth);
    const growthRatio = Math.max(0, Math.min(1, estimatedContentWidth / denom));
    const labelsWidthDynamic = Math.round(
      maxLabelsWidth - (maxLabelsWidth - minLabelsWidth) * growthRatio
    );
    const visualizationWidth = Math.max(320, width - labelsWidthDynamic); // Content area width
    // const height = parseFloat(svg.attr('height')) || 900;

    // Determine if we need to collapse tokens
    const maxVisibleTokens = Math.floor(visualizationWidth / 170) - 1; // basic heuristic; dynamic sizing handled below
    const shouldCollapse = step.tokens.length > maxVisibleTokens && !isExpanded;

    // Layout configuration with proper spacing
    const layout = {
      // Make tokens appear ~10px below the top of the visualization area
      tokenY: 10,
      // Move embeddings up accordingly but keep enough room for arrows
      embeddingY: 140,
      margin: 20,
      leftBias: -100, // shift overall layout ~200px to the left when space allows
      tokenSpacing: 140,
      blockPadding: 30,
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
      stage_token_ids: layout.tokenY + 72,
      stage_input_embeddings: layout.embeddingY + (outerMeta.maxOuterHeight || 0) / 2,
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
    const showLabelsGradually = state.currentStep === 1 && currentLayer === 0;
    renderStageLabels(labelsGroup, layout, 0, subStep, t, showLabelsGradually);
    // Size the labels SVG to the panel width
    labelsSvg.attr('width', labelsWidthDynamic);

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

  // Compute dynamic labels width again for layout styling
  const currentStepDataForStyle = state.currentExample?.generation_steps?.[state.currentStep - 1];
  const tokensForStyle = currentStepDataForStyle?.tokens || [];
  const estWidthsForStyle = tokensForStyle.map((tok) => Math.max(36, tok.length * 10 + 16));
  const estimatedContentWidthForStyle =
    estWidthsForStyle.reduce((a, b) => a + b, 0) +
    (tokensForStyle.length > 0 ? 70 * (tokensForStyle.length - 1) : 0) +
    40;
  const widthForStyle = containerWidth || 800;
  const maxLabelsWidthForStyle = Math.max(360, Math.round(widthForStyle * 0.5));
  const minLabelsWidthForStyle = 340;
  const denomForStyle = Math.max(1, widthForStyle - minLabelsWidthForStyle);
  const growthRatioForStyle = Math.max(
    0,
    Math.min(1, estimatedContentWidthForStyle / denomForStyle)
  );
  const labelsWidthStyle = Math.round(
    maxLabelsWidthForStyle - (maxLabelsWidthForStyle - minLabelsWidthForStyle) * growthRatioForStyle
  );

  return (
    <section
      className={`visualization-section ${isExpanded ? 'expanded' : ''}`}
      ref={containerRef}
      style={{ ['--labels-width']: `${labelsWidthStyle}px` }}
    >
      {/* Scrollable visualization area with overlay controls */}
      <div className="viz-scroll" ref={scrollRef}>
        {/* Subtle collapse/expand toggle aligned with ellipsis axis */}
        {(() => {
          const step = state.currentExample?.generation_steps?.[state.currentStep - 1];
          if (!step) return null;

          // Compute scrollable content width and token threshold similar to SVG render
          const tokens = step.tokens || [];
          const gap = 70;
          const widthForCalc = containerWidth || 800;
          const maxLabelsWidthCalc = Math.max(360, Math.round(widthForCalc * 0.5));
          const minLabelsWidthCalc = 340;
          const denomCalc = Math.max(1, widthForCalc - minLabelsWidthCalc);
          const estWidths = tokens.map((tok) =>
            Math.max(36, processTokenForVisualization(tok).length * 10 + 16)
          );
          const estimatedContentWidth =
            estWidths.reduce((a, b) => a + b, 0) +
            (tokens.length > 0 ? gap * (tokens.length - 1) : 0) +
            40;
          const labelsWidthCalc = Math.round(
            maxLabelsWidthCalc -
              (maxLabelsWidthCalc - minLabelsWidthCalc) *
                Math.max(0, Math.min(1, estimatedContentWidth / denomCalc))
          );
          const scrollAreaWidth = Math.max(320, widthForCalc - labelsWidthCalc);

          const maxVisibleTokens = Math.floor(scrollAreaWidth / 170) - 1; // Match the render logic
          // Show button whenever there are enough tokens that collapsing would be beneficial
          // This matches the logic used in the render effect (line ~173)
          const shouldShow = tokens.length > maxVisibleTokens;
          if (!shouldShow) return null;

          // Compute would-be ellipsis center X for collapsed layout (in SVG coords)
          const edgeCount = Math.max(1, Math.floor(maxVisibleTokens / 2));
          const leftTokens = tokens.slice(0, edgeCount);
          const rightTokens = tokens.slice(-edgeCount);
          const visibleCollapsed = [...leftTokens, '...', ...rightTokens];
          const widthsCollapsed = visibleCollapsed.map((tok) =>
            tok === '...' ? 24 : Math.max(36, processTokenForVisualization(tok).length * 10 + 16)
          );
          const contentWidthCollapsed =
            widthsCollapsed.reduce((a, b) => a + b, 0) + gap * (visibleCollapsed.length - 1);
          const minMargin = 20; // keep in sync with layout.margin default
          const leftBias = -100; // keep in sync with layout.leftBias
          const startX = Math.max(
            minMargin,
            (scrollAreaWidth - contentWidthCollapsed) / 2 - leftBias
          );
          let cursor = startX;
          const positionsCollapsed = widthsCollapsed.map((w) => {
            const c = cursor + w / 2;
            cursor += w + gap;
            return c;
          });
          const ellipsisIndex = edgeCount; // where '...' sits
          const ellipsisCenterX = positionsCollapsed[ellipsisIndex] ?? scrollAreaWidth / 2;

          // Position the button between token IDs and embeddings, adjust for horizontal scroll
          const buttonHalf = 16; // 32px / 2
          const left = Math.round(ellipsisCenterX - scrollLeft - buttonHalf);
          const clampedLeft = Math.max(4, Math.min(left, scrollAreaWidth - buttonHalf * 2 - 4));

          return (
            <button
              className={`collapse-toggle ${isExpanded ? 'state-expanded' : 'state-collapsed'}`}
              style={{ left: `${clampedLeft}px`, top: '95px' }}
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
        {(() => {
          // Estimate dynamic width based on token content (labels are in a separate sticky panel)
          const currentStepData = state.currentExample?.generation_steps?.[state.currentStep - 1];
          const tokens = currentStepData?.tokens || [];
          const gap = 70; // keep in sync with renderTokensLayer spacing
          const estWidths = tokens.map((tok) => Math.max(36, tok.length * 10 + 16));
          const estimatedContentWidth =
            estWidths.reduce((a, b) => a + b, 0) +
            (tokens.length > 0 ? gap * (tokens.length - 1) : 0) +
            40;
          // Use full scrollable width (container minus dynamic panel) or estimated width, whichever is larger
          const widthForCalc = containerWidth || 800;
          const maxLabelsWidthCalc = Math.max(360, Math.round(widthForCalc * 0.5));
          const minLabelsWidthCalc = 340;
          const denomCalc = Math.max(1, widthForCalc - minLabelsWidthCalc);
          const growthRatioCalc = Math.max(0, Math.min(1, estimatedContentWidth / denomCalc));
          const labelsWidthCalc = Math.round(
            maxLabelsWidthCalc - (maxLabelsWidthCalc - minLabelsWidthCalc) * growthRatioCalc
          );
          const scrollAreaWidth = Math.max(320, widthForCalc - labelsWidthCalc);
          // When expanded, add horizontal padding so the rightmost content isn't trimmed.
          // Keep this in sync with layout.margin (~20px on the left) and potential positioning biases.
          const extraPadding = 400; // layout.margin * 2 for symmetric room
          const svgWidth = isExpanded
            ? Math.max(scrollAreaWidth, estimatedContentWidth + extraPadding)
            : scrollAreaWidth;

          // Render SVG with computed width
          return (
            <svg
              ref={svgRef}
              className="visualization-canvas"
              style={{
                width: `${svgWidth}px`,
                minWidth: '100%',
                transition: 'width 0.3s ease',
              }}
            />
          );
        })()}
      </div>
      <div className="viz-labels">
        <svg ref={labelsSvgRef} className="visualization-labels-canvas" />
      </div>
    </section>
  );
}

export default VisualizationCanvas;
