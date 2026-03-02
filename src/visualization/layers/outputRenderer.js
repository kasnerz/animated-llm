/**
 * Output distribution layer rendering
 *
 * REUSABLE COMPONENT - View-agnostic
 * This renderer can be used across different views (text generation, training, decoding)
 * It only depends on the data structure passed to it, not on any specific view logic
 */
import * as d3 from 'd3';
import { getTokenColor, getVectorBoxColors } from '../core/colors';
import { drawHorizontalVector } from './helpers/vectorHelpers';
import { drawArrow } from '../core/draw';
import { verticalThenHorizontalRoundedPath } from '../core/draw';
import { processTokenForVisualization } from '../../utils/tokenProcessing';
import { OUTPUT, LAYOUT as CONSTS, OUTPUT_ARROWS, TOKEN, FONTS } from '../core/constants';

/**
 * Render output distribution layer below bottom embeddings
 */
export function renderOutputLayer(
  group,
  step,
  layout,
  width,
  svgRoot,
  bottomInfo,
  subStep,
  computedEmbeddings,
  contentCenterX,
  isDarkMode
) {
  const allCandidates = step.output_distribution?.candidates || [];
  // Use mobile limit (3 tokens) on small screens, desktop limit (7) otherwise
  const isMobile = width <= 1000;
  const maxTokens = isMobile ? CONSTS.MAX_OUTPUT_TOKENS_MOBILE : CONSTS.MAX_OUTPUT_TOKENS;

  // Check if ellipsis already exists in allCandidates (e.g., from training with target token)
  const hasEllipsis = allCandidates.some((c) => c.isEllipsis || c.token === '...');

  const candidates =
    allCandidates.length > maxTokens && !hasEllipsis
      ? [...allCandidates.slice(0, maxTokens), { token: '...', prob: 0 }]
      : allCandidates;

  const selectedIdx = findSelectedIndex(step, allCandidates, candidates, maxTokens);

  const rm = bottomInfo.rightmostMeta;
  const rightmostActualIndex = bottomInfo.rightmostActualIndex ?? -1;
  const tokenColor = rightmostActualIndex >= 0 ? getTokenColor(rightmostActualIndex) : '#999';

  const baseBox = getVectorBoxColors(tokenColor, { isDarkMode });
  const baseFill = baseBox.fill;

  const horizY = bottomInfo.afterBottomY + OUTPUT.OUTER_TO_HORIZ_GAP;
  const horizCenterX = contentCenterX != null ? contentCenterX : width / 2;

  const mainRoot = d3.select(svgRoot).select('g.visualization-main');
  const extractionBg = mainRoot
    .insert('g', '.bottom-embedding-group')
    .attr('class', 'extraction-bg-layer');

  const underlays = group.append('g').attr('class', 'output-underlays');

  // Render extracted horizontal embedding vector
  let hv1 = null;
  if (subStep >= 6) {
    hv1 = renderExtractedEmbedding(
      group,
      extractionBg,
      rm,
      horizCenterX,
      horizY,
      computedEmbeddings,
      rightmostActualIndex,
      tokenColor,
      baseFill,
      isDarkMode,
      bottomInfo.metas,
      step && step.viz_mode === 'backprop'
    );
  }

  // Render logprob vector
  let hv2 = null;
  let selectionCenterY = null;
  const logprobY = (hv1 ? hv1.bottomY : horizY + 36) + OUTPUT.HORIZ_TO_LOGPROB_GAP;
  const probs = candidates.map((c) => c.prob);
  // Ellipsis info for current candidate set
  const ellipsisIdxForCandidates = candidates.findIndex(
    (c) => c && (c.isEllipsis || c.token === '...')
  );
  const isEllipsisLast = ellipsisIdxForCandidates === candidates.length - 1;

  if (subStep >= 7) {
    hv2 = drawHorizontalVector(group, horizCenterX, logprobY, probs, {
      className: 'logprob-vector',
      tokenColor: '#16a34cff',
      format: (v) => v.toFixed(3),
      isLogprob: true,
      // Only show ⋯ inside the last cell if ellipsis is indeed last
      ellipsisLast: isEllipsisLast,
      isDarkMode,
    });

    // Precompute selection center Y for stage label alignment
    if (hv2) {
      const arrowStartY = hv2.bottomY + OUTPUT.ARROW_START_OFFSET;
      const arrowEndY = arrowStartY + OUTPUT.ARROW_HEIGHT;
      const tokenY = arrowEndY + OUTPUT.LABEL_GAP + 10;
      const percentageY = tokenY + OUTPUT.LABEL_SPACING;
      selectionCenterY = (tokenY + percentageY) / 2;
    }

    // Arrow from extracted embedding to logprob vector
    if (hv1 && hv2) {
      // During backprop, reverse arrow direction to point upwards
      const isTrainingBackprop = step && step.viz_mode === 'backprop';
      const startY = isTrainingBackprop ? hv2.topY - 8 : hv1.bottomY + 6;
      const endY = isTrainingBackprop ? hv1.bottomY + 6 : hv2.topY - 8;

      drawArrow(underlays, horizCenterX, startY, horizCenterX, endY, {
        withBox: true,
        className: 'logprob-arrow',
        isMobile,
      });
    }
  }

  // Render distribution labels and selection
  if (subStep >= 8 && hv2) {
    // Determine target index for training mode
    let trainingTargetIdx = -1;
    const isTrainingMode = !!step.training_target_token;
    if (isTrainingMode) {
      const targetId = step.training_target_token.token_id;
      const targetTok = step.training_target_token.token;
      if (targetId != null) {
        trainingTargetIdx = candidates.findIndex((c) => c && c.token_id === targetId);
      }
      if (trainingTargetIdx === -1 && targetTok != null) {
        trainingTargetIdx = candidates.findIndex((c) => c && c.token === targetTok);
      }
    }

    renderDistributionLabels(
      group,
      candidates,
      hv2,
      selectedIdx,
      isTrainingMode
        ? {
            isTraining: true,
            targetIdx: trainingTargetIdx,
          }
        : undefined
    );

    // Training view: render vertical bar chart showing predicted probabilities
    if (isTrainingMode) {
      try {
        const arrowStartY = hv2.bottomY + OUTPUT.ARROW_START_OFFSET;
        const arrowEndY = arrowStartY + OUTPUT.ARROW_HEIGHT;
        const tokenY = arrowEndY + OUTPUT.LABEL_GAP + 10;

        // Step 9: Show vertical bar chart below token labels
        if (subStep >= 9) {
          const barChartMeta = renderTrainingBarChart(
            group,
            candidates,
            hv2,
            trainingTargetIdx,
            tokenY,
            isDarkMode
          );

          // Draw highlight rectangle around target token column
          if (
            barChartMeta &&
            trainingTargetIdx >= 0 &&
            hv2.centers &&
            trainingTargetIdx < hv2.centers.length
          ) {
            const cx = hv2.centers[trainingTargetIdx];
            const cellHalf = (hv2.cellWidth || 26) / 2;
            const hlPad = OUTPUT.HIGHLIGHT_PADDING;
            const left = cx - cellHalf - hlPad;
            const right = cx + cellHalf + hlPad;
            const top = hv2.topY - OUTPUT.ARROW_START_OFFSET;
            const bottom = barChartMeta.bottomY + OUTPUT.ARROW_START_OFFSET;
            const rectW = Math.max(28, right - left);
            const rectH = Math.max(28, bottom - top);

            group
              .append('rect')
              .attr('class', 'training-target-highlight-rect')
              .attr('x', left)
              .attr('y', top)
              .attr('width', rectW)
              .attr('height', rectH)
              .attr('rx', OUTPUT.HIGHLIGHT_RADIUS)
              .style('fill', 'none')
              .style('stroke', OUTPUT_ARROWS.HIGHLIGHT_STROKE_COLOR)
              .style('stroke-width', OUTPUT.HIGHLIGHT_STROKE_WIDTH)
              .style('opacity', 0)
              .style('pointer-events', 'none');
          }
        }
      } catch {
        // Non-fatal; skip training-specific rendering if geometry is missing
      }
    }
  }

  // Render append arrow preview
  if (subStep >= 11 && hv2) {
    renderAppendArrow(mainRoot, step, layout, svgRoot, hv2, selectedIdx, candidates, maxTokens);
  }

  const extractedCenterY = hv1 ? (hv1.topY + hv1.bottomY) / 2 : null;
  const logprobCenterY = hv2 ? (hv2.topY + hv2.bottomY) / 2 : null;

  return { extractedCenterY, logprobCenterY, selectionCenterY };
}

