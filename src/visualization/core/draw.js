/**
 * Pure SVG drawing primitives using D3
 * All functions are pure: they take data/config and return nothing (imperative D3 append)
 */

/**
 * Draw a straight arrow from (x1,y1) to (x2,y2)
 * @param {d3.Selection} group - D3 selection to append to
 * @param {number} x1 - Start x
 * @param {number} y1 - Start y
 * @param {number} x2 - End x
 * @param {number} y2 - End y
 * @param {Object} opts - Options: className, color, strokeWidth, markerSize, opacity
 */
export function drawArrow(group, x1, y1, x2, y2, opts = {}) {
  const { className = '', color = '#999', strokeWidth = 2, markerSize = 6, opacity = 0.8 } = opts;

  const markerId = `arrowhead-${Math.random().toString(36).slice(2, 9)}`;

  // Define arrowhead marker
  group
    .append('defs')
    .append('marker')
    .attr('id', markerId)
    .attr('markerWidth', markerSize)
    .attr('markerHeight', markerSize)
    .attr('refX', markerSize / 2)
    .attr('refY', markerSize / 2)
    .attr('orient', 'auto')
    .append('polygon')
    .attr('points', `0 0, ${markerSize} ${markerSize / 2}, 0 ${markerSize}`)
    .attr('fill', color);

  // Draw line
  group
    .append('line')
    .attr('class', className)
    .attr('x1', x1)
    .attr('y1', y1)
    .attr('x2', x2)
    .attr('y2', y2)
    .attr('stroke', color)
    .attr('stroke-width', strokeWidth)
    .attr('marker-end', `url(#${markerId})`)
    .attr('opacity', opacity);
}

/**
 * Generate a right-angle rounded path between two points
 * @param {number} x1 - Start x
 * @param {number} y1 - Start y
 * @param {number} x2 - End x
 * @param {number} y2 - End y
 * @param {number} radius - Corner radius
 * @returns {string} SVG path d attribute
 */
export function rightAngleRoundedPath(x1, y1, x2, y2, radius = 10) {
  const midY = (y1 + y2) / 2;
  const r = Math.min(radius, Math.abs(y2 - y1) / 2);

  return `
    M ${x1},${y1}
    L ${x1},${midY - r}
    Q ${x1},${midY} ${x1 + (x2 > x1 ? r : -r)},${midY}
    L ${x2 - (x2 > x1 ? r : -r)},${midY}
    Q ${x2},${midY} ${x2},${midY + (y2 > midY ? r : -r)}
    L ${x2},${y2}
  `;
}

/**
 * Generate a smooth connector path between two points
 * @param {number} x1 - Start x
 * @param {number} y1 - Start y
 * @param {number} x2 - End x
 * @param {number} y2 - End y
 * @returns {string} SVG path d attribute
 */
export function smoothConnectorPath(x1, y1, x2, y2) {
  const midY = (y1 + y2) / 2;
  return `M ${x1},${y1} C ${x1},${midY} ${x2},${midY} ${x2},${y2}`;
}

/**
 * Draw a vertical embedding column (stack of colored rectangles)
 * @param {d3.Selection} group - D3 selection to append to
 * @param {number} centerX - Center x coordinate
 * @param {number} topY - Top y coordinate
 * @param {number[]} values - Array of embedding values
 * @param {Object} opts - Options: className, width, cellHeight, getColor, showValues, isExpanded, onClick
 */
export function drawEmbeddingColumn(group, centerX, topY, values, opts = {}) {
  const {
    className = '',
    width = 40,
    cellHeight = 8,
    getColor = () => '#ccc',
    showValues = false,
    isExpanded = false,
    onClick = null,
  } = opts;

  const colGroup = group.append('g').attr('class', `embedding-col ${className}`);

  // Determine how many values to show
  const displayCount = isExpanded ? values.length : Math.min(values.length, 5);
  const displayValues = isExpanded ? values : values.slice(0, displayCount);
  const hasMore = values.length > displayCount;

  // Draw rectangles
  displayValues.forEach((val, i) => {
    const y = topY + i * cellHeight;
    colGroup
      .append('rect')
      .attr('x', centerX - width / 2)
      .attr('y', y)
      .attr('width', width)
      .attr('height', cellHeight)
      .attr('fill', getColor(val))
      .attr('stroke', '#555')
      .attr('stroke-width', 0.5);

    // Show value text if requested
    if (showValues) {
      colGroup
        .append('text')
        .attr('x', centerX)
        .attr('y', y + cellHeight / 2)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('font-size', '8px')
        .attr('fill', '#333')
        .text(val.toFixed(2));
    }
  });

  // Add "..." indicator if truncated
  if (hasMore) {
    const dotsY = topY + displayCount * cellHeight;
    colGroup
      .append('text')
      .attr('x', centerX)
      .attr('y', dotsY + cellHeight / 2)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('font-size', '12px')
      .attr('fill', '#666')
      .text('⋯')
      .style('cursor', onClick ? 'pointer' : 'default');
  }

  // Add click handler if provided
  if (onClick) {
    colGroup.style('cursor', 'pointer').on('click', onClick);
  }

  return {
    width,
    height: displayCount * cellHeight + (hasMore ? cellHeight : 0),
  };
}

/**
 * Draw a horizontal vector (row of colored rectangles)
 * @param {d3.Selection} group - D3 selection to append to
 * @param {number} centerX - Center x coordinate
 * @param {number} topY - Top y coordinate
 * @param {number[]} values - Array of vector values
 * @param {Object} opts - Options: className, cellWidth, height, getColor, maxCells
 */
export function drawHorizontalVector(group, centerX, topY, values, opts = {}) {
  const {
    className = '',
    cellWidth = 8,
    height = 40,
    getColor = () => '#ccc',
    maxCells = 50,
  } = opts;

  const vecGroup = group.append('g').attr('class', `horizontal-vector ${className}`);

  // Limit number of cells for display
  const displayCount = Math.min(values.length, maxCells);
  const displayValues = values.slice(0, displayCount);
  const totalWidth = displayCount * cellWidth;
  const startX = centerX - totalWidth / 2;

  // Draw cells
  displayValues.forEach((val, i) => {
    const x = startX + i * cellWidth;
    vecGroup
      .append('rect')
      .attr('x', x)
      .attr('y', topY)
      .attr('width', cellWidth)
      .attr('height', height)
      .attr('fill', getColor(val))
      .attr('stroke', '#555')
      .attr('stroke-width', 0.5);
  });

  return {
    width: totalWidth,
    height,
  };
}
