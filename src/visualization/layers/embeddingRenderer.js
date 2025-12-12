/**
 * Outer embeddings layer rendering
 *
 * REUSABLE COMPONENT - View-agnostic
 * This renderer can be used across different views (text generation, training, decoding)
 * It only depends on the data structure passed to it, not on any specific view logic
 */
import { getTokenColor } from '../core/colors';
import { drawEmbeddingColumn } from './helpers/vectorHelpers';
import { EMBEDDING_ARROW } from '../core/constants';

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
  isDarkMode,
  isMobile = false
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
    const tokenColor = getTokenColor(actualIndex);
    const isNew = actualIndex === lastActualIndex;

    const meta = drawEmbeddingColumn(group, x, layout.embeddingY, values, {
      tokenColor,
      className: isNew ? 'new-token' : 'prev-token',
      isDarkMode,
      isMobile,
    });

    // Arrow from token to embedding
    const arrowG = underlays
      .append('g')
      .attr('class', `id-to-emb-arrow ${isNew ? 'new-token' : 'prev-token'}`);

    const y1 = layout.tokenY + EMBEDDING_ARROW.FROM_TOKEN_OFFSET;
    const y2 = meta.topY - EMBEDDING_ARROW.TO_VECTOR_OFFSET;

    arrowG
      .append('line')
      .attr('x1', x)
      .attr('y1', y1)
      .attr('x2', x)
      .attr('y2', y2)
      .style('stroke', EMBEDDING_ARROW.STROKE_COLOR)
      .style('stroke-width', EMBEDDING_ARROW.STROKE_WIDTH)
      .style('opacity', EMBEDDING_ARROW.OPACITY);

    arrowG
      .append('polygon')
      .attr(
        'points',
        `${x},${y2} ${x - EMBEDDING_ARROW.HEAD_SIZE},${y2 - 6} ${x + EMBEDDING_ARROW.HEAD_SIZE},${y2 - 6}`
      )
      .style('fill', EMBEDDING_ARROW.HEAD_FILL)
      .style('opacity', EMBEDDING_ARROW.OPACITY);

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