// Helper: Find selected candidate index
function findSelectedIndex(step, allCandidates, candidates, maxTokens) {
  const selectedTokenId = step?.selected_token?.token_id;
  const selectedTokenStr = step?.selected_token?.token;

  const findIdx = (arr) => {
    if (!arr || !arr.length) return -1;
    if (selectedTokenId != null) {
      const byId = arr.findIndex((c) => c && c.token_id === selectedTokenId);
      if (byId !== -1) return byId;
    }
    if (selectedTokenStr != null) {
      const byStr = arr.findIndex((c) => c && c.token === selectedTokenStr);
      if (byStr !== -1) return byStr;
    }
    return -1;
  };

  const selectedIdxAll = findIdx(allCandidates);

  if (selectedIdxAll >= 0) {
    if (allCandidates.length > maxTokens && selectedIdxAll >= maxTokens) {
      return candidates.length - 1; // ellipsis cell
    }
    return selectedIdxAll;
  }

  return 0; // safe fallback
}

// Helper: Render extracted embedding
function renderExtractedEmbedding(
  group,
  extractionBg,
  rm,
  horizCenterX,
  horizY,
  computedEmbeddings,
  rightmostActualIndex,
  tokenColor,
  baseFill,
  isDarkMode,
  metas,
  isBackprop
) {
  const extracted = extractionBg.append('g').attr('class', 'extracted-embedding');

  if (rm) {
    extracted
      .append('rect')
      .attr('x', rm.centerX - rm.width / 2)
      .attr('y', rm.topY)
      .attr('width', rm.width)
      .attr('height', rm.height)
      .attr('rx', 4)
      .style('fill', 'none')
      .style('stroke', getVectorBoxColors(tokenColor, { isDarkMode }).stroke);

    const targetHalfHeight = (18 + 12) / 2;
    const dx = horizCenterX - rm.centerX;
    const dy = horizY + targetHalfHeight - (rm.topY + rm.height / 2);
    extracted.attr('data-dx', dx).attr('data-dy', dy);
  }

  const fullValues = computedEmbeddings?.ffn?.[rightmostActualIndex] || [];
  // Show first 3 values, ellipsis, last 3 values (similar to hidden state pattern)
  const firstVals = fullValues.slice(0, 3);
  const lastVals = fullValues.slice(-3);
  const sampleValues =
    fullValues.length > 6
      ? [...firstVals, '...', ...lastVals]
      : [fullValues[0], '...', fullValues[fullValues.length - 1]];

  const hv1 = drawHorizontalVector(group, horizCenterX, horizY, sampleValues, {
    className: 'extracted-horizontal',
    tokenColor,
    bgFill: baseFill,
    isDarkMode,
  });

  // Draw extracted path arrow
  if (rm && hv1) {
    const startX = rm.centerX;
    const startY = rm.topY + rm.height + 4;
    const hv1RightX = horizCenterX + hv1.width / 2;
    const hv1CenterY = horizY + 15;

    // Special case: when there's only a single token, use a straight vertical arrow
    // instead of a curved one, as it looks weird with the curve.
    // We add a tiny horizontal offset (0.1px) to ensure the bounding box has non-zero width,
    // which is required for SVG gradients (objectBoundingBox) to render correctly on the stroke.
    const isSingleToken = metas && metas.length === 1;
    const pathD = isSingleToken
      ? `M ${startX},${startY} L ${startX + 0.1},${horizY - 6}`
      : verticalThenHorizontalRoundedPath(startX, startY, hv1RightX, hv1CenterY, 20);

    const extraClass = isBackprop ? ' bp-last-embedding-connection' : '';
    extractionBg
      .append('path')
      .attr('d', pathD)
      .attr('class', `extracted-path-arrow${extraClass}`)
      .style('fill', 'none')
      .style('stroke', OUTPUT_ARROWS.EXTRACTED_STROKE)
      .style('stroke-width', OUTPUT_ARROWS.EXTRACTED_WIDTH)
      .style('stroke-linecap', 'round')
      .style('stroke-linejoin', 'round')
      .style('opacity', OUTPUT_ARROWS.EXTRACTED_OPACITY);
  }

  // Apply hidden-state-grey if needed (for backprop)
  if (isBackprop) {
    extracted.classed('hidden-state-grey', true);
  }

  return hv1;
}

