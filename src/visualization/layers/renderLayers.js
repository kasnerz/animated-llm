/**
 * Render functions for visualization layers
 * These are extracted from VisualizationCanvas but remain imperative D3-style
 * to minimize refactoring risk while improving modularity
 */
import * as d3 from 'd3';
import { getTokenColor, getPurpleByProb } from '../core/colors';
import { drawArrow, rightAngleRoundedPath } from '../core/draw';

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

/**
 * Render transformer block layer (inside top embeddings, attention mash, inside bottom embeddings)
 * @returns {Object} { blockTopY, blockBottomY, insideBottomMeta }
 */
export function renderTransformerBlockLayer(group, step, layout, tokensLayoutRef, outerMeta) {
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
  const insideTopY = blockTopY + layout.blockPadding;

  const embeddings = step.embeddings;
  const insideTopGroup = group.append('g').attr('class', 'inside-top-embeddings');
  const insideTopMeta = [];
  let maxInsideTopHeight = 0;
  visibleIndices.forEach((actualIndex, i) => {
    const x = positions[i];
    if (actualIndex < 0) {
      insideTopMeta.push(null);
      return;
    }
    const vals = embeddings[actualIndex]?.values || [];
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
      {},
      () => {},
      actualIndex
    );
    insideTopMeta.push(meta);
    maxInsideTopHeight = Math.max(maxInsideTopHeight, meta.height);
    const outerCol = columnsMeta[i];
    if (outerCol) {
      drawArrow(group, x, outerCol.bottomY + 4, x, meta.topY - 8, {
        className: `outer-to-block-arrow ${isNew ? 'new-token' : 'prev-token'}`,
      });
    }
  });

  const attentionStartY = insideTopY + maxInsideTopHeight;
  const insideBottomY = attentionStartY + 60;
  const attentionGroup = group.append('g').attr('class', 'attention-mash');
  const centers = insideTopMeta.map((m) => (m ? { x: m.centerX } : null));
  centers.forEach((a, i) => {
    if (!a) return;
    centers.forEach((b, j) => {
      if (!b || i === j) return;
      const s = Math.abs(Math.sin((i * 37 + j * 17) * 12.9898)) % 1;
      const color = d3.interpolateRgb('#C5CBD3', '#9AA0A6')(s);
      const width = 0.6 + s * 2.0;
      const opacity = 0.25 + s * 0.25;
      attentionGroup
        .append('line')
        .attr('x1', a.x)
        .attr('y1', attentionStartY)
        .attr('x2', b.x)
        .attr('y2', insideBottomY)
        .style('stroke', color)
        .style('stroke-width', width)
        .style('opacity', opacity);
    });
  });

  const insideBottomGroup = group.append('g').attr('class', 'inside-bottom-embeddings');
  const insideBottomMeta = [];
  let maxInsideBottomHeight = 0;
  visibleIndices.forEach((actualIndex, i) => {
    const x = positions[i];
    if (actualIndex < 0) {
      insideBottomMeta.push(null);
      return;
    }
    const vals = embeddings[actualIndex]?.values || [];
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
      {},
      () => {},
      actualIndex
    );
    insideBottomMeta.push(meta);
    maxInsideBottomHeight = Math.max(maxInsideBottomHeight, meta.height);
  });

  const blockBottomY = insideBottomY + maxInsideBottomHeight + layout.blockPadding;

  group
    .insert('rect', ':first-child')
    .attr('x', Math.min(...validXs) - 60)
    .attr('y', blockTopY)
    .attr('width', Math.max(...validXs) + 60 - (Math.min(...validXs) - 60))
    .attr('height', blockBottomY - blockTopY)
    .attr('rx', 10)
    .attr('class', 'transformer-box')
    .style('fill', '#f3f4f6')
    .style('stroke', '#d9d9e3')
    .style('stroke-dasharray', '4 4');

  return { blockTopY, blockBottomY, insideBottomMeta };
}

