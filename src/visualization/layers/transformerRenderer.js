/**
 * Transformer block layer rendering
 *
 * REUSABLE COMPONENT - View-agnostic
 * This renderer can be used across different views (text generation, training, decoding)
 * It only depends on the data structure passed to it, not on any specific view logic
 */
import { getTokenColor } from '../core/colors';
import { drawEmbeddingColumn } from './helpers/vectorHelpers';
import {
  drawFeedbackArrow,
  drawArrowhead,
  drawPositionalIndicator,
  drawAttentionConnections,
} from './helpers/arrowHelpers';
import { drawArrow } from '../core/draw';
import {
  TRANSFORMER,
  TRANSFORMER_ARROWS,
  TRANSFORMER_BOX,
  FFN_CONNECTOR,
  TEXT_GEN_STEPS,
} from '../core/constants';

/**
 * Render transformer block layer with stacked card-style visualization
 */
export function renderTransformerBlockLayer(
  group,
  step,
  layout,
  tokensLayoutRef,
  outerMeta,
  currentLayer,
  computedEmbeddings,
  numLayers,
  isDarkMode = null,
  subStep = null,
  isMobile = false
) {
  // Store layer info in DOM attributes
  try {
    group.attr('data-current-layer', String(currentLayer ?? 0));
    if (numLayers != null) group.attr('data-num-layers', String(numLayers));
  } catch {
    // non-fatal
  }

  const { visibleIndices = [], positions = [] } = tokensLayoutRef.current || {};
  const columnsMeta = outerMeta.columnsMeta;

  const validXs = positions.filter((_, i) => visibleIndices[i] >= 0);
  if (validXs.length === 0) {
    return {
      blockTopY: layout.embeddingY,
      blockBottomY: layout.embeddingY,
      insideBottomMeta: [],
    };
  }

  const afterOuterBottom = layout.embeddingY + outerMeta.maxOuterHeight;
  const blockTopY = afterOuterBottom + TRANSFORMER.BLOCK_TOP_OFFSET;

  const underlays = group.append('g').attr('class', 'transformer-underlays');
  const backUnderlays = group.append('g').attr('class', 'positional-underlays-back');

  // Render inside top embeddings
  const insideTopY = blockTopY + layout.blockPadding;
  const { insideTopMeta, maxInsideTopHeight, feedbackArrowheads } = renderInsideTopEmbeddings(
    group,
    underlays,
    step,
    visibleIndices,
    positions,
    insideTopY,
    computedEmbeddings,
    columnsMeta,
    currentLayer,
    blockTopY,
    tokensLayoutRef,
    isDarkMode,
    subStep,
    isMobile
  );

  // Draw feedback arrowheads on top of vectors
  if (feedbackArrowheads.length) {
    const overlays = group.append('g').attr('class', 'transformer-overlays');
    feedbackArrowheads.forEach(({ x, y, isNew }) => {
      drawArrowhead(overlays, x, y, 'down', {
        className: `feedback-arrowhead ${isNew ? 'new-token' : 'prev-token'}`,
        fill: '#c0c0c0',
      });
    });
  }

  // Render attention layer and inside bottom embeddings
  const attentionStartY = insideTopY + maxInsideTopHeight;
  const insideBottomY = attentionStartY + TRANSFORMER.ATTENTION_HEIGHT;

  const { insideBottomMeta, maxInsideBottomHeight } = renderInsideBottomEmbeddings(
    group,
    visibleIndices,
    positions,
    insideBottomY,
    computedEmbeddings,
    isDarkMode,
    step,
    isMobile
  );

  // Render attention connections
  renderAttentionLayer(underlays, step, tokensLayoutRef, insideTopMeta, insideBottomMeta, isMobile);

  // Render FFN layer
  const ffnY = insideBottomY + maxInsideBottomHeight + TRANSFORMER.FFN_ARROW_GAP;
  const { ffnMeta, maxFfnHeight, ffnProjectionCenterY } = renderFFNLayer(
    group,
    underlays,
    step,
    visibleIndices,
    positions,
    ffnY,
    insideBottomMeta,
    computedEmbeddings,
    isDarkMode,
    currentLayer,
    numLayers,
    isMobile
  );

  const blockBottomY = ffnY + maxFfnHeight + layout.blockPadding;

  // Draw positional guides for second+ pass
  drawPositionalGuides(backUnderlays, currentLayer, tokensLayoutRef, columnsMeta);

  // Render shadow layers and main box
  renderTransformerBox(group, validXs, blockTopY, blockBottomY, numLayers, columnsMeta, isMobile);

  // Add stack size label
  const boxRightX = Math.max(...validXs) + 60;
  group
    .append('text')
    .attr('x', boxRightX + TRANSFORMER.STACK_LABEL_OFFSET_X)
    .attr('y', blockBottomY + TRANSFORMER.STACK_LABEL_OFFSET_Y)
    .attr('class', 'transformer-stack-label')
    .style('font-size', TRANSFORMER.STACK_LABEL_SIZE)
    .style('font-weight', '600')
    .style('fill', 'var(--text-tertiary)')
    .text(`${Math.max(1, numLayers || 1)}x`);

  const attentionCenterY = attentionStartY + TRANSFORMER.ATTENTION_HEIGHT / 2;

  return {
    blockTopY,
    blockBottomY,
    insideBottomMeta: ffnMeta,
    ffnY,
    insideTopY,
    maxInsideTopHeight,
    insideBottomY,
    maxInsideBottomHeight,
    maxFfnHeight,
    attentionCenterY,
    ffnProjectionCenterY,
  };
}