// Helper: Render distribution labels
function renderDistributionLabels(group, candidates, hv2, selectedIdx, trainingOpts) {
  const arrowStartY = hv2.bottomY + OUTPUT.ARROW_START_OFFSET;
  const arrowEndY = arrowStartY + OUTPUT.ARROW_HEIGHT;
  const labelGap = OUTPUT.LABEL_GAP;
  const labelSpacing = OUTPUT.LABEL_SPACING;
  const isTraining = trainingOpts?.isTraining || false;
  const targetIdx = trainingOpts?.targetIdx ?? -1;

  // Find ellipsis index if it exists
  const ellipsisIdx = candidates.findIndex((c) => c.isEllipsis || c.token === '...');
  const hasEllipsis = ellipsisIdx >= 0;

  // Render arrows and labels for each candidate (except ellipsis)
  candidates.forEach((candidate, i) => {
    // Skip ellipsis marker - it will be rendered separately
    if (i === ellipsisIdx) return;

    const cx = hv2.centers[i];
    const token = candidate?.token ?? '';
    const prob = candidate?.prob ?? 0;
    const percentage = (prob * 100).toFixed(1) + '%';
    const isSelected = i === selectedIdx;
    const isTarget = isTraining && i === targetIdx;

    const itemG = group
      .append('g')
      .attr('class', `distribution-item${isSelected ? ' selected' : ''}`)
      .attr('data-index', String(i));

    // Arrow
    itemG
      .append('line')
      .attr('x1', cx)
      .attr('y1', arrowStartY)
      .attr('x2', cx)
      .attr('y2', arrowEndY)
      .attr('class', 'distribution-arrow')
      .style('stroke', OUTPUT_ARROWS.DISTRIBUTION_STROKE)
      .style('stroke-width', OUTPUT_ARROWS.DISTRIBUTION_WIDTH)
      .style('opacity', OUTPUT_ARROWS.DISTRIBUTION_OPACITY);

    itemG
      .append('polygon')
      .attr(
        'points',
        `${cx},${arrowEndY} ${cx - OUTPUT_ARROWS.DISTRIBUTION_HEAD_SIZE},${arrowEndY - 6} ${cx + OUTPUT_ARROWS.DISTRIBUTION_HEAD_SIZE},${arrowEndY - 6}`
      )
      .attr('class', 'distribution-arrow-head')
      .style('fill', OUTPUT_ARROWS.DISTRIBUTION_STROKE)
      .style('opacity', OUTPUT_ARROWS.DISTRIBUTION_OPACITY);

    // Token label
    const displayToken = processTokenForVisualization(token);
    const maxChars = Math.floor((hv2.cellWidth - 4) / OUTPUT.MAX_TOKEN_CHARS_APPROX);
    const truncatedToken =
      displayToken.length > maxChars ? displayToken.substring(0, maxChars - 1) + '…' : displayToken;

    const tokenLabelY = arrowEndY + labelGap + 10;

    // Yellow highlight background for training target token (like doc-token-target)
    if (isTarget) {
      const approxTextWidth = Math.max(truncatedToken.length * 7.5, 20);
      itemG
        .append('rect')
        .attr('class', 'distribution-token-highlight-bg')
        .attr('x', cx - approxTextWidth / 2 - 4)
        .attr('y', tokenLabelY - 11)
        .attr('width', approxTextWidth + 8)
        .attr('height', 16)
        .attr('rx', 3)
        .style('fill', 'rgba(245, 241, 0, 0.527)');
    }

    itemG
      .append('text')
      .attr('x', cx)
      .attr('y', tokenLabelY)
      .attr('text-anchor', 'middle')
      .attr('class', `distribution-token-label${isTarget ? ' doc-token-target' : ''}`)
      .style('font-size', OUTPUT.TOKEN_LABEL_SIZE)
      .style('font-weight', isTarget ? '700' : 'normal')
      .style('fill', isTarget ? '#323301' : 'var(--viz-text-color)')
      .text(truncatedToken);

    // Percentage label (skip in training mode - shown below bars instead)
    if (!isTraining) {
      itemG
        .append('text')
        .attr('x', cx)
        .attr('y', arrowEndY + labelGap + 10 + labelSpacing)
        .attr('text-anchor', 'middle')
        .attr('class', 'distribution-percentage-label')
        .style('font-size', OUTPUT.PERCENTAGE_LABEL_SIZE)
        .style('font-weight', 'normal')
        .style('fill', 'var(--viz-muted-color)')
        .text(percentage);
    }
  });

  // Highlight rectangle around selected candidate
  if (hv2.centers.length > 0) {
    const selCx = hv2.centers[selectedIdx];
    if (typeof selCx === 'number') {
      const cellHalf = (hv2.cellWidth || 26) / 2;
      const left = selCx - cellHalf - OUTPUT.HIGHLIGHT_PADDING;
      const right = selCx + cellHalf + OUTPUT.HIGHLIGHT_PADDING;
      const top = hv2.topY - OUTPUT.ARROW_START_OFFSET;

      const isEllipsisSelected = selectedIdx === ellipsisIdx;
      const bottom = isEllipsisSelected
        ? hv2.bottomY + OUTPUT.ARROW_START_OFFSET
        : arrowEndY + labelGap + 10 + labelSpacing + OUTPUT.ARROW_START_OFFSET;

      const rectW = Math.max(28, right - left);
      const rectH = Math.max(28, bottom - top);

      group
        .append('rect')
        .attr('class', 'distribution-highlight-rect')
        .attr('x', left)
        .attr('y', top)
        .attr('width', rectW)
        .attr('height', rectH)
        .attr('rx', OUTPUT.HIGHLIGHT_RADIUS)
        .style('fill', 'none')
        .style('stroke', OUTPUT_ARROWS.HIGHLIGHT_STROKE_COLOR)
        .style('stroke-width', OUTPUT.HIGHLIGHT_STROKE_WIDTH)
        .style('opacity', 0)
        .style('pointer-events', 'none');
    }
  }

  // Ellipsis label (render if found)
  if (hasEllipsis && hv2.centers.length > ellipsisIdx) {
    const ellipsisCx = hv2.centers[ellipsisIdx];
    const tokenY = arrowEndY + labelGap + 10;
    const percentageY = tokenY + labelSpacing;
    const ellipsisY = (tokenY + percentageY) / 2;

    group
      .append('text')
      .attr('x', ellipsisCx)
      .attr('y', ellipsisY)
      .attr('text-anchor', 'middle')
      .attr('class', 'distribution-ellipsis-label')
      .style('font-size', OUTPUT.ELLIPSIS_SIZE)
      .style('font-weight', 'normal')
      .style('fill', OUTPUT_ARROWS.ELLIPSIS_COLOR)
      .text('⋯');
  }
}

