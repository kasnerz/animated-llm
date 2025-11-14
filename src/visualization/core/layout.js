/**
 * Layout calculations and positioning logic
 * Pure functions that compute positions, dimensions, and visibility
 */
import { LAYOUT } from './constants.js';

/**
 * Calculate token layout (positions, widths, collapse state)
 * @param {Array} tokens - Array of token strings
 * @param {number} width - Container width
 * @param {boolean} isExpanded - Whether tokens are expanded
 * @param {Object} config - Layout configuration
 * @returns {Object} Layout metadata: positions, widths, visibleIndices, shouldCollapse, gap
 */
export function calculateTokenLayout(tokens, width, isExpanded, config = {}) {
  const { tokenSpacing = LAYOUT.TOKEN_SPACING, margin = LAYOUT.MARGIN } = config;

  const maxVisibleTokens = Math.floor(width / tokenSpacing) - 1;
  const shouldCollapse = tokens.length > maxVisibleTokens && !isExpanded;

  let positions = [];
  let widths = [];
  let visibleIndices = [];
  const gap = LAYOUT.GAP_WIDTH;

  if (shouldCollapse) {
    // Show first few and last token with gap
    const firstVisible = Math.floor(maxVisibleTokens / 2);
    const lastVisible = maxVisibleTokens - firstVisible;

    // Calculate positions for first group
    for (let i = 0; i < firstVisible; i++) {
      const x = margin + i * tokenSpacing;
      positions.push(x);
      widths.push(tokenSpacing - 10);
      visibleIndices.push(i);
    }

    // Add gap
    const gapX = margin + firstVisible * tokenSpacing;
    positions.push(gapX);
    widths.push(gap);
    visibleIndices.push(-1); // Sentinel for gap

    // Calculate positions for last group
    const startIdx = tokens.length - lastVisible;
    for (let i = 0; i < lastVisible; i++) {
      const x = gapX + gap + i * tokenSpacing;
      positions.push(x);
      widths.push(tokenSpacing - 10);
      visibleIndices.push(startIdx + i);
    }
  } else {
    // Show all tokens
    for (let i = 0; i < tokens.length; i++) {
      const x = margin + i * tokenSpacing;
      positions.push(x);
      widths.push(tokenSpacing - 10);
      visibleIndices.push(i);
    }
  }

  return {
    positions,
    widths,
    visibleIndices,
    shouldCollapse,
    gap,
    maxVisibleTokens,
  };
}

/**
 * Calculate transformer block dimensions
 * @param {Object} outerMeta - Metadata from outer embeddings
 * @param {Object} layout - Base layout config
 * @returns {Object} Block dimensions: x, y, width, height, insideTopY, insideBottomY
 */
export function calculateBlockDimensions(outerMeta, layout) {
  const { startX, totalWidth, afterEmbY } = outerMeta;
  const { blockPadding } = layout;

  const blockX = startX - blockPadding;
  const blockY = afterEmbY + 60;
  const blockWidth = totalWidth + 2 * blockPadding;

  // Vertical layout inside block:
  // - Top embeddings start at blockY + padding
  // - Attention mash in middle
  // - Bottom embeddings after attention
  const insideTopY = blockY + blockPadding;
  const embeddingHeight = 50; // Approximate
  const attentionHeight = 80;
  const insideBottomY = insideTopY + embeddingHeight + attentionHeight + 20;
  const blockHeight = insideBottomY - blockY + embeddingHeight + blockPadding;

  return {
    x: blockX,
    y: blockY,
    width: blockWidth,
    height: blockHeight,
    insideTopY,
    insideBottomY,
  };
}

/**
 * Calculate output distribution layout
 * @param {Array} distribution - Distribution data
 * @param {number} width - Container width
 * @param {number} startY - Starting Y position
 * @returns {Object} Layout: barPositions, barWidths, barHeights, maxHeight
 */
export function calculateOutputLayout(distribution, width, startY) {
  const margin = 20;
  const availableWidth = width - 2 * margin;
  const barCount = distribution.length;
  const spacing = 4;
  const barWidth = Math.min(80, (availableWidth - (barCount - 1) * spacing) / barCount);
  const maxHeight = 200;

  // Normalize probabilities to bar heights
  const maxProb = Math.max(...distribution.map((d) => d.probability));
  const barHeights = distribution.map((d) => (d.probability / maxProb) * maxHeight);

  // Calculate positions
  const totalBarsWidth = barCount * barWidth + (barCount - 1) * spacing;
  const startX = (width - totalBarsWidth) / 2;
  const barPositions = distribution.map((_, i) => startX + i * (barWidth + spacing));

  return {
    barPositions,
    barWidths: Array(barCount).fill(barWidth),
    barHeights,
    maxHeight,
    startY,
  };
}
