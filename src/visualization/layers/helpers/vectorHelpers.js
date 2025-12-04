/**
 * Helper functions for drawing vectors and embeddings
 *
 * REUSABLE UTILITIES - View-agnostic
 * These helpers can be used across different views and visualization components
 */
import { getVectorBoxColors, getVectorTextColor } from '../../core/colors';
import { VECTOR } from '../../core/constants';

/**
 * Draw a horizontal mini-vector (compact 3-value display)
 * @param {d3.Selection} group - D3 group selection
 * @param {number} centerX - Center X position
 * @param {number} topY - Top Y position
 * @param {Array<number>} values - Vector values to display
 * @param {Object} options - Rendering options
 * @returns {Object} Geometry metadata
 */
export function drawEmbeddingColumn(group, centerX, topY, values, options = {}) {
  const { className = '', tokenColor = '#ddd', isDarkMode = false } = options;

  const cellWidth = VECTOR.CELL_WIDTH;
  const cellHeight = VECTOR.CELL_HEIGHT;
  const gap = VECTOR.GAP;
  const paddingX = VECTOR.PADDING_X;
  const paddingY = VECTOR.PADDING_Y;

  // For hidden state (embedding) preview, show first value, ellipsis, last value
  const hasValues = Array.isArray(values) && values.length > 0;
  const firstVal = hasValues ? values[0] : undefined;
  const lastVal = hasValues ? values[values.length - 1] : undefined;
  const displayValues = [firstVal, 'ELLIPSIS', lastVal];
  const n = 3; // always render three mini-cells
  const width = n * cellWidth + (n - 1) * gap + paddingX * 2;
  const height = cellHeight + paddingY * 2;
  const leftX = centerX - width / 2;

  const colG = group.append('g').attr('class', `embedding-col ${className}`);

  const { fill: outerFill, stroke: outerStroke } = getVectorBoxColors(tokenColor, { isDarkMode });

  colG
    .append('rect')
    .attr('x', leftX)
    .attr('y', topY)
    .attr('width', width)
    .attr('height', height)
    .attr('rx', VECTOR.BOX_RADIUS)
    .attr('data-tooltip-id', 'viz-embedding-tooltip')
    .style('fill', outerFill)
    .style('stroke', outerStroke)
    .style('cursor', 'help');

  const cellCentersX = [];
  displayValues.forEach((v, i) => {
    const x = leftX + paddingX + i * (cellWidth + gap);
    const cx = x + cellWidth / 2;
    const cy = topY + paddingY + cellHeight / 2;
    cellCentersX.push(cx);

    colG
      .append('rect')
      .attr('x', x)
      .attr('y', topY + paddingY)
      .attr('width', cellWidth)
      .attr('height', cellHeight)
      .attr('rx', VECTOR.CELL_RADIUS)
      .attr('data-tooltip-id', 'viz-embedding-tooltip')
      .style('fill', 'transparent')
      .style('cursor', 'help');

    const isEllipsis = v === 'ELLIPSIS';
    colG
      .append('text')
      .attr('x', cx)
      .attr('y', isEllipsis ? cy : cy + VECTOR.TEXT_Y_OFFSET)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', isEllipsis ? 'central' : 'auto')
      .attr('data-tooltip-id', 'viz-embedding-tooltip')
      .style('font-size', isEllipsis ? '16px' : VECTOR.TEXT_SIZE)
      .style('font-weight', 'normal')
      .style('fill', getVectorTextColor(isDarkMode))
      .style('cursor', 'help')
      .style('pointer-events', 'none')
      .text(isEllipsis ? '⋯' : typeof v === 'number' ? v.toFixed(1) : '');
  });

  const centerY = topY + height / 2;
  const innerTopY = topY + paddingY;
  const innerBottomY = topY + paddingY + cellHeight;

  return {
    topY,
    bottomY: topY + height,
    height,
    width,
    centerX,
    centerY,
    cellCentersX,
    innerTopY,
    innerBottomY,
  };
}

/**
 * Draw a horizontal vector with rich formatting (for extracted embeddings and logprobs)
 * @param {d3.Selection} group - D3 group selection
 * @param {number} centerX - Center X position
 * @param {number} topY - Top Y position
 * @param {Array<number>} values - Vector values to display
 * @param {Object} options - Rendering options
 * @returns {Object} Geometry metadata
 */
export function drawHorizontalVector(group, centerX, topY, values, options = {}) {
  const {
    className = '',
    tokenColor = '#ddd',
    bgFill = null,
    format,
    isLogprob = false,
    ellipsisLast = false,
    isDarkMode = false,
  } = options;

  const g = group.append('g').attr('class', className);
  const n = values.length;

  const cellWidth = isLogprob ? VECTOR.LOGPROB_CELL_WIDTH : VECTOR.CELL_WIDTH;
  const cellHeight = isLogprob ? VECTOR.LOGPROB_CELL_HEIGHT : VECTOR.CELL_HEIGHT;
  const gap = isLogprob ? VECTOR.LOGPROB_GAP : VECTOR.GAP;
  const fontSize = VECTOR.TEXT_SIZE;

  const width = n * cellWidth + (n - 1) * gap + 12;
  const leftX = centerX - width / 2 + 6;
  const centers = [];

  const colors = bgFill
    ? { fill: bgFill, stroke: getVectorBoxColors(tokenColor, { isDarkMode }).stroke }
    : getVectorBoxColors(tokenColor, { isDarkMode });

  const tooltipId =
    className === 'extracted-horizontal'
      ? 'viz-last-vector-tooltip'
      : isLogprob
        ? 'viz-probabilities-tooltip'
        : undefined;

  g.append('rect')
    .attr('x', leftX - 6)
    .attr('y', topY)
    .attr('width', width)
    .attr('height', cellHeight + 12)
    .attr('rx', isLogprob ? VECTOR.LOGPROB_BOX_RADIUS : VECTOR.BOX_RADIUS)
    .attr('data-tooltip-id', tooltipId)
    .style('fill', colors.fill)
    .style('stroke', colors.stroke)
    .style('cursor', tooltipId ? 'help' : 'default');

  values.forEach((v, i) => {
    const x = leftX + i * (cellWidth + gap);
    const cx = x + cellWidth / 2;
    centers.push(cx);

    g.append('rect')
      .attr('x', x)
      .attr('y', topY + 6)
      .attr('width', cellWidth)
      .attr('height', cellHeight)
      .attr('rx', VECTOR.CELL_RADIUS)
      .attr('data-tooltip-id', tooltipId)
      .style('fill', 'transparent')
      .style('cursor', tooltipId ? 'help' : 'default');

    const isLastAndEllipsis = ellipsisLast && i === n - 1;
    const isEllipsisValue = v === 'ELLIPSIS' || v === '...';
    const isEllipsis = isLastAndEllipsis || isEllipsisValue;
    const cy = topY + 6 + cellHeight / 2;
    g.append('text')
      .attr('x', cx)
      .attr('y', isEllipsis ? cy : cy + (isLogprob ? 6 : VECTOR.TEXT_Y_OFFSET))
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', isEllipsis ? 'central' : 'auto')
      .attr('data-tooltip-id', tooltipId)
      .style('font-size', isEllipsis ? '16px' : fontSize)
      .style('font-weight', 'normal')
      .style('fill', getVectorTextColor(isDarkMode))
      .style('cursor', tooltipId ? 'help' : 'default')
      .style('pointer-events', 'none')
      .text(isEllipsis ? '⋯' : format ? format(v) : typeof v === 'number' ? v.toFixed(1) : '');
  });

  return { topY, bottomY: topY + cellHeight + 12, centers, width, cellWidth };
}