// Helper: Render vertical bar chart for training view (replaces target vector)
// Returns { bottomY } for highlight rect positioning
function renderTrainingBarChart(group, candidates, hv2, targetIdx, tokenLabelY, isDarkMode) {
  const BAR_MAX_HEIGHT = 100; // maximum bar height in pixels
  const BAR_GAP_FROM_LABELS = 12; // gap between token labels and bar area
  const BAR_AREA_TOP_Y = tokenLabelY + BAR_GAP_FROM_LABELS; // 100% level
  const BAR_WIDTH = Math.min(hv2.cellWidth * 0.55, 20); // compact bar width
  const ARROW_HEAD_SIZE = 5;
  const MIN_ARROW_LENGTH = 12; // minimum arrow length so it's always visible
  const LABEL_OFFSET = 14; // distance below bar bottom for percentage label

  const barChartGroup = group.append('g').attr('class', 'training-bar-chart');

  // Baseline (0% level) is at the bottom of the bar area
  const barBottomY = BAR_AREA_TOP_Y + BAR_MAX_HEIGHT;
  // The percentage labels sit below the bar area
  const percentageLabelY = barBottomY + LABEL_OFFSET;

  candidates.forEach((candidate, i) => {
    if (!hv2.centers || typeof hv2.centers[i] !== 'number') return;
    // Skip ellipsis
    if (candidate && (candidate.isEllipsis || candidate.token === '...')) return;

    const cx = hv2.centers[i];
    const prob = candidate?.prob ?? 0;
    const barHeight = Math.max(2, prob * BAR_MAX_HEIGHT);
    const isTarget = i === targetIdx;
    const percentage = (prob * 100).toFixed(1) + '%';

    const itemG = barChartGroup
      .append('g')
      .attr('class', `training-bar-item${isTarget ? ' target' : ''}`)
      .attr('data-index', String(i));

    // Bar grows upward from the baseline
    const barTopY = barBottomY - barHeight;

    // Bar fill
    itemG
      .append('rect')
      .attr('class', 'training-bar')
      .attr('x', cx - BAR_WIDTH / 2)
      .attr('y', barTopY)
      .attr('width', BAR_WIDTH)
      .attr('height', barHeight)
      .attr('rx', 2)
      .style('fill', isTarget ? '#007E66' : '#bbb')
      .style('opacity', 1);

    // Arrow showing probability shift direction
    if (isTarget) {
      // Green upward arrow: from top of bar up to the 100% level (BAR_AREA_TOP_Y)
      // Represents "probability should increase toward 100%"
      const distanceToTop = barTopY - BAR_AREA_TOP_Y;
      const arrowTipY = BAR_AREA_TOP_Y; // always points to 100%
      // If bar is very close to 100%, ensure minimum arrow visibility
      const arrowBaseY =
        distanceToTop < MIN_ARROW_LENGTH
          ? BAR_AREA_TOP_Y + Math.max(MIN_ARROW_LENGTH, distanceToTop)
          : barTopY;

      itemG
        .append('line')
        .attr('class', 'training-bar-arrow training-bar-arrow-up')
        .attr('x1', cx)
        .attr('y1', arrowBaseY)
        .attr('x2', cx)
        .attr('y2', arrowTipY)
        .style('stroke', '#00DA61')
        .style('stroke-width', 2.5)
        .style('stroke-linecap', 'round');

      itemG
        .append('polygon')
        .attr('class', 'training-bar-arrow-head training-bar-arrow-up')
        .attr(
          'points',
          `${cx},${arrowTipY} ${cx - ARROW_HEAD_SIZE},${arrowTipY + ARROW_HEAD_SIZE * 1.5} ${cx + ARROW_HEAD_SIZE},${arrowTipY + ARROW_HEAD_SIZE * 1.5}`
        )
        .style('fill', '#00DA61');
    } else {
      // Red downward arrow: from top of bar down to the baseline (barBottomY)
      // Represents "probability should decrease toward 0%"
      const arrowTipY = barBottomY; // always points to baseline
      // If bar is very short, ensure minimum arrow visibility by extending above bar
      const arrowStartY =
        barHeight < MIN_ARROW_LENGTH ? barBottomY - Math.max(MIN_ARROW_LENGTH, barHeight) : barTopY;

      itemG
        .append('line')
        .attr('class', 'training-bar-arrow training-bar-arrow-down')
        .attr('x1', cx)
        .attr('y1', arrowStartY)
        .attr('x2', cx)
        .attr('y2', arrowTipY)
        .style('stroke', 'rgba(239, 68, 68, 0.9)')
        .style('stroke-width', 2.5)
        .style('stroke-linecap', 'round');

      itemG
        .append('polygon')
        .attr('class', 'training-bar-arrow-head training-bar-arrow-down')
        .attr(
          'points',
          `${cx},${arrowTipY} ${cx - ARROW_HEAD_SIZE},${arrowTipY - ARROW_HEAD_SIZE * 1.5} ${cx + ARROW_HEAD_SIZE},${arrowTipY - ARROW_HEAD_SIZE * 1.5}`
        )
        .style('fill', 'rgba(239, 68, 68, 0.9)');
    }

    // Percentage label below bar area
    itemG
      .append('text')
      .attr('class', 'training-bar-percentage')
      .attr('x', cx)
      .attr('y', percentageLabelY)
      .attr('text-anchor', 'middle')
      .style('font-size', '11px')
      .style('font-weight', isTarget ? '700' : 'normal')
      .style('fill', isTarget ? (isDarkMode ? '#4ade80' : '#007E66') : 'var(--viz-muted-color)')
      .text(percentage);
  });

  return { bottomY: percentageLabelY + 4 };
}

