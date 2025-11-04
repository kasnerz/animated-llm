/**
 * Render functions for visualization layers
 * These are extracted from VisualizationCanvas but remain imperative D3-style
 * to minimize refactoring risk while improving modularity
 */
import * as d3 from 'd3';
import { getTokenColor, getVectorBoxColors, getVectorTextColor } from '../core/colors';
import { drawArrow, verticalThenHorizontalRoundedPath } from '../core/draw';
import { processTokenForVisualization } from '../../utils/tokenProcessing';

/**
 * Render tokens layer
 * @param {d3.Selection} group - D3 group selection
 * @param {Object} step - Current generation step
 * @param {Object} layout - Layout configuration
 * @param {number} width - Canvas width
 * @param {boolean} shouldCollapse - Whether to collapse tokens
 * @param {number} maxVisibleTokens - Max visible tokens when collapsed
 * @param {Object} tokensLayoutRef - Ref to store layout metadata
 * @returns {Object} Layout metadata
 */
export function renderTokensLayer(
  group,
  step,
  layout,
  width,
  shouldCollapse,
  maxVisibleTokens,
  tokensLayoutRef
) {
  const tokens = step.tokens;
  const lastActualIndex = tokens.length - 1;
  let visibleTokens = tokens;
  let tokenIndices = tokens.map((_, i) => i);

  // If collapsed, show only first few and last few tokens
  if (shouldCollapse) {
    const edgeCount = Math.floor(maxVisibleTokens / 2);
    const leftTokens = tokens.slice(0, edgeCount);
    const rightTokens = tokens.slice(-edgeCount);
    const leftIndices = tokenIndices.slice(0, edgeCount);
    const rightIndices = tokenIndices.slice(-edgeCount);

    visibleTokens = [...leftTokens, '...', ...rightTokens];
    tokenIndices = [...leftIndices, -1, ...rightIndices]; // -1 for ellipsis
  }

  // Compute dynamic widths based on token length
  const minBox = 36;
  const horizPadding = 16;
  const gap = 70; // increased spacing so horizontal embedding rows fit comfortably
  const widths = visibleTokens.map((tok) =>
    tok === '...'
      ? 24
      : Math.max(minBox, processTokenForVisualization(tok).length * 10 + horizPadding)
  );
  const contentWidth = widths.reduce((a, b) => a + b, 0) + gap * (visibleTokens.length - 1);
  const minMargin = layout?.margin ?? 0;
  const leftBias = layout?.leftBias || 0; // shift content a bit to the left when space allows
  const startX = Math.max(minMargin, (width - contentWidth) / 2 - leftBias);

  // Precompute center positions for each visible token
  const positions = [];
  let cursor = startX;
  widths.forEach((w) => {
    positions.push(cursor + w / 2);
    cursor += w + gap;
  });

  // Save for other renderers
  tokensLayoutRef.current = {
    positions,
    widths,
    visibleIndices: tokenIndices,
    gap,
    shouldCollapse,
  };

  visibleTokens.forEach((token, i) => {
    const actualIndex = tokenIndices[i];
    const x = positions[i];
    const isNew = actualIndex === lastActualIndex;
    const tokenG = group
      .append('g')
      .attr('class', `token ${isNew ? 'new-token' : 'prev-token'}`)
      .attr('transform', `translate(${x}, ${layout.tokenY})`);

    // Skip ellipsis rendering
    if (token === '...') {
      return;
    }

    const estimatedWidth = widths[i];
    const tokenColor = getTokenColor(actualIndex);

    // Token box (white background, no border)
    tokenG
      .append('rect')
      .attr('x', -estimatedWidth / 2)
      .attr('y', -22)
      .attr('width', estimatedWidth)
      .attr('height', 44)
      .attr('rx', 8)
      .attr('class', 'token-box')
      .style('fill', 'transparent')
      .style('stroke', 'none');

    // Token text
    tokenG
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('y', 6)
      .attr('class', 'token-text')
      .style('font-size', '18px')
      .style('font-family', '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif')
      .style('font-weight', '500')
      .style('fill', 'var(--viz-token-text)')
      .text(processTokenForVisualization(token));

    // Colored heavy underline
    tokenG
      .append('line')
      .attr('x1', -estimatedWidth / 2 + 8)
      .attr('y1', 18)
      .attr('x2', estimatedWidth / 2 - 8)
      .attr('y2', 18)
      .attr('class', 'token-underline')
      .style('stroke', tokenColor)
      .style('stroke-width', 6)
      .style('stroke-linecap', 'round');

    // Arrow from token to ID
    const arrowG = tokenG
      .append('g')
      .attr('class', `token-id-arrow ${isNew ? 'new-token' : 'prev-token'}`);
    arrowG
      .append('line')
      .attr('x1', 0)
      .attr('y1', 26)
      .attr('x2', 0)
      .attr('y2', 52)
      .style('stroke', '#ccc')
      .style('stroke-width', 1.5)
      .style('opacity', 0.7);

    arrowG
      .append('polygon')
      .attr('points', `0,52 -4,46 4,46`)
      .style('fill', '#ccc')
      .style('opacity', 0.7);

    // Token ID
    tokenG
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('y', 72)
      .attr('class', `token-id ${isNew ? 'new-token' : 'prev-token'}`)
      .style('font-size', '20px')
      .style('fill', 'var(--text-secondary)')
      .text(step.token_ids[actualIndex]);
  });

  // Ellipsis rendering removed - now using collapse toggle button instead
  // The button with arrows is positioned between tokens and embeddings

  return { positions, widths, visibleIndices: tokenIndices };
}

