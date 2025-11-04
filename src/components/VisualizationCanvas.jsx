/* eslint-disable no-unused-vars */
import { useEffect, useRef, useState } from 'react';
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
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(800);
  const [isExpanded, setIsExpanded] = useState(false);
  const [embeddingExpanded, setEmbeddingExpanded] = useState({});
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
      svg.attr('width', rect.width).attr('height', rect.height);
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    return () => window.removeEventListener('resize', updateDimensions);
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
    const maxVisibleTokens = Math.floor(visualizationWidth / 140) - 1; // basic heuristic; dynamic sizing handled below
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
    const outerMeta = renderOuterEmbeddingsLayer(
      embeddingGroup,
      step,
      layout,
      tokensLayoutRef,
      embeddingExpanded,
      setEmbeddingExpanded,
      computedEmbeddings
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
      numLayers
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
      rightmostMeta: rightmostIdx >= 0 ? ffnMetas[rightmostIdx] : null,
    };

    // 5. Output distribution below
    // Reduce vertical offset before the output area to keep bars within the canvas height
    const outputYOffset = 120;
    layout.outputY = ffnInfo.afterBottomY + outputYOffset;
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

    renderOutputLayer(
      outputGroup,
      step,
      layout,
      visualizationWidth,
      svgRef.current,
      ffnInfo,
      subStep,
      computedEmbeddings,
      contentCenterX
    );

    // 6. Collect Y positions for stage labels
    // We need to determine Y positions for each stage based on the actual layout
    layout.attentionY = blockMeta.blockTopY + 40; // Slightly lower to fit reduced block height
    layout.ffnY = blockMeta.ffnY + 10;
    layout.bottomEmbeddingY = blockMeta.ffnY + 10; // Repurpose to label FFN output since outside bottom is removed
    layout.extractedY = ffnInfo.afterBottomY + 40;

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

    const animDuration = 0.6; // Duration for each transition
    const isInitialStep = state.currentStep === 1;

    // Use modular animation utilities
    setInitialStates(svgRef.current, subStep, isInitialStep);
    gsapRef.current = buildTimeline(
      svgRef.current,
      subStep,
      isInitialStep,
      animDuration,
      onStepAnimationComplete
    );
  }, [
    state.currentStep,
    state.currentExample,
    state.currentAnimationSubStep,
    state.currentTransformerLayer,
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
      {/* Expand/Collapse button - only show when tokens would be collapsed */}
      {(() => {
        const currentStepData = state.currentExample?.generation_steps?.[state.currentStep - 1];
        const tokens = currentStepData?.tokens || [];
        const width = containerWidth || 800;
        const maxVisibleTokens = Math.floor(width / 140) - 1;
        const shouldShowButton = tokens.length > maxVisibleTokens;

        return shouldShowButton ? (
          <button
            className="expand-tokens-button"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-label={isExpanded ? 'Collapse tokens' : 'Expand all tokens'}
            title={isExpanded ? 'Collapse tokens' : 'Expand all tokens'}
          >
            {isExpanded ? '←' : '→'}
          </button>
        ) : null;
      })()}

      <div className="viz-scroll">
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
          const svgWidth = isExpanded
            ? Math.max(scrollAreaWidth, estimatedContentWidth)
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