// Helper: Render append arrow
function renderAppendArrow(mainRoot, step, layout, svgRoot, hv2, selectedIdx, candidates) {
  try {
    const sx = hv2.centers?.[selectedIdx];
    if (typeof sx !== 'number') return;

    const arrowStartY = hv2.bottomY + OUTPUT.ARROW_START_OFFSET;
    const arrowEndY = arrowStartY + OUTPUT.ARROW_HEIGHT;
    const labelGap = OUTPUT.LABEL_GAP;
    const labelSpacing = OUTPUT.LABEL_SPACING;

    // Check if selected item is ellipsis
    const ellipsisIdx = candidates.findIndex((c) => c.isEllipsis || c.token === '...');
    const isEllipsisSelected = selectedIdx === ellipsisIdx;

    const rectBottom = isEllipsisSelected
      ? hv2.bottomY + OUTPUT.ARROW_START_OFFSET
      : arrowEndY + labelGap + 10 + labelSpacing + OUTPUT.ARROW_START_OFFSET;

    const y1 = rectBottom + 4;
    const downY = y1 + OUTPUT.APPEND_PATH_DOWN;

    const mainRootSel = d3.select(svgRoot).select('g.visualization-main');
    const tokenNodes = mainRootSel.selectAll('.token-group .token').nodes();

    if (tokenNodes && tokenNodes.length > 0) {
      const { targetX, targetY, nextTokenDisplay, nextWidth, nextTokenColor } =
        calculateAppendTarget(tokenNodes, step, layout);

      const pathD = buildAppendPath(sx, y1, downY, targetX, targetY);

      renderAppendPath(mainRootSel, pathD);
      renderAppendTokenPreview(
        mainRootSel,
        targetX,
        layout.tokenY,
        nextTokenDisplay,
        nextWidth,
        nextTokenColor
      );
    }
  } catch {
    // Non-fatal: skip if geometry missing
  }
}