/**
 * Draw embedding column helper
 */
function drawEmbeddingColumnInternal(
  group,
  centerX,
  topY,
  values,
  expanded,
  tokenColor,
  className,
  isDarkMode
) {
  // Horizontal mini-vector (3 values) replacing vertical column
  const cellWidth = 26;
  const cellHeight = 18;
  const gap = 6;
  const paddingX = 6;
  const paddingY = 6;

  const displayValues = (values || []).slice(0, 3);
  const n = displayValues.length || 3;
  const width = n * cellWidth + (n - 1) * gap + paddingX * 2;
  const height = cellHeight + paddingY * 2;
  const leftX = centerX - width / 2;

  const colG = group.append('g').attr('class', `embedding-col ${className}`);

  // Centralized theme-aware colors for box
  const { fill: outerFill, stroke: outerStroke } = getVectorBoxColors(tokenColor, {
    isDarkMode,
  });

  colG
    .append('rect')
    .attr('x', leftX)
    .attr('y', topY)
    .attr('width', width)
    .attr('height', height)
    .attr('rx', 8)
    .style('fill', outerFill)
    .style('stroke', outerStroke);

  displayValues.forEach((v, i) => {
    const x = leftX + paddingX + i * (cellWidth + gap);
    const cx = x + cellWidth / 2;
    const cy = topY + paddingY + cellHeight / 2;
    colG
      .append('rect')
      .attr('x', x)
      .attr('y', topY + paddingY)
      .attr('width', cellWidth)
      .attr('height', cellHeight)
      .attr('rx', 4)
      .style('fill', 'transparent');
    colG
      .append('text')
      .attr('x', cx)
      .attr('y', cy + 3)
      .attr('text-anchor', 'middle')
      .style('font-size', '10px')
      .style('fill', getVectorTextColor(!!isDarkMode))
      .text(typeof v === 'number' ? v.toFixed(1) : '');
  });

  const centerY = topY + height / 2;
  return { topY, bottomY: topY + height, height, width, centerX, centerY };
}

/**
 * Render outer embeddings layer
 */
export function renderOuterEmbeddingsLayer(
  group,
  step,
  layout,
  tokensLayoutRef,
  embeddingExpanded,
  setEmbeddingExpanded,
  computedEmbeddings,
  isDarkMode
) {
  // Underlays container to ensure arrows are behind vectors
  const underlays = group.append('g').attr('class', 'outer-underlays');

  const embeddingsOuter = computedEmbeddings?.outer || [];
  const { visibleIndices = [], positions = [] } = tokensLayoutRef.current || {};
  const lastActualIndex = (step.tokens || []).length - 1;

  const columnsMeta = [];
  let maxOuterHeight = 0;

  visibleIndices.forEach((actualIndex, i) => {
    const x = positions[i];
    if (actualIndex < 0) {
      columnsMeta.push(null);
      return;
    }
    const values = embeddingsOuter[actualIndex] || [];
    const expanded = !!embeddingExpanded[actualIndex];
    const tokenColor = getTokenColor(actualIndex);
    const isNew = actualIndex === lastActualIndex;

    const meta = drawEmbeddingColumnInternal(
      group,
      x,
      layout.embeddingY,
      values,
      expanded,
      tokenColor,
      isNew ? 'new-token' : 'prev-token',
      isDarkMode
    );

    // Arrow from token ID to embedding
    const arrowG = underlays
      .append('g')
      .attr('class', `id-to-emb-arrow ${isNew ? 'new-token' : 'prev-token'}`);
    const y1 = layout.tokenY + 82;
    const y2 = meta.topY + meta.height / 2; // connect to center of horizontal vector
    arrowG
      .append('line')
      .attr('x1', x)
      .attr('y1', y1)
      .attr('x2', x)
      .attr('y2', y2)
      .style('stroke', '#ccc')
      .style('stroke-width', 1.5)
      .style('opacity', 0.7);
    arrowG
      .append('polygon')
      .attr('points', `${x},${y2} ${x - 4},${y2 - 6} ${x + 4},${y2 - 6}`)
      .style('fill', '#ccc')
      .style('opacity', 0.7);

    columnsMeta.push(meta);
    maxOuterHeight = Math.max(maxOuterHeight, meta.height);
  });

  const validXs = positions.filter((_, i) => visibleIndices[i] >= 0);
  const startX = Math.min(...validXs);
  const endX = Math.max(...validXs);
  const totalWidth = endX - startX;
  const afterEmbY = layout.embeddingY + maxOuterHeight;

  return { columnsMeta, maxOuterHeight, startX, totalWidth, afterEmbY };
}

