/**
 * Token layer rendering
 *
 * REUSABLE COMPONENT - View-agnostic
 * This renderer can be used across different views (text generation, training, decoding)
 * It only depends on the data structure passed to it, not on any specific view logic
 */
import { getTokenColor } from '../core/colors';
import { processTokenForVisualization } from '../../utils/tokenProcessing';
import { TOKEN, FONTS } from '../core/constants';

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

  // Collapse logic: show only first few and last few tokens
  if (shouldCollapse) {
    const edgeCount = Math.floor(maxVisibleTokens / 2);
    const leftTokens = tokens.slice(0, edgeCount);
    const rightTokens = tokens.slice(-edgeCount);
    const leftIndices = tokenIndices.slice(0, edgeCount);
    const rightIndices = tokenIndices.slice(-edgeCount);

    visibleTokens = [...leftTokens, '...', ...rightTokens];
    tokenIndices = [...leftIndices, -1, ...rightIndices];
  }

  // Compute dynamic widths based on token length
  const widths = visibleTokens.map((tok) =>
    tok === '...'
      ? TOKEN.ELLIPSIS_WIDTH
      : Math.max(
          TOKEN.MIN_BOX_WIDTH,
          processTokenForVisualization(tok).length * TOKEN.CHAR_WIDTH + TOKEN.HORIZ_PADDING
        )
  );

  const contentWidth = widths.reduce((a, b) => a + b, 0) + TOKEN.GAP * (visibleTokens.length - 1);
  const minMargin = layout?.margin ?? 0;
  const leftBias = layout?.leftBias || 0;
  const startX = Math.max(minMargin, (width - contentWidth) / 2 - leftBias);

  // Precompute center positions for each visible token
  const positions = [];
  let cursor = startX;
  widths.forEach((w) => {
    positions.push(cursor + w / 2);
    cursor += w + TOKEN.GAP;
  });

  // Save layout metadata
  const prevMeta = (tokensLayoutRef && tokensLayoutRef.current) || {};
  tokensLayoutRef.current = {
    ...prevMeta,
    positions,
    widths,
    visibleIndices: tokenIndices,
    gap: TOKEN.GAP,
    shouldCollapse,
  };

  // Render tokens
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

    // Token box (transparent background)
    tokenG
      .append('rect')
      .attr('x', -estimatedWidth / 2)
      .attr('y', -TOKEN.BOX_HEIGHT / 2)
      .attr('width', estimatedWidth)
      .attr('height', TOKEN.BOX_HEIGHT)
      .attr('rx', TOKEN.BOX_RADIUS)
      .attr('class', 'token-box')
      .style('fill', 'transparent')
      .style('stroke', 'none');

    // Token text
    tokenG
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('y', TOKEN.TEXT_Y_OFFSET)
      .attr('class', 'token-text')
      .style('font-size', TOKEN.TEXT_SIZE)
      .style('font-family', FONTS.FAMILY_UI)
      .style('font-weight', FONTS.WEIGHT_MEDIUM)
      .style('fill', 'var(--viz-token-text)')
      .text(processTokenForVisualization(token));

    // Colored heavy underline
    tokenG
      .append('line')
      .attr('x1', -estimatedWidth / 2 + TOKEN.UNDERLINE_INSET)
      .attr('y1', TOKEN.UNDERLINE_Y)
      .attr('x2', estimatedWidth / 2 - TOKEN.UNDERLINE_INSET)
      .attr('y2', TOKEN.UNDERLINE_Y)
      .attr('class', 'token-underline')
      .style('stroke', tokenColor)
      .style('stroke-width', TOKEN.UNDERLINE_WIDTH)
      .style('stroke-linecap', 'round');

    // Inline Token ID
    tokenG
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('y', TOKEN.ID_Y_OFFSET)
      .attr('class', `token-id-inline ${isNew ? 'new-token' : 'prev-token'}`)
      .style('font-size', TOKEN.ID_TEXT_SIZE)
      .style('font-weight', FONTS.WEIGHT_BOLD)
      .style('fill', tokenColor)
      .text(step.token_ids[actualIndex]);
  });

  return { positions, widths, visibleIndices: tokenIndices };
}