// Helper: Calculate append target position
function calculateAppendTarget(tokenNodes, step, layout) {
  const lastTokenNode = tokenNodes[tokenNodes.length - 1];
  const lastSel = d3.select(lastTokenNode);
  const transform = lastSel.attr('transform') || 'translate(0,0)';
  const m = /translate\(([-\d.]+),\s*([-\d.]+)\)/.exec(transform);
  const lastCenterX = m ? parseFloat(m[1]) : 0;
  const lastWidth = parseFloat(lastSel.select('rect.token-box').attr('width')) || 36;

  const gap = 70;
  const nextTokenStr = step?.selected_token?.token || '';
  const nextTokenDisplay = processTokenForVisualization(nextTokenStr);
  const nextWidth = Math.max(36, nextTokenDisplay.length * 10 + 16);
  const targetX = lastCenterX + lastWidth / 2 + gap + nextWidth / 2;
  const targetY = layout.tokenY + 30;

  const nextTokenIndex = step.tokens ? step.tokens.length : 0;
  const nextTokenColor = getTokenColor(nextTokenIndex);

  return { targetX, targetY, nextTokenDisplay, nextWidth, nextTokenColor };
}

// Helper: Build append path
function buildAppendPath(sx, y1, downY, targetX, targetY) {
  const r = OUTPUT.APPEND_PATH_RADIUS;
  const x1 = sx;
  const x2 = targetX;
  const y2 = targetY;
  const hY = downY;

  return [
    `M ${x1},${y1}`,
    `L ${x1},${hY - r}`,
    `Q ${x1},${hY} ${x1 + r},${hY}`,
    `L ${x2 - r},${hY}`,
    `Q ${x2},${hY} ${x2},${hY - r}`,
    `L ${x2},${y2}`,
  ].join(' ');
}