// Helper: Render inside top embeddings
function renderInsideTopEmbeddings(
  group,
  underlays,
  step,
  visibleIndices,
  positions,
  insideTopY,
  computedEmbeddings,
  columnsMeta,
  currentLayer,
  blockTopY,
  tokensLayoutRef,
  isDarkMode,
  subStep,
  isMobile = false
) {
  const insideTopGroup = group.append('g').attr('class', 'inside-top-embeddings');
  const insideTopMeta = [];
  let maxInsideTopHeight = 0;
  const feedbackArrowheads = [];

  const embTop = computedEmbeddings?.insideTop || [];
  const isTrainingBackprop = step && step.viz_mode === 'backprop';
  const storedMarkers = (tokensLayoutRef.current && tokensLayoutRef.current.posMarkers) || [];
  const storedSignature = tokensLayoutRef.current && tokensLayoutRef.current.posMarkersSignature;
  const newMarkers = [];
  const markerSignature = `${(tokensLayoutRef.current?.positions || []).join(',')}|${insideTopY}`;

  visibleIndices.forEach((actualIndex, i) => {
    const x = positions[i];
    if (actualIndex < 0) {
      insideTopMeta.push(null);
      return;
    }

    const vals = embTop[actualIndex] || [];
    const tokenColor = getTokenColor(actualIndex);
    const isNew = actualIndex === step.tokens?.length - 1;

    const meta = drawEmbeddingColumn(insideTopGroup, x, insideTopY, vals, {
      tokenColor,
      className: isNew ? 'new-token' : 'prev-token',
      isDarkMode,
      isMobile,
    });

    insideTopMeta.push(meta);
    maxInsideTopHeight = Math.max(maxInsideTopHeight, meta.height);

    // Draw arrows based on layer
    // Show outer-to-block arrow on first layer OR during stack reveal (step 5)
    const isStackReveal = subStep === TEXT_GEN_STEPS.STACK_REVEAL;
    if (
      currentLayer === 0 ||
      isStackReveal ||
      !storedMarkers.length ||
      storedSignature !== markerSignature
    ) {
      // First layer: arrow from outer embeddings
      const outerCol = columnsMeta[i];
      if (outerCol) {
        const startY = (outerCol.bottomY ?? outerCol.topY + outerCol.height) + 4;
        const endY = meta.topY + meta.height / 2 - 20;
        let extraClass = '';
        if (isTrainingBackprop) {
          // Do NOT tag outer-to-block arrow as last-embedding connection to avoid early purple highlight.
          // Tag outer embedding connectors on first layer for backprop step 16 only.
          if ((currentLayer ?? 0) === 0) {
            const colorClass = actualIndex % 2 === 0 ? 'green' : 'red';
            extraClass += ` bp-outer-embedding-connection ${colorClass}`;
          }
        }
        // During backprop, reverse arrow direction to point upwards
        const arrowStartY = isTrainingBackprop ? endY : startY;
        const arrowEndY = isTrainingBackprop ? startY : endY;

        drawArrow(underlays, x, arrowStartY, x, arrowEndY, {
          className: `outer-to-block-arrow ${isNew ? 'new-token' : 'prev-token'} ${extraClass}`,
        });

        // Positional embedding indicator
        const midY = startY + (endY - startY) * 0.5 + TRANSFORMER.POSITIONAL_Y_BIAS;
        const marker = drawPositionalIndicator(underlays, x, midY, actualIndex + 1, {
          className: `positional-emb ${isNew ? 'new-token' : 'prev-token'}`,
          opacity: 0,
        });
        newMarkers[i] = marker;
      }
    } else {
      // Subsequent layers: U-shaped feedback arrow
      const startX = x + TRANSFORMER.STACK_OFFSET_X;
      const startY = blockTopY;
      const endYTop = meta.topY;

      drawFeedbackArrow(
        underlays,
        startX,
        startY,
        x,
        endYTop,
        blockTopY,
        `shadow-to-block-arrow ${isNew ? 'new-token' : 'prev-token'}`
      );

      feedbackArrowheads.push({ x, y: endYTop, isNew });

      // Reuse or recompute positional marker
      const marker = storedMarkers[i];
      if (marker && storedSignature === markerSignature) {
        drawPositionalIndicator(underlays, marker.x, marker.y, actualIndex + 1, {
          className: `positional-emb ${isNew ? 'new-token' : 'prev-token'}`,
          opacity: 0.9,
        });
      }
    }
  });

  // Persist markers
  if (tokensLayoutRef && tokensLayoutRef.current) {
    if (newMarkers.length) {
      tokensLayoutRef.current.posMarkers = newMarkers;
      tokensLayoutRef.current.posMarkersSignature = markerSignature;
    } else if (!tokensLayoutRef.current.posMarkersSignature) {
      tokensLayoutRef.current.posMarkersSignature = markerSignature;
    }
  }

  return { insideTopMeta, maxInsideTopHeight, feedbackArrowheads };
}

