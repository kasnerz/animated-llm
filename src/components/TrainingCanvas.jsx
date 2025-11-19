/* eslint-disable no-unused-vars */
import { useEffect, useRef, useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { useI18n } from '../i18n/I18nProvider';
import * as d3 from 'd3';
import { computeEmbeddingsForStep } from '../visualization/core/embeddings';
import { LAYOUT as CONSTS, TOKEN } from '../visualization/core/constants';
import { trainingTimeline } from '../visualization/animation';
import {
  renderTokensLayer,
  renderOuterEmbeddingsLayer,
  renderTransformerBlockLayer,
  renderOutputLayer,
  renderStageLabels,
} from '../visualization/layers';
import { processTokenForVisualization } from '../utils/tokenProcessing';
import Icon from '@mdi/react';
import {
  mdiArrowExpandHorizontal,
  mdiArrowCollapseHorizontal,
  mdiChevronLeft,
  mdiChevronRight,
} from '@mdi/js';
import '../styles/visualization.css';

/**
 * TrainingCanvas
 * Full training visualization: feeds progressively longer inputs through the Transformer
 * and shows the output distribution (teacher forcing: no selection highlight, no append arrow).
 */
export default function TrainingCanvas() {
  const { state, actions } = useApp();
  const { t } = useI18n();
  const svgRef = useRef(null);
  const labelsSvgRef = useRef(null);
  const scrollRef = useRef(null);
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(800);
  const [isExpanded, setIsExpanded] = useState(false);
  const [labelsVisible, setLabelsVisible] = useState(true);
  const tokensLayoutRef = useRef({ positions: [], widths: [], visibleIndices: [], gap: 24 });
  const gsapRef = useRef(null);

  // Track size of the scroll container to set SVG width responsively
  useEffect(() => {
    if (!scrollRef.current || !svgRef.current) return;
    const el = scrollRef.current;
    const svg = d3.select(svgRef.current);
    const labelsSvg = d3.select(labelsSvgRef.current);
    const onResize = () => {
      const rect = el.getBoundingClientRect();
      const w = Math.round(rect.width) || 800;
      setContainerWidth(w);
      svg.attr('width', w);
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // No scroll tracking needed for the collapse toggle; it's fixed via CSS

  // 'e' key toggles collapse/expand like in text generation
  useEffect(() => {
    const onKeyDown = (e) => {
      if (!e || e.target.matches('input, textarea')) return;
      if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        if (state.isPlaying) actions.setIsPlaying(false);
        setIsExpanded((v) => !v);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [state.isPlaying, actions]);

  // Clear when example, language, or reset
  useEffect(() => {
    if (!svgRef.current) return;
    // Kill any running tl
    if (gsapRef.current && typeof gsapRef.current.kill === 'function') {
      try {
        gsapRef.current.kill();
      } catch (e) {
        console.debug('GSAP kill failed (safe to ignore):', e);
      }
      gsapRef.current = null;
    }
    try {
      d3.select(svgRef.current).selectAll('*').remove();
      if (labelsSvgRef.current) d3.select(labelsSvgRef.current).selectAll('*').remove();
    } catch (e) {
      console.debug('Clearing SVG failed (safe to ignore):', e);
    }
    tokensLayoutRef.current = { positions: [], widths: [], visibleIndices: [], gap: 24 };
  }, [state.currentExampleId, state.language, state.currentStep]);

  // Render training visualization for the current step
  useEffect(() => {
    if (!svgRef.current || !state.currentExample || state.currentStep === 0) return;

    // Teacher forcing flow starts from step 1 (first input token -> predict second)
    const trainSteps = state.currentExample.training_steps || [];
    const effectiveIdx = Math.max(1, state.currentStep); // skip step 0 (no inputs)
    const tStep = trainSteps[effectiveIdx];
    if (!tStep) return;

    // Build a step-like structure expected by reusable layers
    const predictions = tStep.predictions || [];
    const targetTokenPrediction = tStep.target_token_prediction;

    // Build candidates array: if target token is not in predictions, add ellipsis and target
    let candidates = predictions.map((p) => ({ token: p.token, prob: p.prob }));

    if (targetTokenPrediction) {
      // Check if target token is already in the predictions
      const targetInPredictions = predictions.some(
        (p) => p.token_id === targetTokenPrediction.token_id
      );

      if (!targetInPredictions) {
        // Add ellipsis marker and target token
        candidates = [
          ...predictions.map((p) => ({ token: p.token, prob: p.prob })),
          { token: '...', prob: 0, isEllipsis: true },
          { token: targetTokenPrediction.token, prob: targetTokenPrediction.prob },
        ];
      }
    }

    const stepForRender = {
      step: effectiveIdx,
      tokens: tStep.input_tokens || [],
      token_ids: tStep.input_token_ids || [],
      // Distribution built from predictions; no selected_token to avoid highlight/append
      output_distribution: {
        candidates,
      },
      // Provide training target token for rendering target vector/differences
      training_target_token: targetTokenPrediction || null,
      model_info: state.currentExample.model_info,
    };

    const svg = d3.select(svgRef.current);
    const labelsSvg = d3.select(labelsSvgRef.current);

    // Clear
    svg.selectAll('*').remove();
    labelsSvg.selectAll('*').remove();

    // Main groups
    const g = svg.append('g').attr('class', 'visualization-main');
    const tokenGroup = g.append('g').attr('class', 'token-group');
    const embeddingGroup = g.append('g').attr('class', 'embedding-group');
    const transformerGroup = g.append('g').attr('class', 'transformer-group');
    const outputGroup = g.append('g').attr('class', 'output-group');
    const labelsGroup = labelsSvg.append('g').attr('class', 'stage-labels-group');

    const width = containerWidth || CONSTS.DEFAULT_CONTAINER_WIDTH;
    const isMobile = width <= 1000;
    const layout = {
      tokenY: CONSTS.TOKEN_Y,
      embeddingY: CONSTS.EMBEDDING_Y,
      margin: isMobile ? CONSTS.MARGIN_MOBILE : CONSTS.MARGIN,
      leftBias: CONSTS.LEFT_BIAS,
      tokenSpacing: CONSTS.TOKEN_SPACING,
      blockPadding: CONSTS.BLOCK_PADDING,
    };

    // Collapse when too many input tokens
    // Use tighter spacing estimate on mobile for more aggressive collapse
    const spacingEstimate = isMobile ? 120 : CONSTS.TOKEN_SPACING_ESTIMATE;
    const maxVisibleTokens = Math.floor(width / spacingEstimate) - 1;
    const shouldCollapse = stepForRender.tokens.length > maxVisibleTokens && !isExpanded;

    // 1) Tokens
    renderTokensLayer(
      tokenGroup,
      stepForRender,
      layout,
      width,
      shouldCollapse,
      maxVisibleTokens,
      tokensLayoutRef
    );

    // 2) Outer embeddings
    const isDarkMode = state.theme === 'dark';
    const computedEmbeddings = computeEmbeddingsForStep(stepForRender, 3);
    const outerMeta = renderOuterEmbeddingsLayer(
      embeddingGroup,
      stepForRender,
      layout,
      tokensLayoutRef,
      {},
      () => {},
      computedEmbeddings,
      isDarkMode
    );

    // 3) Transformer block (with layer stacking)
    const numLayers = state.currentExample.model_info?.num_layers || 1;
    const currentLayer = state.currentTransformerLayer || 0;
    const blockMeta = renderTransformerBlockLayer(
      transformerGroup,
      stepForRender,
      layout,
      tokensLayoutRef,
      outerMeta,
      currentLayer,
      computedEmbeddings,
      numLayers,
      isDarkMode
    );

    // 4) Output distribution (no append preview in training)
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
        : width / 2;

    const ffnInfo = {
      afterBottomY: blockMeta.blockBottomY,
      topY: blockMeta.ffnY,
      metas: blockMeta.insideBottomMeta || [],
      rightmostIdx: (tokensLayoutRef.current?.visibleIndices || []).length - 1,
      rightmostActualIndex: stepForRender.tokens.length - 1,
      rightmostMeta: (blockMeta.insideBottomMeta || []).slice(-1)[0] || null,
      flowOffsetX: blockMeta.flowOffsetX || 0,
      flowOffsetY: blockMeta.flowOffsetY || 0,
    };

    // set Y for outputs and render
    const layoutLocal = { ...layout };
    layoutLocal.outputY = ffnInfo.afterBottomY + CONSTS.OUTPUT_Y_OFFSET;
    const outputsMeta = renderOutputLayer(
      outputGroup,
      stepForRender,
      layoutLocal,
      width,
      svgRef.current,
      ffnInfo,
      Math.min(8, state.currentAnimationSubStep ?? 0),
      computedEmbeddings,
      contentCenterX,
      isDarkMode
    );

    // Stage labels on the right
    const labelsWidth = 280;
    labelsSvg.attr('width', labelsWidth);
    const stageY = {
      stage_tokenization: layout.tokenY + 6,
      stage_input_embeddings: layout.embeddingY + (outerMeta.maxOuterHeight || 0) / 2,
      stage_positional_embeddings: (() => {
        const outerBottom = layout.embeddingY + (outerMeta.maxOuterHeight || 0);
        const insideTopCenter =
          (blockMeta.insideTopY ?? blockMeta.blockTopY + CONSTS.BLOCK_PADDING) +
          (blockMeta.maxInsideTopHeight || 0) / 2;
        return outerBottom + (insideTopCenter - outerBottom) * 0.5;
      })(),
      stage_attention_layer: blockMeta.attentionCenterY ?? blockMeta.blockTopY + 40,
      stage_feedforward_layer:
        blockMeta.ffnProjectionCenterY ?? blockMeta.ffnY + (blockMeta.maxFfnHeight || 0) / 2,
      stage_last_embedding: outputsMeta?.extractedCenterY ?? ffnInfo.afterBottomY + 20 + 15,
      stage_output_probabilities: outputsMeta?.logprobCenterY ?? ffnInfo.afterBottomY + 128,
      stage_next_token: outputsMeta?.logprobCenterY
        ? outputsMeta.logprobCenterY + 70
        : ffnInfo.afterBottomY + 198,
    };
    const animSubStep = Math.min(8, state.currentAnimationSubStep ?? 0);
    const showLabelsGradually = state.currentStep === 1;
    renderStageLabels(labelsGroup, { ...layout, stageY }, 0, animSubStep, t, showLabelsGradually, {
      currentLayer,
      numLayers,
      isTraining: true,
    });

    // Dynamic SVG height
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

    // Update SVG width style directly to avoid refs-in-render and setState-in-effect
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
      d3.select(svgRef.current).style('width', `${svgWidth}px`);
    } else {
      d3.select(svgRef.current).style('width', '100%');
    }

    // Build and run training timeline for current sub-step (0..8)
    const animDuration = state.instantTransition ? 0 : 0.6;
    const isInitialStep = state.currentStep === 1;
    trainingTimeline.setInitialStates(svgRef.current, animSubStep, isInitialStep);
    const stepCompleteCb =
      animSubStep === 8 && !state.instantTransition
        ? () => actions.onStepAnimationComplete(state.isPlaying)
        : null;
    gsapRef.current = trainingTimeline.buildTimeline(
      svgRef.current,
      animSubStep,
      isInitialStep,
      animDuration,
      stepCompleteCb
    );
  }, [
    state.currentStep,
    state.currentExample,
    state.currentTransformerLayer,
    state.theme,
    containerWidth,
    actions,
    state.instantTransition,
    state.isPlaying,
    state.currentAnimationSubStep,
    isExpanded,
    t,
  ]);

  return (
    <section className={`visualization-section ${isExpanded ? 'expanded' : ''}`} ref={containerRef}>
      {/* Collapse/Expand toggle fixed to viewport center; render before scroll area */}
      {(() => {
        const trainSteps = state.currentExample?.training_steps || [];
        const effectiveIdx = Math.max(1, state.currentStep);
        const tStep = trainSteps[effectiveIdx];
        if (!tStep) return null;
        const tokens = tStep.input_tokens || [];
        const widthForCalc = containerWidth || CONSTS.DEFAULT_CONTAINER_WIDTH;
        // Use tighter spacing estimate on mobile for more aggressive collapse
        const isMobile = widthForCalc <= 1000;
        const spacingEstimate = isMobile ? 120 : CONSTS.TOKEN_SPACING_ESTIMATE;
        const maxVisibleTokens = Math.floor(widthForCalc / spacingEstimate) - 1;
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

      <div className="viz-scroll" ref={scrollRef}>
        <div className="viz-scale">
          <svg
            ref={svgRef}
            className="visualization-canvas"
            style={{ transition: 'width 0.3s ease' }}
          />
        </div>
      </div>

      {/* Stage labels panel with toggle */}
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