// Helper: Render append path
function renderAppendPath(mainRootSel, pathD) {
  const backLayer = mainRootSel.insert('g', ':first-child').attr('class', 'append-path-underlay');

  const markerId = `append-arrowhead-${Math.random().toString(36).slice(2, 9)}`;
  const defs = backLayer.append('defs');

  defs
    .append('marker')
    .attr('id', markerId)
    .attr('markerWidth', OUTPUT.MARKER_SIZE)
    .attr('markerHeight', OUTPUT.MARKER_SIZE)
    .attr('refX', 3)
    .attr('refY', 3)
    .attr('orient', 'auto')
    .append('polygon')
    .attr('points', '0 0, 6 3, 0 6')
    .attr('fill', OUTPUT_ARROWS.APPEND_MARKER_FILL);

  backLayer
    .append('path')
    .attr('d', pathD)
    .attr('class', 'append-path-arrow')
    .style('fill', 'none')
    .style('stroke', OUTPUT_ARROWS.APPEND_STROKE)
    .style('stroke-width', OUTPUT_ARROWS.APPEND_WIDTH)
    .style('stroke-dasharray', OUTPUT_ARROWS.APPEND_DASHARRAY)
    .style('stroke-linecap', 'round')
    .style('stroke-linejoin', 'round')
    .style('opacity', OUTPUT_ARROWS.APPEND_OPACITY_INITIAL)
    .attr('marker-end', `url(#${markerId})`);
}

// Helper: Render append token preview
function renderAppendTokenPreview(
  mainRootSel,
  targetX,
  tokenY,
  nextTokenDisplay,
  nextWidth,
  nextTokenColor
) {
  const previewG = mainRootSel
    .append('g')
    .attr('class', 'append-target-token-preview')
    .attr('transform', `translate(${targetX}, ${tokenY})`);

  previewG
    .append('text')
    .attr('text-anchor', 'middle')
    .attr('y', 6)
    .attr('class', 'preview-token-text')
    .style('font-size', TOKEN.TEXT_SIZE)
    .style('font-family', FONTS.FAMILY_UI)
    .style('font-weight', FONTS.WEIGHT_MEDIUM)
    .style('fill', 'var(--viz-token-text)')
    .style('opacity', 0)
    .text(nextTokenDisplay);

  previewG
    .append('line')
    .attr('x1', -nextWidth / 2 + 8)
    .attr('y1', 18)
    .attr('x2', nextWidth / 2 - 8)
    .attr('y2', 18)
    .attr('class', 'preview-token-underline')
    .style('stroke', nextTokenColor)
    .style('stroke-width', 6)
    .style('stroke-linecap', 'round')
    .style('opacity', 0);
}