// Helper: Render inside bottom embeddings
function renderInsideBottomEmbeddings(
  group,
  visibleIndices,
  positions,
  insideBottomY,
  computedEmbeddings,
  isDarkMode,
  step,
  isMobile = false
) {
  const insideBottomGroup = group.append('g').attr('class', 'inside-bottom-embeddings');
  const insideBottomMeta = [];
  let maxInsideBottomHeight = 0;

  const embBottom = computedEmbeddings?.insideBottom || [];

  visibleIndices.forEach((actualIndex, i) => {
    const x = positions[i];
    if (actualIndex < 0) {
      insideBottomMeta.push(null);
      return;
    }

    const vals = embBottom[actualIndex] || [];
    const tokenColor = getTokenColor(actualIndex);
    const isNew = actualIndex === (step.tokens?.length || 0) - 1;

    const meta = drawEmbeddingColumn(insideBottomGroup, x, insideBottomY, vals, {
      tokenColor,
      className: isNew ? 'new-token' : 'prev-token',
      isDarkMode,
      isMobile,
    });

    // Tag last-token bottom embeddings group for backprop highlighting if needed
    if (step && step.viz_mode === 'backprop' && actualIndex === (step.tokens || []).length - 1) {
      insideBottomGroup
        .selectAll('.embedding-col')
        .filter((_, nodeIndex, nodes) => nodes[nodeIndex] === meta.groupNode)
        .classed('bp-last-embedding-connection', true);
    }

    insideBottomMeta.push(meta);
    maxInsideBottomHeight = Math.max(maxInsideBottomHeight, meta.height);
  });

  return { insideBottomMeta, maxInsideBottomHeight };
}