/**
 * Render transformer block layer (inside top embeddings, attention mash, inside bottom embeddings)
 * Now supports multiple stacked transformer layers with card-style offset
 * @returns {Object} { blockTopY, blockBottomY, insideBottomMeta }
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
  isDarkMode = null
  // numLayers is passed but not currently used - kept for future enhancements
) {
  // Expose current layer and total layers to the DOM so the animation layer can infer state
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
  const blockTopY = afterOuterBottom + 40;

  // Card stack offset: each previous layer is offset to the top-right (behind the active card)
  const stackOffsetX = 8;
  const stackOffsetY = -8;

  // First, calculate the full block dimensions so we can render shadows with correct height
  const insideTopY = blockTopY + layout.blockPadding;

  const embTop = computedEmbeddings?.insideTop || [];
  const embBottom = computedEmbeddings?.insideBottom || [];
  const embFfn = computedEmbeddings?.ffn || [];

  // Calculate heights for all sections to determine total block height
  let estimatedInsideTopHeight = 0;
  let estimatedInsideBottomHeight = 0;
  let estimatedFfnHeight = 0;

  // Quick pass to calculate heights
  visibleIndices.forEach((actualIndex) => {
    if (actualIndex < 0) return;
    const vals = embTop[actualIndex] || [];
    // Approximate height calculation (each cell is ~16px + 3px gap, plus padding)
    const cellCount = vals.length > 4 ? 5 : vals.length; // collapsed view shows max 5 cells
    const approximateHeight = cellCount * 16 + (cellCount - 1) * 3 + 12;
    estimatedInsideTopHeight = Math.max(estimatedInsideTopHeight, approximateHeight);
    estimatedInsideBottomHeight = Math.max(estimatedInsideBottomHeight, approximateHeight);
    estimatedFfnHeight = Math.max(estimatedFfnHeight, approximateHeight);
  });

  const attentionHeight = 60;
  const ffnArrowGap = 80; // Increased from 60 to 80 for longer arrows
  // Calculate estimated block height (not currently used but kept for future layout calculations)
  const _totalBlockHeight =
    layout.blockPadding +
    estimatedInsideTopHeight +
    attentionHeight +
    estimatedInsideBottomHeight +
    ffnArrowGap +
    estimatedFfnHeight +
    layout.blockPadding;

  // Prepare common geometry for shadows (we will insert them later once final height is known)
  const minX = Math.min(...validXs);
  const maxX = Math.max(...validXs);
  const shadowPadding = 60;
  const totalShadows = Math.min(3, Math.max(0, (numLayers || 1) - 1));

  // Underlays container inside transformer for arrows/lines to appear behind vectors
  const underlays = group.append('g').attr('class', 'transformer-underlays');

  // Render the current active layer
  const insideTopGroup = group.append('g').attr('class', 'inside-top-embeddings');
  const insideTopMeta = [];
  let maxInsideTopHeight = 0;
  // Collect feedback arrowhead positions to draw on top of vectors later
  const feedbackArrowheads = [];
  visibleIndices.forEach((actualIndex, i) => {
    const x = positions[i];
    if (actualIndex < 0) {
      insideTopMeta.push(null);
      return;
    }
    const vals = embTop[actualIndex] || [];
    const tokenColor = getTokenColor(actualIndex);
    const isNew = actualIndex === step.tokens?.length - 1;
    const meta = drawEmbeddingColumnInternal(
      insideTopGroup,
      x,
      insideTopY,
      vals,
      false,
      tokenColor,
      isNew ? 'new-token' : 'prev-token',
      isDarkMode
    );
    insideTopMeta.push(meta);
    maxInsideTopHeight = Math.max(maxInsideTopHeight, meta.height);

    // Arrow from outer embedding or previous layer to inside top
    if (currentLayer === 0) {
      // First layer: arrow comes from outer embeddings
      const outerCol = columnsMeta[i];
      if (outerCol) {
        drawArrow(
          underlays,
          x,
          outerCol.topY + outerCol.height / 2,
          x,
          meta.topY + meta.height / 2,
          {
            className: `outer-to-block-arrow ${isNew ? 'new-token' : 'prev-token'}`,
          }
        );
      }
    } else {
      // Subsequent layers: draw a U-shaped feedback arrow that appears to emerge from the
      // previous stack (shifted to the right) and feeds into the current top embeddings.
      const startX = x + stackOffsetX; // align with immediate previous layer's horizontal shift
      const startY = blockTopY - 6; // start just above the box so the tail looks hidden below
      const endX = x;
      // End exactly at the middle of the TOP edge of the top embedding vector
      const endYTop = meta.topY; // top edge of the horizontal vector
      const lift = 28; // how far above the box the U-curve rises

      // U-shaped cubic bezier: up from startX, arc over towards endX, then down to just above the top edge
      const d = `M ${startX},${startY}
        C ${startX},${blockTopY - lift} ${endX},${blockTopY - lift} ${endX},${endYTop - 2}`;

      underlays
        .append('path')
        .attr('d', d)
        .attr('class', `shadow-to-block-arrow ${isNew ? 'new-token' : 'prev-token'}`)
        .style('fill', 'none')
        .style('stroke', '#c0c0c0')
        .style('stroke-width', 1.5)
        .style('opacity', 0.9);

      // Record arrowhead position to draw above the vectors
      feedbackArrowheads.push({ x: endX, y: endYTop, isNew });
    }
  });

  // Draw feedback arrowheads on top of the top embeddings so they remain visible
  if (feedbackArrowheads.length) {
    const overlays = group.append('g').attr('class', 'transformer-overlays');
    feedbackArrowheads.forEach(({ x, y, isNew }) => {
      // Downward-pointing triangle with tip touching the top edge center
      const size = 6;
      overlays
        .append('polygon')
        .attr('points', `${x},${y} ${x - size},${y - size * 1.4} ${x + size},${y - size * 1.4}`)
        .attr('class', `feedback-arrowhead ${isNew ? 'new-token' : 'prev-token'}`)
        .style('fill', '#c0c0c0')
        .style('opacity', 0.95);
    });
  }

  const attentionStartY = insideTopY + maxInsideTopHeight;
  const insideBottomY = attentionStartY + 40;

  const insideBottomGroup = group.append('g').attr('class', 'inside-bottom-embeddings');
  const insideBottomMeta = [];
  let maxInsideBottomHeight = 0;
  visibleIndices.forEach((actualIndex, i) => {
    const x = positions[i];
    if (actualIndex < 0) {
      insideBottomMeta.push(null);
      return;
    }
    const vals = embBottom[actualIndex] || [];
    const tokenColor = getTokenColor(actualIndex);
    const isNew = actualIndex === step.tokens?.length - 1;
    const meta = drawEmbeddingColumnInternal(
      insideBottomGroup,
      x,
      insideBottomY,
      vals,
      false,
      tokenColor,
      isNew ? 'new-token' : 'prev-token',
      isDarkMode
    );
    insideBottomMeta.push(meta);
    maxInsideBottomHeight = Math.max(maxInsideBottomHeight, meta.height);
  });

  // Render attention connections between top and bottom embeddings
  const attentionGroup = underlays.append('g').attr('class', 'attention-mash');
  const centers = insideTopMeta.map((m) => (m ? { x: m.centerX } : null));
  centers.forEach((a, i) => {
    if (!a) return;
    centers.forEach((b, j) => {
      if (!b || i === j) return;
      const s = Math.abs(Math.sin((i * 37 + j * 17) * 12.9898)) % 1;
      // Use lighter grey colors with less variation
      const color = d3.interpolateRgb('#E5E7EB', '#797b7dff')(s);
      // Use minimal line width
      const width = 0.5;
      // Keep opacity light
      const opacity = 0.3 + s * 0.15;
      attentionGroup
        .append('line')
        .attr('x1', a.x)
        .attr('y1', insideTopMeta[i].topY + insideTopMeta[i].height / 2)
        .attr('x2', b.x)
        .attr('y2', insideBottomMeta[j].topY + insideBottomMeta[j].height / 2)
        .style('stroke', color)
        .style('stroke-width', width)
        .style('opacity', opacity);
    });
  });

  // Add FFN embeddings (output embeddings after feed forward) inside the transformer block
  const ffnY = insideBottomY + maxInsideBottomHeight + 60; // slightly reduced to compact block
  const ffnGroup = group.append('g').attr('class', 'inside-ffn-embeddings');
  const ffnMeta = [];
  let maxFfnHeight = 0;

  visibleIndices.forEach((actualIndex, i) => {
    const x = positions[i];
    if (actualIndex < 0) {
      ffnMeta.push(null);
      return;
    }
    const vals = embFfn[actualIndex] || [];
    const tokenColor = getTokenColor(actualIndex);
    const isNew = actualIndex === step.tokens?.length - 1;
    const meta = drawEmbeddingColumnInternal(
      ffnGroup,
      x,
      ffnY,
      vals,
      false,
      tokenColor,
      isNew ? 'new-token' : 'prev-token',
      isDarkMode
    );
    const insideBottom = insideBottomMeta[i];
    if (insideBottom && meta) {
      drawArrow(
        underlays,
        x,
        insideBottom.topY + insideBottom.height / 2,
        x,
        meta.topY + meta.height / 2,
        {
          withBox: true,
          className: `ffn-arrow ${isNew ? 'new-token' : 'prev-token'}`,
        }
      );
    }
    ffnMeta.push(meta);
    maxFfnHeight = Math.max(maxFfnHeight, meta.height);
  });

  const blockBottomY = ffnY + maxFfnHeight + layout.blockPadding;

  // Insert shadow layers now with the correct final height, behind the main box and inner content
  for (let s = totalShadows; s >= 1; s--) {
    const offsetX = s * stackOffsetX;
    const offsetY = s * stackOffsetY;

    const shadowGroup = group
      .insert('g', '.inside-top-embeddings')
      .attr('class', `transformer-shadow-layer layer-${s}`)
      .attr('transform', `translate(${offsetX}, ${offsetY})`);

    shadowGroup
      .append('rect')
      .attr('x', minX - shadowPadding)
      .attr('y', blockTopY)
      .attr('width', maxX + shadowPadding - (minX - shadowPadding))
      .attr('height', blockBottomY - blockTopY)
      .attr('rx', 10)
      .attr('class', 'transformer-shadow-box')
      .style('fill', 'var(--viz-transformer-bg)')
      .style('stroke', 'var(--viz-transformer-border)')
      .style('stroke-width', 2);
  }

  // Render the main transformer box with same style as shadows.
  // Insert it just before the inside content so it's above shadows but below inner elements.
  group
    .insert('rect', '.inside-top-embeddings')
    .attr('x', Math.min(...validXs) - 60)
    .attr('y', blockTopY)
    .attr('width', Math.max(...validXs) + 60 - (Math.min(...validXs) - 60))
    .attr('height', blockBottomY - blockTopY)
    .attr('rx', 10)
    .attr('class', 'transformer-box')
    .style('fill', 'var(--viz-transformer-bg)')
    .style('stroke', 'var(--viz-transformer-border)')
    .style('stroke-width', 2);

  // Ensure underlays (arrows/lines) sit above the transformer box and shadows,
  // but still below the inside vectors by placing them just before inside-top group.
  try {
    group.insert(() => underlays.node(), '.inside-top-embeddings');
  } catch {
    // non-fatal: if insert fails, leave as-is
  }

  // Add stack size label (e.g., "Nx") at bottom right of the top block; hidden until reveal step.
  const boxRightX = maxX + 60;
  group
    .append('text')
    .attr('x', boxRightX + 14)
    .attr('y', blockBottomY + 6)
    .attr('class', 'transformer-stack-label')
    .style('font-size', '14px')
    .style('font-weight', '600')
    .style('fill', 'var(--text-tertiary)')
    .text(`${Math.max(1, numLayers || 1)}x`);

  const attentionCenterY = attentionStartY + 20; // middle of attention gap
  return {
    blockTopY,
    blockBottomY,
    insideBottomMeta: ffnMeta,
    ffnY,
    // expose geometry for precise label alignment
    insideTopY,
    maxInsideTopHeight,
    insideBottomY,
    maxInsideBottomHeight,
    maxFfnHeight,
    attentionCenterY,
  };
}

/**
 * Render outside bottom embeddings (now simplified, no FFN arrows since they're inside the block)
 * @returns {Object} bottom info
 */
