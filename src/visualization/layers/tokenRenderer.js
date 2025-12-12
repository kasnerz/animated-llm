/**
 * Token layer rendering
 *
 * REUSABLE COMPONENT - View-agnostic
 * This renderer can be used across different views (text generation, training, decoding)
 * It only depends on the data structure passed to it, not on any specific view logic
 */
import { getTokenColor } from '../core/colors';
import {
  processTokenForVisualization,
  isSpecialTokenContextual,
} from '../../utils/tokenProcessing';
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
  tokensLayoutRef,
  isMobile = false
) {
  const tokens = step.tokens;
  const lastActualIndex = tokens.length - 1;
  let visibleTokens = tokens;
  let tokenIndices = tokens.map((_, i) => i);

  // Collapse logic: show only first few and last few tokens
  if (shouldCollapse) {
    const edgeCount = Math.max(1, Math.floor(maxVisibleTokens / 2));

    const leftTokens = tokens.slice(0, edgeCount);
    const rightTokens = tokens.slice(-edgeCount);
    const leftIndices = tokenIndices.slice(0, edgeCount);
    const rightIndices = tokenIndices.slice(-edgeCount);

    visibleTokens = [...leftTokens, '...', ...rightTokens];
    tokenIndices = [...leftIndices, -1, ...rightIndices];
  }

  // Compute dynamic widths based on token length
  const widths = visibleTokens.map((tok, idx) => {
    if (tok === '...') return TOKEN.ELLIPSIS_WIDTH;
    const prevTok = idx > 0 ? visibleTokens[idx - 1] : null;
    const special = isSpecialTokenContextual(tok, prevTok);
    const fontScale = special ? 0.6 : 1.0; // make special token text smaller
    const padding = special ? Math.max(2, TOKEN.HORIZ_PADDING * 0.3) : TOKEN.HORIZ_PADDING; // tighter LR padding
    const minWidth = special ? Math.max(20, TOKEN.MIN_BOX_WIDTH * 0.5) : TOKEN.MIN_BOX_WIDTH;
    const contentChars = processTokenForVisualization(tok).length;
    return Math.max(minWidth, contentChars * TOKEN.CHAR_WIDTH * fontScale + padding);
  });

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

  // Base font sizes (px) derived from constants (which are strings like '18px')
  const baseTextSize = parseFloat(TOKEN.TEXT_SIZE) || 18;
  const baseIdSize = parseFloat(TOKEN.ID_TEXT_SIZE) || 13;

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
    const prevToken = i > 0 ? visibleTokens[i - 1] : null;
    const isSpecial = isSpecialTokenContextual(token, prevToken);

    // Token box (transparent background, or grey for special tokens)
    tokenG
      .append('rect')
      .attr('x', -estimatedWidth / 2)
      .attr('y', -TOKEN.BOX_HEIGHT / 2)
      .attr('width', estimatedWidth)
      .attr('height', TOKEN.BOX_HEIGHT)
      .attr('rx', TOKEN.BOX_RADIUS)
      .attr('class', `token-box ${isSpecial ? 'special-token-box' : ''}`)
      .style(
        'fill',
        isSpecial ? 'var(--viz-special-token-bg, rgba(128, 128, 128, 0.1))' : 'transparent'
      )
      .style('stroke', 'none');

    // Token text
    const textNode = tokenG
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('y', TOKEN.TEXT_Y_OFFSET)
      .attr('class', `token-text ${isSpecial ? 'special-token-text' : ''}`)
      .style('font-size', isSpecial ? `${baseTextSize * 0.6}px` : TOKEN.TEXT_SIZE)
      .style('font-family', FONTS.FAMILY_UI)
      .style('font-weight', isSpecial ? FONTS.WEIGHT_NORMAL : FONTS.WEIGHT_MEDIUM)
      .style('fill', isSpecial ? 'var(--viz-special-token-text, #888)' : 'var(--viz-token-text)')
      .style('cursor', 'help')
      .style('pointer-events', 'auto')
      .text(processTokenForVisualization(token));

    if (!isMobile) {
      textNode.attr('data-tooltip-id', 'viz-token-tooltip');
    }

    // Colored heavy underline (more muted for special tokens)
    tokenG
      .append('line')
      .attr('x1', -estimatedWidth / 2 + TOKEN.UNDERLINE_INSET)
      .attr('y1', TOKEN.UNDERLINE_Y)
      .attr('x2', estimatedWidth / 2 - TOKEN.UNDERLINE_INSET)
      .attr('y2', TOKEN.UNDERLINE_Y)
      .attr('class', `token-underline ${isSpecial ? 'special-token-underline' : ''}`)
      .style('stroke', tokenColor)
      .style('stroke-width', TOKEN.UNDERLINE_WIDTH)
      .style('stroke-linecap', 'round')
      .style('opacity', isSpecial ? 0.4 : 1);

    // Inline Token ID (smaller and muted for special tokens)
    const idNode = tokenG
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('y', TOKEN.ID_Y_OFFSET)
      .attr(
        'class',
        `token-id-inline ${isNew ? 'new-token' : 'prev-token'} ${isSpecial ? 'special-token-id' : ''}`
      )
      .style('font-size', isSpecial ? `${baseIdSize * 0.75}px` : TOKEN.ID_TEXT_SIZE)
      .style('font-weight', FONTS.WEIGHT_BOLD)
      .style('fill', isSpecial ? 'var(--viz-special-token-text, #888)' : tokenColor)
      .style('opacity', isSpecial ? 0.6 : 1)
      .style('cursor', 'help')
      .style('pointer-events', 'auto')
      .text(step.token_ids[actualIndex]);

    if (!isMobile) {
      idNode.attr('data-tooltip-id', 'viz-token-id-tooltip');
    }
  });

  return { positions, widths, visibleIndices: tokenIndices };
}