// Helper: Render attention layer
function renderAttentionLayer(
  underlays,
  step,
  tokensLayoutRef,
  insideTopMeta,
  insideBottomMeta,
  isMobile = false
) {
  const attentionGroup = underlays.append('g').attr('class', 'attention-mash');

  // Add tooltip to the attention group (only if positions are available)
  if (insideTopMeta?.positions?.length > 0 && insideBottomMeta?.baseY && insideTopMeta?.baseY) {
    const rect = attentionGroup
      .append('rect')
      .attr('class', 'attention-mash-tooltip-area')
      .attr('x', insideTopMeta.positions[0] - 50)
      .attr('y', insideTopMeta.baseY - 30)
      .attr(
        'width',
        insideTopMeta.positions[insideTopMeta.positions.length - 1] -
          insideTopMeta.positions[0] +
          100
      )
      .attr('height', insideBottomMeta.baseY - insideTopMeta.baseY + 60)
      .style('fill', 'transparent')
      .style('pointer-events', 'none')
      .style('cursor', 'help');

    if (!isMobile) {
      rect.attr('data-tooltip-id', 'viz-attention-tooltip');
    }
  }

  const isFirstGenStep = Number(step?.step) === 0;
  const isBackprop = step && step.viz_mode === 'backprop';
  // During backprop, only tag attention lines for the first or last layer appropriately,
  // not both at once. Intermediate layers remain untagged.
  let backpropAttentionClassBase = null;
  if (isBackprop) {
    const classes = [];
    // In backprop mode (training), we treat the single visible block as both first and last
    // for animation purposes, so we tag it with both classes.
    classes.push('bp-first-block-attention-connection');
    classes.push('bp-last-block-attention-connection');
    if (classes.length) {
      backpropAttentionClassBase = classes.join(' ');
    }
  }

  if (isFirstGenStep) {
    // Triangular/causal attention
    drawAttentionConnections(attentionGroup, insideTopMeta, insideBottomMeta, true, -1, {
      classNameBase: backpropAttentionClassBase,
    });
  } else {
    // All-to-one attention
    const lastActualIndex = (step.tokens || []).length - 1;
    const visibleIndices = tokensLayoutRef.current?.visibleIndices || [];
    let targetIdx = visibleIndices.indexOf(lastActualIndex);

    if (targetIdx < 0) {
      for (let i = visibleIndices.length - 1; i >= 0; i--) {
        if (visibleIndices[i] >= 0) {
          targetIdx = i;
          break;
        }
      }
    }

    if (targetIdx >= 0) {
      drawAttentionConnections(attentionGroup, insideTopMeta, insideBottomMeta, false, targetIdx, {
        classNameBase: backpropAttentionClassBase,
      });
    }
  }
}

// Helper: Render FFN layer
function renderFFNLayer(
  group,
  underlays,
  step,
  visibleIndices,
  positions,
  ffnY,
  insideBottomMeta,
  computedEmbeddings,
  isDarkMode,
  currentLayer,
  numLayers,
  isMobile = false
) {
  const ffnGroup = group.append('g').attr('class', 'inside-ffn-embeddings');
  const ffnMeta = [];
  let maxFfnHeight = 0;
  let ffnProjectionCenterY = null;

  const embFfn = computedEmbeddings?.ffn || [];
  const isFirstGenStep = Number(step?.step) === 0;

  visibleIndices.forEach((actualIndex, i) => {
    const x = positions[i];
    if (actualIndex < 0) {
      ffnMeta.push(null);
      return;
    }

    const vals = embFfn[actualIndex] || [];
    const tokenColor = getTokenColor(actualIndex);
    const isNew = actualIndex === (step.tokens?.length || 0) - 1;

    const meta = drawEmbeddingColumn(ffnGroup, x, ffnY, vals, {
      tokenColor,
      className: isNew ? 'new-token' : 'prev-token',
      isDarkMode,
      isMobile,
    });

    const insideBottom = insideBottomMeta[i];
    const shouldRenderFfnConnectors = isFirstGenStep || isNew;

    if (insideBottom && meta && shouldRenderFfnConnectors) {
      const isBackprop = step && step.viz_mode === 'backprop';
      const isFirstLayer = (currentLayer ?? 0) === 0;
      const isLastLayer = (currentLayer ?? 0) >= Math.max(0, (numLayers || 1) - 1);
      renderFFNConnectors(underlays, x, insideBottom, meta, isNew, i, {
        tagBackprop: isBackprop,
        // In training, we don't animate real layer switching, so tag both
        tagFirst: isBackprop ? true : isFirstLayer,
        tagLast: isBackprop ? true : isLastLayer,
      });

      if (ffnMeta.length === 0 || isNew) {
        const midY = (insideBottom.innerBottomY + meta.innerTopY) / 2;
        ffnProjectionCenterY = midY;
        meta.ffnProjectionCenterY = midY;
      }
    }

    ffnMeta.push(meta);
    maxFfnHeight = Math.max(maxFfnHeight, meta.height);
  });

  return { ffnMeta, maxFfnHeight, ffnProjectionCenterY };
}