// Outside bottom embeddings layer removed — we now project directly from the FFN layer inside the block

// Local helper: rich horizontal vector with centers and optional logprob styling
function drawHorizontalVectorRich(group, centerX, topY, values, opts = {}) {
  const {
    className = '',
    tokenColor = '#ddd',
    bgFill = null,
    format,
    isLogprob = false,
    ellipsisLast = false,
    isDarkMode: darkFlag = null,
  } = opts;
  const g = group.append('g').attr('class', className);
  const n = values.length;

  const cellWidth = isLogprob ? 60 : 26; // 54 * 1.2 ≈ 65 for ~20% wider logprob vector
  const cellHeight = isLogprob ? 24 : 18; // Reduced from 36 to 24
  const gap = isLogprob ? 9 : 6; // Increased from 8 to 10 for ~20% more spacing between cells
  const fontSize = '10px'; // Same font size for both, keep larger gaps for logprob to align with bars

  const width = n * cellWidth + (n - 1) * gap + 12;
  const leftX = centerX - width / 2 + 6;
  const centers = [];

  // Resolve dark mode from opts if provided, avoid DOM reads to prevent lag on first toggle
  const isDarkMode = !!darkFlag;
  // Background and stroke from centralized helper
  const colors = bgFill
    ? { fill: bgFill, stroke: getVectorBoxColors(tokenColor, { isDarkMode }).stroke }
    : getVectorBoxColors(tokenColor, { isDarkMode });

  g.append('rect')
    .attr('x', leftX - 6)
    .attr('y', topY)
    .attr('width', width)
    .attr('height', cellHeight + 12)
    .attr('rx', 10)
    .style('fill', colors.fill)
    .style('stroke', colors.stroke);

  values.forEach((v, i) => {
    const x = leftX + i * (cellWidth + gap);
    const cx = x + cellWidth / 2;
    centers.push(cx);
    g.append('rect')
      .attr('x', x)
      .attr('y', topY + 6)
      .attr('width', cellWidth)
      .attr('height', cellHeight)
      .attr('rx', 4)
      .style('fill', 'transparent');

    const isLastAndEllipsis = ellipsisLast && i === n - 1;
    g.append('text')
      .attr('x', cx)
      .attr('y', topY + 6 + cellHeight / 2 + (isLogprob ? 6 : 3))
      .attr('text-anchor', 'middle')
      .style('font-size', isLastAndEllipsis ? '16px' : fontSize)
      .style('font-weight', 'normal') // Same weight for both vectors
      .style('fill', getVectorTextColor(isDarkMode))
      .text(
        isLastAndEllipsis ? '⋯' : format ? format(v) : typeof v === 'number' ? v.toFixed(1) : ''
      );
  });

  return { topY, bottomY: topY + cellHeight + 12, centers, width, cellWidth };
}