/**
 * Render outside bottom embeddings and FFN arrows
 * @returns {Object} bottom info
 */
export function renderBottomEmbeddingsLayer(group, step, layout, tokensLayoutRef, blockMeta) {
  const { visibleIndices = [], positions = [] } = tokensLayoutRef.current || {};
  const embeddings = step.embeddings;
  const topY = blockMeta.blockBottomY + 40;

  let maxHeight = 0;
  const metas = [];
  visibleIndices.forEach((actualIndex, i) => {
    const x = positions[i];
    if (actualIndex < 0) return;
    const vals = embeddings[actualIndex]?.values || [];
    const tokenColor = getTokenColor(actualIndex);
    const insideBottom = blockMeta.insideBottomMeta[i];
    const isNew = actualIndex === step.tokens?.length - 1;
    if (insideBottom) {
      drawArrow(group, x, insideBottom.bottomY + 4, x, topY - 8, {
        withBox: true,
        className: `ffn-arrow ${isNew ? 'new-token' : 'prev-token'}`,
      });
    }
    const meta = drawEmbeddingColumnInternal(
      group,
      x,
      topY,
      vals,
      false,
      tokenColor,
      isNew ? 'new-token' : 'prev-token',
      {},
      () => {},
      actualIndex
    );
    metas[i] = meta;
    maxHeight = Math.max(maxHeight, meta.height);
  });

  let rightmostIdx = -1;
  for (let i = visibleIndices.length - 1; i >= 0; i--) {
    if (visibleIndices[i] >= 0) {
      rightmostIdx = i;
      break;
    }
  }
  const rightmostMeta = rightmostIdx >= 0 ? metas[rightmostIdx] : null;

  return { afterBottomY: topY + maxHeight, topY, maxHeight, metas, rightmostIdx, rightmostMeta };
}

// Local helper: rich horizontal vector with centers and optional logprob styling
function drawHorizontalVectorRich(group, centerX, topY, values, opts = {}) {
  const { className = '', tokenColor = '#ddd', bgFill = null, format, isLogprob = false } = opts;
  const g = group.append('g').attr('class', className);
  const n = values.length;

  const cellWidth = isLogprob ? 80 : 26;
  const cellHeight = isLogprob ? 36 : 18;
  const gap = isLogprob ? 12 : 6;
  const fontSize = isLogprob ? '18px' : '10px';

  const width = n * cellWidth + (n - 1) * gap + 12;
  const leftX = centerX - width / 2 + 6;
  const centers = [];

  const bg =
    bgFill ??
    d3.interpolateRgb(typeof tokenColor === 'string' ? tokenColor : '#ddd', '#ffffff')(0.85);
  g.append('rect')
    .attr('x', leftX - 6)
    .attr('y', topY)
    .attr('width', width)
    .attr('height', cellHeight + 12)
    .attr('rx', 10)
    .style('fill', bg)
    .style('stroke', '#e5e7eb');

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
    g.append('text')
      .attr('x', cx)
      .attr('y', topY + 6 + cellHeight / 2 + (isLogprob ? 6 : 3))
      .attr('text-anchor', 'middle')
      .style('font-size', fontSize)
      .style('font-weight', isLogprob ? '600' : 'normal')
      .style('fill', '#111')
      .text(format ? format(v) : typeof v === 'number' ? v.toFixed(1) : '');
  });

  return { topY, bottomY: topY + cellHeight + 12, centers, width, cellWidth };
}

/**
 * Render output distribution below bottom embeddings
 */
