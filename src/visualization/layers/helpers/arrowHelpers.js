/**
 * Helper functions for drawing arrows and connectors
 *
 * REUSABLE UTILITIES - View-agnostic
 * These helpers can be used across different views and visualization components
 */
import * as d3 from 'd3';
import { drawArrow } from '../../core/draw';
import {
  TRANSFORMER,
  TRANSFORMER_ARROWS,
  POSITIONAL_INDICATOR,
  ATTENTION_LINES,
} from '../../core/constants';

/**
 * Draw a simple vertical arrow between two embeddings
 * @param {d3.Selection} group - D3 group selection
 * @param {number} x - X position
 * @param {number} startY - Start Y position
 * @param {number} endY - End Y position
 * @param {Object} options - Arrow options
 */
export function drawVerticalArrow(group, x, startY, endY, options = {}) {
  const { className = '', withBox = false } = options;
  drawArrow(group, x, startY, x, endY, { className, withBox });
}

/**
 * Draw a U-shaped feedback arrow (from previous layer to current)
 * @param {d3.Selection} group - D3 group selection
 * @param {number} startX - Start X position
 * @param {number} startY - Start Y position
 * @param {number} endX - End X position
 * @param {number} endY - End Y position
 * @param {number} blockTopY - Top Y of transformer block
 * @param {string} className - CSS class name
 */
export function drawFeedbackArrow(group, startX, startY, endX, endY, blockTopY, className = '') {
  const lift = TRANSFORMER.FEEDBACK_ARROW_LIFT;

  const d = `M ${startX},${startY}
    C ${startX},${blockTopY - lift} ${endX},${blockTopY - lift} ${endX},${endY - 2}`;

  group
    .append('path')
    .attr('d', d)
    .attr('class', className)
    .style('fill', 'none')
    .style('stroke', TRANSFORMER_ARROWS.FEEDBACK_STROKE)
    .style('stroke-width', TRANSFORMER_ARROWS.FEEDBACK_WIDTH)
    .style('opacity', TRANSFORMER_ARROWS.FEEDBACK_OPACITY);
}

/**
 * Draw an arrowhead (triangle)
 * @param {d3.Selection} group - D3 group selection
 * @param {number} x - X position (tip)
 * @param {number} y - Y position (tip)
 * @param {string} direction - 'up' or 'down'
 * @param {Object} options - Styling options
 */
export function drawArrowhead(group, x, y, direction = 'down', options = {}) {
  const {
    className = '',
    size = TRANSFORMER.FEEDBACK_ARROW_SIZE,
    fill = '#c0c0c0',
    opacity = 0.95,
  } = options;

  let points;
  if (direction === 'down') {
    points = `${x},${y} ${x - size},${y - size * 1.4} ${x + size},${y - size * 1.4}`;
  } else {
    points = `${x},${y} ${x - size},${y + size * 1.4} ${x + size},${y + size * 1.4}`;
  }

  group
    .append('polygon')
    .attr('points', points)
    .attr('class', className)
    .style('fill', fill)
    .style('opacity', opacity);
}

/**
 * Draw positional embedding indicator (circle with index)
 * @param {d3.Selection} group - D3 group selection
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number} index - Position index (1-based)
 * @param {Object} options - Styling options
 */
export function drawPositionalIndicator(group, x, y, index, options = {}) {
  const { className = '', radius = TRANSFORMER.POSITIONAL_CIRCLE_RADIUS, opacity = 0 } = options;

  const peg = group.append('g').attr('class', className);

  peg
    .append('circle')
    .attr('cx', x)
    .attr('cy', y)
    .attr('r', radius)
    .style('fill', POSITIONAL_INDICATOR.CIRCLE_FILL)
    .style('stroke', POSITIONAL_INDICATOR.CIRCLE_STROKE)
    .style('opacity', opacity);

  peg
    .append('text')
    .attr('x', x)
    .attr('y', y + POSITIONAL_INDICATOR.TEXT_Y_OFFSET)
    .attr('text-anchor', 'middle')
    .style('font-size', TRANSFORMER.POSITIONAL_TEXT_SIZE)
    .style('font-weight', '600')
    .style('fill', POSITIONAL_INDICATOR.TEXT_FILL)
    .style('opacity', opacity)
    .text(String(index));

  return { x, y, r: radius };
}

/**
 * Draw attention connections between embeddings
 * @param {d3.Selection} group - D3 group selection
 * @param {Array} topMeta - Top embedding metadata
 * @param {Array} bottomMeta - Bottom embedding metadata
 * @param {boolean} isTriangular - Use triangular/causal attention pattern
 * @param {number} targetIdx - For all-to-one pattern, the target index
 */
export function drawAttentionConnections(group, topMeta, bottomMeta, isTriangular, targetIdx = -1) {
  const centers = topMeta.map((m) => (m ? { x: m.centerX } : null));

  if (isTriangular) {
    // Triangular/causal attention
    centers.forEach((a, i) => {
      if (!a || !topMeta[i]) return;
      centers.forEach((b, j) => {
        if (!b || !bottomMeta[j] || i > j) return;

        const s = Math.abs(Math.sin((i * 37 + j * 17) * 12.9898)) % 1;
        const color = d3.interpolateRgb(ATTENTION_LINES.COLOR_START, ATTENTION_LINES.COLOR_END)(s);
        const width = TRANSFORMER.ATTENTION_LINE_WIDTH;
        const opacity =
          TRANSFORMER.ATTENTION_BASE_OPACITY + s * TRANSFORMER.ATTENTION_OPACITY_RANGE;

        group
          .append('line')
          .attr('x1', a.x)
          .attr('y1', topMeta[i].topY + topMeta[i].height / 2)
          .attr('x2', b.x)
          .attr('y2', bottomMeta[j].topY + bottomMeta[j].height / 2)
          .style('stroke', color)
          .style('stroke-width', width)
          .style('opacity', opacity);
      });
    });
  } else if (targetIdx >= 0 && bottomMeta[targetIdx]) {
    // All-to-one attention
    const bx = centers[targetIdx]?.x ?? bottomMeta[targetIdx].centerX;
    const by = bottomMeta[targetIdx].topY + bottomMeta[targetIdx].height / 2;

    centers.forEach((a, i) => {
      if (!a || !topMeta[i]) return;

      const s = Math.abs(Math.sin((i * 37 + targetIdx * 17) * 12.9898)) % 1;
      const color = d3.interpolateRgb(ATTENTION_LINES.COLOR_START, ATTENTION_LINES.COLOR_END)(s);
      const width = TRANSFORMER.ATTENTION_LINE_WIDTH;
      const opacity = ATTENTION_LINES.ALL_TO_ONE_OPACITY;

      group
        .append('line')
        .attr('x1', a.x)
        .attr('y1', topMeta[i].topY + topMeta[i].height / 2)
        .attr('x2', bx)
        .attr('y2', by)
        .style('stroke', color)
        .style('stroke-width', width)
        .style('opacity', opacity);
    });
  }
}