/**
 * Render output distribution below bottom embeddings
 */
export function renderOutputLayer(
  group,
  step,
  layout,
  width,
  svgRoot,
  bottomInfo,
  subStep,
  computedEmbeddings,
  contentCenterX, // optional: center alignment override
  isDarkMode
) {
  const candidates = step.output_distribution?.candidates || [];

  const rm = bottomInfo.rightmostMeta;
  // Use the actual token index passed from the layout (not the visible column index)
  const rightmostActualIndex = bottomInfo.rightmostActualIndex ?? -1;
  const tokenColor = rightmostActualIndex >= 0 ? getTokenColor(rightmostActualIndex) : '#999';
  // Use the same interpolation settings as embedding columns for exact shade match
  const baseBox = getVectorBoxColors(tokenColor, {
    isDarkMode,
  });
  const baseFill = baseBox.fill;
  const baseStroke = baseBox.stroke;

  const horizY = bottomInfo.afterBottomY + 20;
  const horizCenterX = contentCenterX != null ? contentCenterX : width / 2;

  const mainRoot = d3.select(svgRoot).select('g.visualization-main');
  const extractionBg = mainRoot
    .insert('g', '.bottom-embedding-group')
    .attr('class', 'extraction-bg-layer');

  // Note: we now draw the path to the horizontal vector AFTER we know its geometry (hv1 below)

  const underlays = group.append('g').attr('class', 'output-underlays');

  let hv1 = null;
  if (subStep >= 6) {
    const extracted = extractionBg.append('g').attr('class', 'extracted-embedding');
    if (rm) {
      extracted
        .append('rect')
        .attr('x', rm.centerX - rm.width / 2)
        .attr('y', rm.topY)
        .attr('width', rm.width)
        .attr('height', rm.height)
        .attr('rx', 4)
        .style('fill', baseFill)
        .style('stroke', baseStroke);
      // Align the moving (dummy) rectangle with the horizontal vector center
      // Horizontal vector background height in drawHorizontalVectorRich() is (cellHeight + 12) where cellHeight=18
      const targetHalfHeight = (18 + 12) / 2; // 15px
      const dx = horizCenterX - rm.centerX;
      const dy = horizY + targetHalfHeight - (rm.topY + rm.height / 2);
      extracted.attr('data-dx', dx).attr('data-dy', dy);
    }
    const sampleValues = (computedEmbeddings?.ffn?.[rightmostActualIndex] || []).slice(0, 8);
    hv1 = drawHorizontalVectorRich(group, horizCenterX, horizY, sampleValues, {
      className: 'extracted-horizontal',
      tokenColor,
      bgFill: baseFill,
      isDarkMode,
    });

    // After hv1 exists, draw the extracted path arrow so it ENDS at hv1, not at the logprob vector.
    // Arrow starts below the dummy rectangle (rm.topY + rm.height) to stay below it after rotation.
    if (rm && hv1) {
      const startX = rm.centerX;
      const startY = rm.topY + rm.height + 4; // Below the dummy rectangle (not center)
      // Aim to the RIGHT side of the horizontal vector
      const hv1RightX = horizCenterX + hv1.width / 2;
      const hv1CenterY = horizY + 15; // matches target center used above
      const pathD = verticalThenHorizontalRoundedPath(startX, startY, hv1RightX, hv1CenterY, 20);
      extractionBg
        .append('path')
        .attr('d', pathD)
        .attr('class', 'extracted-path-arrow')
        .style('fill', 'none')
        .style('stroke', '#c0c0c0')
        .style('stroke-width', 1.5)
        .style('stroke-linecap', 'round')
        .style('stroke-linejoin', 'round')
        .style('opacity', 0.9);
    }
  }

  let hv2 = null;
  let logprobY = (hv1 ? hv1.bottomY : horizY + 36) + 60; // Increased from 28 to 60 for longer arrow with box
  const probs = candidates.map((c) => c.prob);
  if (subStep >= 8) {
    hv2 = drawHorizontalVectorRich(group, horizCenterX, logprobY, probs, {
      className: 'logprob-vector',
      tokenColor: '#2c6ec5ff',
      format: (v) => v.toFixed(2),
      isLogprob: true,
      ellipsisLast: true,
      isDarkMode,
    });
    if (hv1 && hv2) {
      drawArrow(underlays, horizCenterX, hv1.bottomY + 6, horizCenterX, hv2.topY - 8, {
        withBox: true,
        className: 'logprob-arrow',
      });
    }
  }

  if (subStep >= 9 && hv2) {
    // Draw arrows and labels below each probability value (except the last one which is ellipsis)
    const arrowStartY = hv2.bottomY + 8;
    const arrowEndY = arrowStartY + 18;
    const labelGap = 6;
    const labelSpacing = 20; // Gap between token and percentage labels

    // Skip the last cell (ellipsis) - only render arrows/labels for the first n-1 cells
    probs.slice(0, -1).forEach((p, i) => {
      const cx = hv2.centers[i];
      const token = candidates[i]?.token ?? '';
      const percentage = ((p ?? 0) * 100).toFixed(1) + '%';
      const isSelected = i === 0;

      // Draw arrow from vector cell to labels
      group
        .append('line')
        .attr('x1', cx)
        .attr('y1', arrowStartY)
        .attr('x2', cx)
        .attr('y2', arrowEndY)
        .attr('class', 'distribution-arrow')
        .style('stroke', '#999')
        .style('stroke-width', 1.5)
        .style('opacity', 0.7);

      // Arrowhead
      group
        .append('polygon')
        .attr('points', `${cx},${arrowEndY} ${cx - 4},${arrowEndY - 6} ${cx + 4},${arrowEndY - 6}`)
        .attr('class', 'distribution-arrow-head')
        .style('fill', '#999')
        .style('opacity', 0.7);

      // Token label (first) - truncate if too long to prevent overlap
      const displayToken = processTokenForVisualization(token);
      // Max width is cellWidth - small padding; approximate char width ~7px for 13px font
      const maxChars = Math.floor((hv2.cellWidth - 4) / 7);
      const truncatedToken =
        displayToken.length > maxChars
          ? displayToken.substring(0, maxChars - 1) + '…'
          : displayToken;

      group
        .append('text')
        .attr('x', cx)
        .attr('y', arrowEndY + labelGap + 10)
        .attr('text-anchor', 'middle')
        .attr('class', 'distribution-token-label')
        .style('font-size', '13px')
        .style('font-weight', isSelected ? '600' : 'normal')
        .style('fill', 'var(--viz-text-color)')
        .text(truncatedToken);

      // Percentage label (second)
      group
        .append('text')
        .attr('x', cx)
        .attr('y', arrowEndY + labelGap + 10 + labelSpacing)
        .attr('text-anchor', 'middle')
        .attr('class', 'distribution-percentage-label')
        .style('font-size', '12px')
        .style('font-weight', isSelected ? '600' : 'normal')
        .style('fill', 'var(--viz-muted-color)')
        .text(percentage);
    });

    // Add ellipsis label for the last cell, centered between token and percentage positions
    if (hv2.centers.length > 0) {
      const lastCx = hv2.centers[hv2.centers.length - 1];
      const tokenY = arrowEndY + labelGap + 10;
      const percentageY = arrowEndY + labelGap + 10 + labelSpacing;
      const ellipsisY = (tokenY + percentageY) / 2;

      group
        .append('text')
        .attr('x', lastCx)
        .attr('y', ellipsisY)
        .attr('text-anchor', 'middle')
        .attr('class', 'distribution-ellipsis-label')
        .style('font-size', '16px')
        .style('font-weight', 'normal')
        .style('fill', '#999')
        .text('⋯');
    }
  }

  // Return centers for alignment, when available
  const extractedCenterY = hv1 ? (hv1.topY + hv1.bottomY) / 2 : null;
  const logprobCenterY = hv2 ? (hv2.topY + hv2.bottomY) / 2 : null;
  return { extractedCenterY, logprobCenterY };
}