export function renderOutputLayer(group, step, layout, width, svgRoot, bottomInfo, subStep) {
  const candidates = step.output_distribution?.candidates || [];

  const rm = bottomInfo.rightmostMeta;
  let rightmostActualIndex = -1;
  for (let i = bottomInfo.metas.length - 1; i >= 0; i--) {
    if (bottomInfo.metas[i]) {
      rightmostActualIndex = i;
      break;
    }
  }
  const tokenColor = rightmostActualIndex >= 0 ? getTokenColor(rightmostActualIndex) : '#999';
  const baseFill = d3.interpolateRgb(tokenColor, '#ffffff')(0.7);
  const baseStroke = d3.interpolateRgb(tokenColor, '#ffffff')(0.5);

  const horizY = bottomInfo.afterBottomY + 20;
  const horizCenterX = width / 2;

  const mainRoot = d3.select(svgRoot).select('g.visualization-main');
  const extractionBg = mainRoot
    .insert('g', '.bottom-embedding-group')
    .attr('class', 'extraction-bg-layer');

  if (rm && subStep >= 6) {
    const startX = rm.centerX;
    const startY = rm.topY + rm.height / 2;
    const endX = horizCenterX;
    const endY = horizY + 12;
    const pathD = rightAngleRoundedPath(startX, startY, endX, endY, 20);
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
      const dx = horizCenterX - rm.centerX;
      const dy = horizY + rm.height / 2 - (rm.topY + rm.height / 2);
      extracted.attr('data-dx', dx).attr('data-dy', dy);
    }
    const sampleValues = (step.embeddings?.[rightmostActualIndex]?.values || []).slice(0, 8);
    hv1 = drawHorizontalVectorRich(group, horizCenterX, horizY, sampleValues, {
      className: 'extracted-horizontal',
      tokenColor,
      bgFill: baseFill,
    });
  }

  let hv2 = null;
  let logprobY = (hv1 ? hv1.bottomY : horizY + 36) + 28;
  const probs = candidates.map((c) => c.prob);
  if (subStep >= 7) {
    hv2 = drawHorizontalVectorRich(group, horizCenterX, logprobY, probs, {
      className: 'logprob-vector',
      tokenColor: '#8B5CF6',
      format: (v) => v.toFixed(2),
      isLogprob: true,
    });
    if (hv1 && hv2) {
      drawArrow(underlays, horizCenterX, hv1.bottomY + 6, horizCenterX, hv2.topY - 8, {
        withBox: true,
        className: 'logprob-arrow',
      });
    }
  }

  if (subStep >= 8 && hv2) {
    const maxBarHeight = 140;
    const barTopY = hv2.bottomY + 20;
    const barBaselineY = barTopY + maxBarHeight;

    probs.forEach((p, i) => {
      const cx = hv2.centers[i];
      const barH = (p ?? 0) * maxBarHeight;
      const bw = Math.max(40, hv2.cellWidth * 0.8);
      const color = getPurpleByProb(p ?? 0);
      const isSelected = i === 0;
      group
        .append('rect')
        .attr('x', cx - bw / 2)
        .attr('y', barBaselineY - barH)
        .attr('width', bw)
        .attr('height', barH)
        .attr('rx', 4)
        .attr('class', `distribution-bar ${isSelected ? 'selected' : ''}`)
        .style('fill', isSelected ? '#e11d48' : color);
    });

    const legendY = barBaselineY + 24;
    probs.forEach((p, i) => {
      const cx = hv2.centers[i];
      const token = candidates[i]?.token ?? '';
      const percentage = ((p ?? 0) * 100).toFixed(1) + '%';
      const isSelected = i === 0;
      group
        .append('text')
        .attr('x', cx)
        .attr('y', legendY)
        .attr('text-anchor', 'middle')
        .attr('class', 'distribution-token-label')
        .style('font-size', '18px')
        .style('font-weight', isSelected ? '700' : '600')
        .style('fill', isSelected ? '#e11d48' : '#333')
        .text(token);

      group
        .append('text')
        .attr('x', cx)
        .attr('y', legendY + 24)
        .attr('text-anchor', 'middle')
        .attr('class', 'distribution-percentage-label')
        .style('font-size', '16px')
        .style('font-weight', '500')
        .style('fill', isSelected ? '#e11d48' : '#666')
        .text(percentage);
    });
  }
}