// Helper: Render FFN connectors (lines + projection box)
function renderFFNConnectors(
  underlays,
  x,
  insideBottom,
  meta,
  isNew,
  tokenIdx,
  tagOptions = {},
  isMobile = false
) {
  const { tagBackprop = false, tagFirst = false, tagLast = false } = tagOptions || {};
  const inCenters = insideBottom.cellCentersX?.length ? insideBottom.cellCentersX : [x];
  const outCenters = meta.cellCentersX?.length ? meta.cellCentersX : [x];
  const lineCount = Math.min(inCenters.length, outCenters.length);

  const startY = insideBottom.innerBottomY ?? insideBottom.topY + insideBottom.height / 2;
  const endY = meta.innerTopY ?? meta.topY + meta.height / 2;
  const midY = (startY + endY) / 2;

  const boxSize = TRANSFORMER.PROJECTION_BOX_SIZE;
  const boxRadius = TRANSFORMER.PROJECTION_BOX_RADIUS;
  const boxTopY = midY - boxSize / 2;
  const boxBottomY = midY + boxSize / 2;

  // Incoming lines
  for (let k = 0; k < lineCount; k++) {
    const color = '#797b7dff';

    const inLine = underlays
      .append('line')
      .attr('class', `ffn-arrow-in ${isNew ? 'new-token' : 'prev-token'}`)
      .attr('x1', inCenters[k])
      .attr('y1', startY)
      .attr('x2', x)
      .attr('y2', boxTopY - 4)
      .style('stroke', color)
      .style('stroke-width', 0.5)
      .style('opacity', 0)
      .style('cursor', 'help');

    if (!isMobile) {
      inLine.attr('data-tooltip-id', 'viz-feedforward-tooltip');
    }

    if (tagBackprop) {
      const colorClass = (tokenIdx + k) % 2 === 0 ? 'green' : 'red';
      if (tagLast) inLine.classed(`bp-last-block-ffn-connection ${colorClass}`, true);
      if (tagFirst) inLine.classed(`bp-first-block-ffn-connection ${colorClass}`, true);
    }
  }

  // Projection box
  const projBox = underlays
    .append('rect')
    .attr('class', `projection-box ffn ${isNew ? 'new-token' : 'prev-token'}`)
    .attr('x', x - boxSize / 2)
    .attr('y', boxTopY)
    .attr('width', boxSize)
    .attr('height', boxSize)
    .attr('rx', boxRadius)
    .style('fill', '#cad0ceff')
    .style('opacity', 0)
    .style('cursor', 'help');

  if (!isMobile) {
    projBox.attr('data-tooltip-id', 'viz-feedforward-tooltip');
  }

  // Outgoing lines
  for (let k = 0; k < lineCount; k++) {
    const color = '#797b7dff';

    const outLine = underlays
      .append('line')
      .attr('class', `ffn-arrow-out ${isNew ? 'new-token' : 'prev-token'}`)
      .attr('x1', x)
      .attr('y1', boxBottomY + 4)
      .attr('x2', outCenters[k])
      .attr('y2', endY)
      .style('stroke', color)
      .style('stroke-width', 0.5)
      .style('opacity', 0)
      .style('cursor', 'help');

    if (!isMobile) {
      outLine.attr('data-tooltip-id', 'viz-feedforward-tooltip');
    }

    if (tagBackprop) {
      const colorClass = (tokenIdx + k * 3) % 2 === 0 ? 'green' : 'red';
      if (tagLast) outLine.classed(`bp-last-block-ffn-connection ${colorClass}`, true);
      if (tagFirst) outLine.classed(`bp-first-block-ffn-connection ${colorClass}`, true);
    }
  }
}

// Helper: Draw positional guides for second+ layer
function drawPositionalGuides(backUnderlays, currentLayer, tokensLayoutRef, columnsMeta) {
  if (currentLayer === 0) return;

  const storedMarkers = tokensLayoutRef.current?.posMarkers || [];

  storedMarkers.forEach((marker, i) => {
    if (!marker) return;

    const outerCol = columnsMeta[i];
    if (!outerCol) return;

    const x = marker.x;
    const startY = (outerCol.bottomY ?? outerCol.topY + outerCol.height) + 4;
    const my = marker.y;

    backUnderlays
      .append('line')
      .attr('x1', x)
      .attr('y1', startY)
      .attr('x2', x)
      .attr('y2', my + TRANSFORMER_ARROWS.ARROW_BACK_OFFSET)
      .attr('class', 'positional-through-arrow')
      .style('stroke', TRANSFORMER_ARROWS.POSITIONAL_STROKE)
      .style('stroke-width', TRANSFORMER_ARROWS.POSITIONAL_WIDTH)
      .style('opacity', TRANSFORMER_ARROWS.POSITIONAL_OPACITY);
  });
}