/**
 * Render stage labels on the right side of the visualization
 * @param {d3.Selection} group - D3 group selection
 * @param {Object} layout - Layout configuration with Y positions for each stage
 * @param {number} canvasWidth - Canvas width
 * @param {number} subStep - Current animation sub-step (0-9)
 * @param {Function} t - Translation function
 * @param {boolean} showGradual - If true, labels appear progressively by subStep; otherwise all visible at once and only the active highlight shifts
 */
// Place stage labels a fixed distance to the right of the content's right edge (anchorX)
export function renderStageLabels(group, layout, anchorX, subStep, t, showGradual = true) {
  // Prefer precise positions from layout.stageY when available
  const stageY = layout.stageY || {};
  const labels = [
    { key: 'stage_tokenization', y: stageY.stage_tokenization ?? layout.tokenY + 10, subStep: 0 },
    { key: 'stage_token_ids', y: stageY.stage_token_ids ?? layout.tokenY + 70, subStep: 1 },
    {
      key: 'stage_input_embeddings',
      y: stageY.stage_input_embeddings ?? layout.embeddingY + 30,
      subStep: 2,
    },
    {
      key: 'stage_attention_layer',
      y:
        stageY.stage_attention_layer ??
        (layout.attentionY != null ? layout.attentionY + 40 : null) ??
        layout.embeddingY + 220,
      subStep: 4,
    },
    {
      key: 'stage_feedforward_layer',
      y:
        stageY.stage_feedforward_layer ??
        (layout.ffnY != null ? layout.ffnY + 30 : null) ??
        layout.embeddingY + 280,
      subStep: 5,
    },
    {
      key: 'stage_last_embedding',
      y:
        stageY.stage_last_embedding ??
        (layout.extractedY != null ? layout.extractedY + 10 : null) ??
        layout.embeddingY + 430,
      subStep: 7,
    },
    {
      key: 'stage_output_probabilities',
      y:
        stageY.stage_output_probabilities ??
        (layout.outputY != null ? layout.outputY + 10 : null) ??
        layout.embeddingY + 530,
      subStep: 8,
    },
  ];

  // Position delimiter line at the right edge of the visualization canvas
  // In sticky layout, anchorX=0 so the line starts at the left edge of the panel
  const gapToLine = 20; // Small gap from panel edge to delimiter line
  const gapLineToLabel = 20; // Small gap from line to labels
  const verticalLineX = anchorX + gapToLine; // Delimiter acts as right edge of canvas
  const labelX = verticalLineX + gapLineToLabel; // Labels close to the delimiter
  const highlightWidth = 280;
  const highlightHeight = 54;

  // Draw vertical delimiter line
  group
    .append('line')
    .attr('x1', verticalLineX)
    .attr('y1', labels[0].y - 40)
    .attr('x2', verticalLineX)
    .attr('y2', labels[labels.length - 1].y + 40)
    .attr('class', 'stage-delimiter-line')
    .style('stroke', 'var(--viz-stage-line, #999)')
    .style('stroke-width', 1.5)
    .style('opacity', 0.4);

  labels.forEach((label) => {
    const isActive = subStep === label.subStep;
    const isVisible = showGradual ? subStep >= label.subStep : true;

    // Don't render labels that haven't appeared yet
    if (!isVisible) {
      return;
    }

    const opacity = isVisible ? 1 : 0.3;

    const labelGroup = group
      .append('g')
      .attr('class', `stage-label ${isActive ? 'active' : 'inactive'}`)
      .attr('transform', `translate(${labelX}, ${label.y})`);

    // Background highlight bar (darker background) - only for active label
    if (isActive) {
      labelGroup
        .append('rect')
        .attr('x', -10)
        .attr('y', -18)
        .attr('width', highlightWidth)
        .attr('height', highlightHeight)
        .attr('rx', 6)
        .style('fill', 'var(--viz-stage-highlight, rgba(0, 0, 0, 0.08))')
        .style('opacity', 0.6);
    }

    // Horizontal dotted line connecting label to the vertical delimiter
    group
      .append('line')
      .attr('x1', verticalLineX)
      .attr('y1', label.y)
      .attr('x2', labelX - 15)
      .attr('y2', label.y)
      .attr('class', 'stage-connector-line')
      .style('stroke', 'var(--viz-stage-line, #999)')
      .style('stroke-width', 1)
      .style('stroke-dasharray', '3,3')
      .style('opacity', isActive ? 0.6 : 0.3);

    // Label heading text (larger, bolder)
    labelGroup
      .append('text')
      .attr('x', 0)
      .attr('y', 0)
      .attr('class', 'stage-label-heading')
      .style('font-size', '17px')
      .style('font-weight', '600')
      .style('fill', isActive ? 'var(--text-primary, #333)' : 'var(--text-tertiary, #999)')
      .style('opacity', opacity)
      .style('font-family', '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif')
      .text(t(label.key));

    // Hint text below the label (smaller, lighter)
    labelGroup
      .append('text')
      .attr('x', 0)
      .attr('y', 16)
      .attr('class', 'stage-label-hint')
      .style('font-size', '11px')
      .style('font-weight', '400')
      .style('fill', 'var(--text-tertiary, #999)')
      .style('opacity', opacity * 0.8)
      .style('font-family', '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif')
      .text(t(`${label.key}_hint`));
  });
}
