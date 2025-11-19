/**
 * Stage labels rendering
 */
import { STAGE_LABEL, STAGE_LABEL_OPACITY, FONTS } from '../core/constants';

/**
 * Render stage labels on the right side of the visualization
 * @param {d3.Selection} group - D3 group selection
 * @param {Object} layout - Layout configuration with Y positions for each stage
 * @param {number} anchorX - Right edge X position for alignment
 * @param {number} subStep - Current animation sub-step (0-11)
 * @param {Function} t - Translation function
 * @param {boolean} showGradual - If true, labels appear progressively by subStep
 * @param {Object} [options] - Extra options
 * @param {number} [options.currentLayer] - Current transformer layer index
 * @param {number} [options.numLayers] - Total number of layers
 */
export function renderStageLabels(
  group,
  layout,
  anchorX,
  subStep,
  t,
  showGradual = true,
  options = {}
) {
  const { currentLayer = 0, numLayers = 1, isTraining = false } = options;
  const labels = [
    { key: 'stage_tokenization', y: STAGE_LABEL.Y_TOKENIZATION, subStep: 0 },
    { key: 'stage_input_embeddings', y: STAGE_LABEL.Y_INPUT_EMBEDDINGS, subStep: 1 },
    { key: 'stage_positional_embeddings', y: STAGE_LABEL.Y_POSITIONAL_EMBEDDINGS, subStep: 2 },
    { key: 'stage_attention_layer', y: STAGE_LABEL.Y_ATTENTION_LAYER, subStep: 3 },
    { key: 'stage_feedforward_layer', y: STAGE_LABEL.Y_FEEDFORWARD_LAYER, subStep: 4 },
    { key: 'stage_last_embedding', y: STAGE_LABEL.Y_LAST_EMBEDDING, subStep: 6 },
    { key: 'stage_output_probabilities', y: STAGE_LABEL.Y_OUTPUT_PROBABILITIES, subStep: 7 },
    // In training view, replace "Next token" by an error computation label
    {
      key: isTraining ? 'stage_compute_error' : 'stage_next_token',
      y: STAGE_LABEL.Y_NEXT_TOKEN,
      subStep: 9,
    },
  ];

  const verticalLineX = anchorX + STAGE_LABEL.GAP_TO_LINE;
  const labelX = verticalLineX + STAGE_LABEL.GAP_LINE_TO_LABEL;

  // Removed vertical delimiter line for cleaner floating panel

  labels.forEach((label) => {
    let isActive = subStep === label.subStep;

    // Suppress highlight for positional embeddings during the second pass
    const isSecondPass =
      numLayers > 1 && currentLayer >= Math.max(0, numLayers - 1) && subStep >= 2 && subStep <= 4;
    if (label.key === 'stage_positional_embeddings' && subStep === 2 && isSecondPass) {
      isActive = false;
    }
    // If showGradual is false (after first token), show all labels
    // If showGradual is true (first token), show labels progressively
    const isVisible = showGradual ? subStep >= label.subStep : true;

    if (!isVisible) {
      return;
    }

    const labelGroup = group
      .append('g')
      .attr('class', `stage-label ${isActive ? 'active' : 'inactive'}`)
      .attr('transform', `translate(${labelX}, ${label.y})`);

    // Background highlight bar (only for active label)
    if (isActive) {
      labelGroup
        .append('rect')
        .attr('x', -10)
        .attr('y', -18)
        .attr('width', STAGE_LABEL.HIGHLIGHT_WIDTH)
        .attr('height', STAGE_LABEL.HIGHLIGHT_HEIGHT)
        .attr('rx', STAGE_LABEL.HIGHLIGHT_RADIUS)
        .style('fill', 'var(--viz-stage-highlight, rgba(0, 0, 0, 0.08))')
        .style('opacity', STAGE_LABEL_OPACITY.HIGHLIGHT);
    }

    // Horizontal dotted connector line
    group
      .append('line')
      .attr('x1', verticalLineX)
      .attr('y1', label.y)
      .attr('x2', labelX - 15)
      .attr('y2', label.y)
      .attr('class', 'stage-connector-line')
      .style('stroke', 'var(--viz-stage-line, #999)')
      .style('stroke-width', 1)
      .style('stroke-dasharray', STAGE_LABEL.CONNECTOR_DASHARRAY)
      .style(
        'opacity',
        isActive ? STAGE_LABEL_OPACITY.CONNECTOR_ACTIVE : STAGE_LABEL_OPACITY.CONNECTOR_INACTIVE
      );

    // Label heading text
    labelGroup
      .append('text')
      .attr('x', 0)
      .attr('y', 0)
      .attr('class', 'stage-label-heading')
      .style('font-size', STAGE_LABEL.HEADING_SIZE)
      .style('font-weight', FONTS.WEIGHT_SEMIBOLD)
      .style('fill', isActive ? 'var(--text-primary, #333)' : 'var(--text-tertiary, #999)')
      .style('opacity', STAGE_LABEL_OPACITY.TEXT)
      .style('font-family', FONTS.FAMILY_UI)
      .text(t(label.key));

    // Hint text below the label
    labelGroup
      .append('text')
      .attr('x', 0)
      .attr('y', STAGE_LABEL.HINT_Y_OFFSET)
      .attr('class', 'stage-label-hint')
      .style('font-size', STAGE_LABEL.HINT_SIZE)
      .style('font-weight', FONTS.WEIGHT_NORMAL)
      .style('fill', 'var(--text-tertiary, #999)')
      .style('opacity', STAGE_LABEL_OPACITY.HINT)
      .style('font-family', FONTS.FAMILY_UI)
      .text(t(`${label.key}_hint`));
  });
}
