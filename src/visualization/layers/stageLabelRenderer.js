/**
 * Stage labels rendering
 */
import * as d3 from 'd3';
import { STAGE_LABEL, STAGE_LABEL_OPACITY, FONTS, TRAINING_STEPS } from '../core/constants';

/**
 * Render stage labels on the right side of the visualization
 * @param {d3.Selection} group - D3 group selection
 * @param {Object} stageYPositions - Map of stage keys to Y positions
 * @param {number} subStep - Current animation sub-step
 * @param {Object} stepsConfig - Configuration object mapping steps to stages
 * @param {boolean} isDarkMode - Whether dark mode is active
 * @param {boolean} isVisible - Whether the labels should be visible
 * @param {Function} t - Translation function
 */
export function renderStageLabels(
  group,
  stageYPositions,
  subStep,
  stepsConfig,
  isDarkMode,
  showGradually,
  t
) {
  // Define the stages we want to show labels for
  // We filter out stages that don't have a defined Y position
  const stages = [
    { id: 'tokenization', key: 'stage_tokenization' },
    { id: 'input_embedding', key: 'stage_input_embeddings' },
    { id: 'positional_embedding', key: 'stage_positional_embeddings' },
    { id: 'attention', key: 'stage_attention_layer' },
    { id: 'feed_forward', key: 'stage_feedforward_layer' },
    { id: 'output_embedding', key: 'stage_last_embedding' },
    { id: 'output_probabilities', key: 'stage_output_probabilities' },
    { id: 'output', key: 'stage_next_token' },
    { id: 'backpropagation', key: 'stage_backpropagation' },
  ].filter((stage) => stageYPositions[stage.id] !== undefined);

  const anchorX = 20; // Offset from the right edge of the container
  const verticalLineX = anchorX + STAGE_LABEL.GAP_TO_LINE;
  const labelX = verticalLineX + STAGE_LABEL.GAP_LINE_TO_LABEL;

  // Determine which stage is currently active based on the subStep
  let activeStageId = null;

  // Find the active stage from the steps configuration
  // stepsConfig is an object where keys are step numbers and values are stage IDs
  if (stepsConfig && stepsConfig[subStep]) {
    activeStageId = stepsConfig[subStep];
  }

  const isBackpropPhase = subStep > TRAINING_STEPS.BACKPROP_START;

  stages.forEach((stage) => {
    const yPos = stageYPositions[stage.id];
    const isActive = stage.id === activeStageId;

    // Create a group for this label
    const isBackpropLabel = stage.id === 'backpropagation';

    // Determine initial opacity to prevent flicker
    let initialOpacity = 1;
    if (isBackpropPhase) {
      initialOpacity = isBackpropLabel ? 1 : 0;
    } else {
      initialOpacity = isBackpropLabel ? 0 : 1;
    }

    const labelGroup = group
      .append('g')
      .attr(
        'class',
        `stage-label ${isActive ? 'active' : 'inactive'} ${isBackpropLabel ? 'stage-label-backprop' : ''}`
      )
      .attr('transform', `translate(${labelX}, ${yPos})`)
      .style('opacity', initialOpacity);

    // Background highlight bar (only for active label)
    if (isActive) {
      labelGroup
        .append('rect')
        .attr('x', -10)
        .attr('y', -18)
        .attr('width', STAGE_LABEL.HIGHLIGHT_WIDTH)
        .attr('height', STAGE_LABEL.HIGHLIGHT_HEIGHT)
        .attr('rx', STAGE_LABEL.HIGHLIGHT_RADIUS)
        .style('fill', isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)')
        .style('opacity', STAGE_LABEL_OPACITY.HIGHLIGHT);
    }

    // Horizontal dotted connector line
    labelGroup
      .append('line')
      .attr('x1', -STAGE_LABEL.GAP_LINE_TO_LABEL)
      .attr('y1', 0)
      .attr('x2', -15)
      .attr('y2', 0)
      .attr('class', 'stage-connector-line')
      .style('stroke', isDarkMode ? '#666' : '#999')
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
      .style('fill', isActive ? (isDarkMode ? '#fff' : '#333') : isDarkMode ? '#888' : '#999')
      .style('opacity', STAGE_LABEL_OPACITY.TEXT)
      .style('font-family', FONTS.FAMILY_UI)
      .text(t(stage.key));

    // Hint text below the label
    labelGroup
      .append('text')
      .attr('x', 0)
      .attr('y', STAGE_LABEL.HINT_Y_OFFSET)
      .attr('class', 'stage-label-hint')
      .style('font-size', STAGE_LABEL.HINT_SIZE)
      .style('font-weight', FONTS.WEIGHT_NORMAL)
      .style('fill', isDarkMode ? '#888' : '#999')
      .style('opacity', STAGE_LABEL_OPACITY.HINT)
      .style('font-family', FONTS.FAMILY_UI)
      .text(t(`${stage.key}_hint`))
      .call(wrapStageLabelHint, STAGE_LABEL.HINT_MAX_WIDTH, STAGE_LABEL.HINT_LINE_HEIGHT);
  });
}

function wrapStageLabelHint(selection, maxWidth, lineHeight = 1.2) {
  if (!maxWidth) return;

  selection.each(function () {
    const text = d3.select(this);
    const rawText = text.text();
    if (!rawText) return;

    const words = rawText.split(/\s+/).filter(Boolean).reverse();
    if (!words.length) return;

    let line = [];
    let lineNumber = 0;
    const lineHeightValue = lineHeight > 0 ? lineHeight : 1.2;
    const x = text.attr('x') ?? 0;
    const y = text.attr('y') ?? 0;
    const dy = parseFloat(text.attr('dy')) || 0;

    text.text(null);

    let tspan = text.append('tspan').attr('x', x).attr('y', y).attr('dy', `${dy}em`);

    let word;
    while ((word = words.pop())) {
      line.push(word);
      tspan.text(line.join(' '));
      if (tspan.node().getComputedTextLength() > maxWidth && line.length > 1) {
        line.pop();
        tspan.text(line.join(' '));
        line = [word];
        lineNumber += 1;
        tspan = text
          .append('tspan')
          .attr('x', x)
          .attr('y', y)
          .attr('dy', `${lineNumber * lineHeightValue + dy}em`)
          .text(word);
      }
    }
  });
}
