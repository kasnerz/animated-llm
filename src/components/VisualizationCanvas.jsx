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
  renderBottomEmbeddingsLayer,
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
    const step = state.currentExample.generation_steps[state.currentStep - 1];
    const computedEmbeddings = computeEmbeddingsForStep(step, 3);
    const subStep = state.currentAnimationSubStep;
    const currentLayer = state.currentTransformerLayer;
    const transformerPassPhase = state.transformerPassPhase;
    const numLayers = state.currentExample.model_info?.num_layers || 1;

    // Clear previous visualization
    svg.selectAll('*').remove();

    // Create main groups for different visualization sections
    const g = svg.append('g').attr('class', 'visualization-main');

    const tokenGroup = g.append('g').attr('class', 'token-group');
    const embeddingGroup = g.append('g').attr('class', 'embedding-group'); // outside (top)
    const transformerGroup = g.append('g').attr('class', 'transformer-group'); // inside block
    const bottomEmbeddingGroup = g.append('g').attr('class', 'bottom-embedding-group'); // outside (bottom)
    const outputGroup = g.append('g').attr('class', 'output-group');
    const labelsGroup = g.append('g').attr('class', 'stage-labels-group');

    // Get SVG dimensions - reserve space for labels on the right
    const width = parseFloat(svg.attr('width')) || 800;
    // We'll anchor labels relative to the rightmost content, not a reserved area
    const visualizationWidth = width; // Use current width as a baseline for content layout
    // const height = parseFloat(svg.attr('height')) || 900;

    // Determine if we need to collapse tokens
    const maxVisibleTokens = Math.floor(visualizationWidth / 140) - 1; // basic heuristic; dynamic sizing handled below
    const shouldCollapse = step.tokens.length > maxVisibleTokens && !isExpanded;

    // Layout configuration with proper spacing
    const layout = {
      tokenY: 80,
      embeddingY: 200, // shifted down to leave room for ID → embedding arrows
      margin: 20,
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
      numLayers,
      transformerPassPhase,
      subStep
    );

    // 4. Bottom outside embeddings (no FFN arrows now)
    const bottomInfo = renderBottomEmbeddingsLayer(
      bottomEmbeddingGroup,
      step,
      layout,
      tokensLayoutRef,
      blockMeta,
      computedEmbeddings
    );

    // 5. Output distribution below
    // Reduce vertical offset before the output area to keep bars within the canvas height
    const outputYOffset = 120;
    layout.outputY = bottomInfo.afterBottomY + outputYOffset;
    renderOutputLayer(
      outputGroup,
      step,
      layout,
      visualizationWidth,
      svgRef.current,
      bottomInfo,
      subStep,
      computedEmbeddings
    );

    // 6. Collect Y positions for stage labels
    // We need to determine Y positions for each stage based on the actual layout
    layout.attentionY = blockMeta.blockTopY + 60; // Position inside transformer block
    layout.ffnY = blockMeta.blockTopY + (blockMeta.blockBottomY - blockMeta.blockTopY) / 2 + 40;
    layout.bottomEmbeddingY = bottomInfo.topY + 20;
    layout.extractedY = bottomInfo.afterBottomY + 40;

    // 7. Render stage labels on the right
    // Determine the right edge of the content to anchor labels consistently
    const { visibleIndices = [], positions = [], widths = [] } = tokensLayoutRef.current || {};
    let rightmostContentX = 0;
    if (bottomInfo?.rightmostMeta) {
      rightmostContentX = bottomInfo.rightmostMeta.centerX + bottomInfo.rightmostMeta.width / 2;
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

    // Render stage labels anchored to the content's right edge
    renderStageLabels(labelsGroup, layout, rightmostContentX, subStep, t);

    // If labels overflow the current SVG width, expand SVG width to make room and allow scroll
    const extraRight = 260; // delimiter + label spacing + margin
    const neededWidth = Math.max(width, rightmostContentX + extraRight);
    svg.attr('width', neededWidth);

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
    state.transformerPassPhase,
    isExpanded,
    embeddingExpanded,
    onStepAnimationComplete,
    t,
  ]);

  return (
    <section
      className={`visualization-section ${isExpanded ? 'expanded' : ''}`}
      ref={containerRef}
      style={{
        // Allow horizontal scrolling when the SVG exceeds the container
        overflowX: 'auto',
        transition: 'all 0.3s ease',
      }}
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

      {(() => {
        // Estimate dynamic min-width when expanded based on token content
        const currentStepData = state.currentExample?.generation_steps?.[state.currentStep - 1];
        const tokens = currentStepData?.tokens || [];
        const gap = 24;
        const estWidths = tokens.map((tok) => Math.max(36, tok.length * 10 + 16));
        const estimatedMinWidth =
          estWidths.reduce((a, b) => a + b, 0) +
          (tokens.length > 0 ? gap * (tokens.length - 1) : 0) +
          40;
        // Render SVG with computed minWidth
        return (
          <svg
            ref={svgRef}
            className="visualization-canvas"
            style={{
              minWidth: isExpanded ? `${estimatedMinWidth}px` : '100%',
              transition: 'min-width 0.3s ease',
            }}
          />
        );
      })()}
    </section>
  );
}

export default VisualizationCanvas;
