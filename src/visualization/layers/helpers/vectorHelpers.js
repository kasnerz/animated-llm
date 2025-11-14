/**
 * Helper functions for drawing vectors and embeddings
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

  const displayValues = (values || []).slice(0, 3);
  const n = displayValues.length || 3;
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
    .style('fill', outerFill)
    .style('stroke', outerStroke);

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
      .style('fill', 'transparent');

    colG
      .append('text')
      .attr('x', cx)
      .attr('y', cy + VECTOR.TEXT_Y_OFFSET)
      .attr('text-anchor', 'middle')
      .style('font-size', VECTOR.TEXT_SIZE)
      .style('fill', getVectorTextColor(isDarkMode))
      .text(typeof v === 'number' ? v.toFixed(1) : '');
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

  g.append('rect')
    .attr('x', leftX - 6)
    .attr('y', topY)
    .attr('width', width)
    .attr('height', cellHeight + 12)
    .attr('rx', isLogprob ? VECTOR.LOGPROB_BOX_RADIUS : VECTOR.BOX_RADIUS)
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
      .attr('rx', VECTOR.CELL_RADIUS)
      .style('fill', 'transparent');

    const isLastAndEllipsis = ellipsisLast && i === n - 1;
    g.append('text')
      .attr('x', cx)
      .attr('y', topY + 6 + cellHeight / 2 + (isLogprob ? 6 : VECTOR.TEXT_Y_OFFSET))
      .attr('text-anchor', 'middle')
      .style('font-size', isLastAndEllipsis ? '16px' : fontSize)
      .style('font-weight', 'normal')
      .style('fill', getVectorTextColor(isDarkMode))
      .text(
        isLastAndEllipsis ? '⋯' : format ? format(v) : typeof v === 'number' ? v.toFixed(1) : ''
      );
  });

  return { topY, bottomY: topY + cellHeight + 12, centers, width, cellWidth };
}