// Helper: Render transformer box with shadows
function renderTransformerBox(
  group,
  validXs,
  blockTopY,
  blockBottomY,
  numLayers,
  columnsMeta = [],
  isMobile = false
) {
  // Calculate proper bounds using column metadata (which includes token widths)
  // If columnsMeta is available, use it to get the actual left and right edges
  let minX, maxX;

  if (columnsMeta && columnsMeta.length > 0) {
    // Filter out gap columns (which have null values)
    const validColumns = columnsMeta.filter((col) => col !== null && col.centerX !== undefined);
    if (validColumns.length > 0) {
      // Get leftmost and rightmost token edges
      const leftmost = validColumns[0];
      const rightmost = validColumns[validColumns.length - 1];

      minX = leftmost.centerX - (leftmost.width || 0) / 2;
      maxX = rightmost.centerX + (rightmost.width || 0) / 2;
    } else {
      // Fallback to validXs if columnsMeta doesn't have valid data
      minX = Math.min(...validXs);
      maxX = Math.max(...validXs);
    }
  } else {
    // Fallback to validXs
    minX = Math.min(...validXs);
    maxX = Math.max(...validXs);
  }

  const totalShadows = Math.min(TRANSFORMER.MAX_SHADOWS, Math.max(0, (numLayers || 1) - 1));

  // Shadow layers
  for (let s = totalShadows; s >= 1; s--) {
    const offsetX = s * TRANSFORMER.STACK_OFFSET_X;
    const offsetY = s * TRANSFORMER.STACK_OFFSET_Y;

    const shadowGroup = group
      .insert('g', '.inside-top-embeddings')
      .attr('class', `transformer-shadow-layer layer-${s}`)
      .attr('transform', `translate(${offsetX}, ${offsetY})`);

    const shadowRect = shadowGroup
      .append('rect')
      .attr('x', minX - TRANSFORMER.SHADOW_PADDING)
      .attr('y', blockTopY)
      .attr('width', maxX + TRANSFORMER.SHADOW_PADDING - (minX - TRANSFORMER.SHADOW_PADDING))
      .attr('height', blockBottomY - blockTopY)
      .attr('rx', TRANSFORMER_BOX.BORDER_RADIUS)
      .attr('class', 'transformer-shadow-box')
      .style('fill', 'var(--viz-transformer-bg)')
      .style('stroke', 'var(--viz-transformer-border)')
      .style('stroke-width', TRANSFORMER_BOX.STROKE_WIDTH)
      .style('cursor', 'help')
      .style('pointer-events', 'none');

    if (!isMobile) {
      shadowRect.attr('data-tooltip-id', 'viz-transformer-shadow-tooltip');
    }
  }

  // Main transformer box
  const mainBox = group
    .insert('rect', '.inside-top-embeddings')
    .attr('x', minX - TRANSFORMER.SHADOW_PADDING)
    .attr('y', blockTopY)
    .attr('width', maxX + TRANSFORMER.SHADOW_PADDING - (minX - TRANSFORMER.SHADOW_PADDING))
    .attr('height', blockBottomY - blockTopY)
    .attr('rx', TRANSFORMER_BOX.BORDER_RADIUS)
    .attr('class', 'viz-transformer-box')
    .style('fill', 'var(--viz-transformer-bg)')
    .style('stroke', 'var(--viz-transformer-border)')
    .style('stroke-width', TRANSFORMER_BOX.STROKE_WIDTH)
    .style('cursor', 'help')
    .style('pointer-events', 'none');

  if (!isMobile) {
    mainBox.attr('data-tooltip-id', 'viz-transformer-box-tooltip');
  }

  // Ensure positional guide lines sit behind the transformer box
  try {
    const backUnderlaysNode = group.select('.positional-underlays-back').node();
    if (backUnderlaysNode) {
      group.insert(() => backUnderlaysNode, '.viz-transformer-box');
    }
  } catch {
    // Ignore if insertion fails
  }

  // Ensure underlays (arrows/lines) sit above the transformer box and shadows,
  // but still below the inside vectors by placing them just before inside-top group.
  try {
    const underlaysNode = group.select('.transformer-underlays').node();
    if (underlaysNode) {
      group.insert(() => underlaysNode, '.inside-top-embeddings');
    }
  } catch {
    // non-fatal: if insert fails, leave as-is
  }
}
