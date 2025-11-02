/**
 * Render functions for visualization layers
 * These are extracted from VisualizationCanvas but remain imperative D3-style
 * to minimize refactoring risk while improving modularity
 */
import * as d3 from 'd3';
import { getTokenColor } from '../core/colors';

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
  const gap = 24;
  const widths = visibleTokens.map((tok) =>
    tok === '...' ? 24 : Math.max(minBox, tok.length * 10 + horizPadding)
  );
  const contentWidth = widths.reduce((a, b) => a + b, 0) + gap * (visibleTokens.length - 1);
  const startX = (width - contentWidth) / 2;

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

    // Token box
    tokenG
      .append('rect')
      .attr('x', -estimatedWidth / 2)
      .attr('y', -22)
      .attr('width', estimatedWidth)
      .attr('height', 44)
      .attr('rx', 8)
      .attr('class', 'token-box')
      .style('fill', getTokenColor(actualIndex));

    // Token text
    tokenG
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('y', 6)
      .attr('class', 'token-text')
      .style('font-size', '18px')
      .style('font-family', '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif')
      .style('font-weight', '500')
      .style('fill', '#1a1a1a')
      .text(token);

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

  // Render ellipsis if collapsed
  if (shouldCollapse) {
    const edgeCount = Math.floor(maxVisibleTokens / 2);
    const ellipsisIndex = edgeCount;
    const ellipsisX = positions[ellipsisIndex];

    const ellipsisG = group
      .append('g')
      .attr('class', 'token token-ellipsis')
      .attr('transform', `translate(${ellipsisX}, ${layout.tokenY})`);
    ellipsisG
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('y', 72)
      .attr('class', 'token-id')
      .style('font-size', '20px')
      .style('fill', 'var(--text-tertiary)')
      .text('⋯');
  }

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
  embeddingExpanded,
  setEmbeddingExpanded,
  index
) {
  const cellSize = 16;
  const cellGap = 3;
  const padding = 6;

  let displayValues = values;
  if (!expanded && values.length > 4) {
    displayValues = [...values.slice(0, 2), null, ...values.slice(-2)];
  }
  const n = displayValues.length;
  const width = cellSize + padding * 2;
  const height = n * cellSize + (n - 1) * cellGap + padding * 2;
  const leftX = centerX - width / 2;

  const colG = group.append('g').attr('class', `embedding-col ${className}`);

  let outerFill = '#f2f3f5';
  let outerStroke = '#e0e0e0';
  if (tokenColor) {
    const lightenedColor = d3.interpolateRgb(tokenColor, '#ffffff')(0.7);
    outerFill = lightenedColor;
    outerStroke = d3.interpolateRgb(tokenColor, '#ffffff')(0.5);
  }

  colG
    .append('rect')
    .attr('x', leftX)
    .attr('y', topY)
    .attr('width', width)
    .attr('height', height)
    .attr('rx', 4)
    .style('fill', outerFill)
    .style('stroke', outerStroke);

  displayValues.forEach((v, i) => {
    const y = topY + padding + i * (cellSize + cellGap);
    if (v === null) {
      const ellG = colG.append('g');
      ellG
        .append('rect')
        .attr('x', centerX - cellSize / 2)
        .attr('y', y)
        .attr('width', cellSize)
        .attr('height', cellSize)
        .attr('rx', 2)
        .style('fill', '#e9eaed')
        .style('stroke', '#d0d0d0');
      ellG
        .append('text')
        .attr('x', centerX)
        .attr('y', y + cellSize / 2 + 3)
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('fill', '#9aa0a6')
        .text('⋯');
      ellG.style('cursor', 'pointer').on('click', () => {
        setEmbeddingExpanded((prev) => ({ ...prev, [index]: !prev[index] }));
      });
      return;
    }
    colG
      .append('rect')
      .attr('x', centerX - cellSize / 2)
      .attr('y', y)
      .attr('width', cellSize)
      .attr('height', cellSize)
      .attr('rx', 2)
      .style('fill', 'transparent')
      .style('stroke', 'none');

    colG
      .append('text')
      .attr('x', centerX)
      .attr('y', y + cellSize / 2 + 3)
      .attr('text-anchor', 'middle')
      .style('font-size', '9px')
      .style('fill', '#333')
      .text(typeof v === 'number' ? v.toFixed(1) : '');
  });

  return { topY, bottomY: topY + height, height, width, centerX };
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
  setEmbeddingExpanded
) {
  const embeddings = step.embeddings;
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
    const values = embeddings[actualIndex]?.values || [];
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
      embeddingExpanded,
      setEmbeddingExpanded,
      actualIndex
    );

    // Arrow from token ID to embedding
    const arrowG = group
      .append('g')
      .attr('class', `id-to-emb-arrow ${isNew ? 'new-token' : 'prev-token'}`);
    const y1 = layout.tokenY + 82;
    const y2 = layout.embeddingY - 4;
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
