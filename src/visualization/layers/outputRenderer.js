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
import { OUTPUT, LAYOUT as CONSTS, OUTPUT_ARROWS } from '../core/constants';

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
      bottomInfo.metas
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
      drawArrow(underlays, horizCenterX, hv1.bottomY + 6, horizCenterX, hv2.topY - 8, {
        withBox: true,
        className: 'logprob-arrow',
      });
    }
  }

  // Render distribution labels and selection
  if (subStep >= 8 && hv2) {
    renderDistributionLabels(group, candidates, hv2, selectedIdx);

    // Training view: two-step rendering
    if (step.training_target_token) {
      try {
        const arrowStartY = hv2.bottomY + OUTPUT.ARROW_START_OFFSET;
        const arrowEndY = arrowStartY + OUTPUT.ARROW_HEIGHT;
        const tokenY = arrowEndY + OUTPUT.LABEL_GAP + 10;
        const percentageY = tokenY + OUTPUT.LABEL_SPACING;

        // Determine target index by id or token string
        const targetId = step.training_target_token.token_id;
        const targetTok = step.training_target_token.token;
        const targetIdx = (() => {
          let idx = -1;
          if (targetId != null) {
            idx = candidates.findIndex((c) => c && c.token_id === targetId);
          }
          if (idx === -1 && targetTok != null) {
            idx = candidates.findIndex((c) => c && c.token === targetTok);
          }
          return idx;
        })();

        // Build target vector aligned with candidates (use logprob sizing for alignment)
        const targetValues = candidates.map((c, i) => (i === targetIdx ? 1 : 0));

        // Step 9: Show target vector + arrow to target token probability
        if (subStep >= 9) {
          // Move target vector a bit lower to fit upward arrows
          const targetTopY = percentageY + 40;
          const tv = drawHorizontalVector(group, horizCenterX, targetTopY, targetValues, {
            className: 'target-vector',
            tokenColor: '#dc2626ff', // red
            format: (v) => (typeof v === 'number' ? v.toFixed(3) : ''),
            isLogprob: true,
            // Mirror the logprob row when ellipsis is last; otherwise we'll overlay ⋯ manually
            ellipsisLast: isEllipsisLast,
            isDarkMode,
          });

          // If ellipsis exists but is not last, overlay a centered ⋯ in the target vector too
          if (
            tv &&
            ellipsisIdxForCandidates >= 0 &&
            !isEllipsisLast &&
            tv.centers &&
            ellipsisIdxForCandidates < tv.centers.length
          ) {
            const ex = tv.centers[ellipsisIdxForCandidates];
            const ey = (tv.topY + tv.bottomY) / 2;
            group
              .append('text')
              .attr('x', ex)
              .attr('y', ey + 6)
              .attr('text-anchor', 'middle')
              .attr('class', 'target-ellipsis-label')
              .style('font-size', OUTPUT.ELLIPSIS_SIZE)
              .style('font-weight', 'normal')
              .style('fill', 'var(--viz-text-color)')
              .text('⋯');
          }

          // Draw highlight rectangle around the TARGET token column spanning from
          // the output distribution vector down to the target vector. This mirrors
          // the rounded outline used for the selected token in text generation,
          // but centers on the training target token instead.
          if (
            hv2 &&
            tv &&
            hv2.centers &&
            tv.centers &&
            targetIdx >= 0 &&
            targetIdx < hv2.centers.length &&
            targetIdx < tv.centers.length
          ) {
            const cxTop = hv2.centers[targetIdx];
            const cxBottom = tv.centers[targetIdx];
            const halfTop = (hv2.cellWidth || 26) / 2;
            const halfBottom = (tv.cellWidth || hv2.cellWidth || 26) / 2;

            const left =
              Math.min(cxTop - halfTop, cxBottom - halfBottom) - OUTPUT.HIGHLIGHT_PADDING;
            const right =
              Math.max(cxTop + halfTop, cxBottom + halfBottom) + OUTPUT.HIGHLIGHT_PADDING;
            const top = hv2.topY - OUTPUT.ARROW_START_OFFSET;
            const bottom = tv.bottomY + OUTPUT.ARROW_START_OFFSET;

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

          // Draw single arrow from target cell to its probability label
          if (tv && hv2 && hv2.centers && targetIdx >= 0 && targetIdx < hv2.centers.length) {
            const cx = hv2.centers[targetIdx];
            if (typeof cx === 'number') {
              // Match down arrows style and fixed length but shift the up arrows slightly
              // downward so they appear closer to the bottom (more visually balanced).
              // We anchor the up-arrow tip a bit below the percentage label and keep
              // the same arrow height as the down arrows.
              const arrowEndYUp = percentageY + OUTPUT.ARROW_START_OFFSET;
              const arrowStartYUp = arrowEndYUp + OUTPUT.ARROW_HEIGHT;

              group
                .append('line')
                .attr('x1', cx)
                .attr('y1', arrowStartYUp)
                .attr('x2', cx)
                .attr('y2', arrowEndYUp)
                .attr('class', 'target-to-prob-arrow')
                .style('stroke', OUTPUT_ARROWS.DISTRIBUTION_STROKE)
                .style('stroke-width', OUTPUT_ARROWS.DISTRIBUTION_WIDTH)
                .style('opacity', OUTPUT_ARROWS.DISTRIBUTION_OPACITY);

              group
                .append('polygon')
                .attr(
                  'points',
                  `${cx},${arrowEndYUp} ${cx - OUTPUT_ARROWS.DISTRIBUTION_HEAD_SIZE},${arrowEndYUp + 6} ${cx + OUTPUT_ARROWS.DISTRIBUTION_HEAD_SIZE},${arrowEndYUp + 6}`
                )
                .attr('class', 'target-to-prob-arrow-head')
                .style('fill', OUTPUT_ARROWS.DISTRIBUTION_STROKE)
                .style('opacity', OUTPUT_ARROWS.DISTRIBUTION_OPACITY);
            }
          }
        }

        // Step 9+: Replace percentages with diffs + arrows from all target cells to diffs
        if (subStep >= 9) {
          // Replace percentage labels with differences (target - predicted)
          const items = group.selectAll('.distribution-item');
          items.each(function () {
            const ci = Number(d3.select(this).attr('data-index'));
            if (Number.isNaN(ci)) return;
            const c = candidates[ci];
            if (!hv2.centers || typeof hv2.centers[ci] !== 'number') return;
            if (c && (c.isEllipsis || c.token === '...')) return; // skip ellipsis cell
            const pred = typeof c?.prob === 'number' ? c.prob : 0;
            const tval = ci === targetIdx ? 1 : 0;
            const deltaPct = (tval - pred) * 100;
            const sign = deltaPct > 0 ? '+' : '';
            const color = deltaPct >= 0 ? '#16a34aff' : '#dc2626ff';

            const sel = d3.select(this).select('text.distribution-percentage-label');
            sel
              .attr('class', 'distribution-percentage-label target-diff-label')
              .style('font-weight', '700')
              .style('fill', color)
              .text(`${sign}${deltaPct.toFixed(1)}%`);
          });

          // Draw upward arrows from all target vector cells to difference labels
          const tv = group.select('.target-vector');
          if (tv && tv.node() && hv2 && hv2.centers) {
            // Use the same length and offsets as the down arrows but shift them
            // slightly downward so the up arrows sit closer to the bottom area.
            const arrowEndYUp = percentageY + OUTPUT.ARROW_START_OFFSET;
            const arrowStartYUp = arrowEndYUp + OUTPUT.ARROW_HEIGHT;

            candidates.forEach((c, i) => {
              if (c && (c.isEllipsis || c.token === '...')) return; // skip ellipsis cell
              const cx = hv2.centers[i];
              if (typeof cx !== 'number') return;

              group
                .append('line')
                .attr('x1', cx)
                .attr('y1', arrowStartYUp)
                .attr('x2', cx)
                .attr('y2', arrowEndYUp)
                .attr('class', 'target-diff-arrow')
                .style('stroke', OUTPUT_ARROWS.DISTRIBUTION_STROKE)
                .style('stroke-width', OUTPUT_ARROWS.DISTRIBUTION_WIDTH)
                .style('opacity', OUTPUT_ARROWS.DISTRIBUTION_OPACITY);

              group
                .append('polygon')
                .attr(
                  'points',
                  `${cx},${arrowEndYUp} ${cx - OUTPUT_ARROWS.DISTRIBUTION_HEAD_SIZE},${arrowEndYUp + 6} ${cx + OUTPUT_ARROWS.DISTRIBUTION_HEAD_SIZE},${arrowEndYUp + 6}`
                )
                .attr('class', 'target-diff-arrow-head')
                .style('fill', OUTPUT_ARROWS.DISTRIBUTION_STROKE)
                .style('opacity', OUTPUT_ARROWS.DISTRIBUTION_OPACITY);
            });
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
  metas
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
      .style('fill', baseFill)
      .style('stroke', getVectorBoxColors(tokenColor, { isDarkMode }).stroke);

    const targetHalfHeight = (18 + 12) / 2;
    const dx = horizCenterX - rm.centerX;
    const dy = horizY + targetHalfHeight - (rm.topY + rm.height / 2);
    extracted.attr('data-dx', dx).attr('data-dy', dy);
  }

  const sampleValues = (computedEmbeddings?.ffn?.[rightmostActualIndex] || []).slice(0, 8);
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
    // instead of a curved one, as it looks weird with the curve
    const isSingleToken = metas && metas.length === 1;
    const pathD = isSingleToken
      ? `M ${startX},${startY} L ${startX},${horizY - 6}`
      : verticalThenHorizontalRoundedPath(startX, startY, hv1RightX, hv1CenterY, 20);

    extractionBg
      .append('path')
      .attr('d', pathD)
      .attr('class', 'extracted-path-arrow')
      .style('fill', 'none')
      .style('stroke', OUTPUT_ARROWS.EXTRACTED_STROKE)
      .style('stroke-width', OUTPUT_ARROWS.EXTRACTED_WIDTH)
      .style('stroke-linecap', 'round')
      .style('stroke-linejoin', 'round')
      .style('opacity', OUTPUT_ARROWS.EXTRACTED_OPACITY);
  }

  return hv1;
}

// Helper: Render distribution labels
function renderDistributionLabels(group, candidates, hv2, selectedIdx) {
  const arrowStartY = hv2.bottomY + OUTPUT.ARROW_START_OFFSET;
  const arrowEndY = arrowStartY + OUTPUT.ARROW_HEIGHT;
  const labelGap = OUTPUT.LABEL_GAP;
  const labelSpacing = OUTPUT.LABEL_SPACING;

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

    itemG
      .append('text')
      .attr('x', cx)
      .attr('y', arrowEndY + labelGap + 10)
      .attr('text-anchor', 'middle')
      .attr('class', 'distribution-token-label')
      .style('font-size', OUTPUT.TOKEN_LABEL_SIZE)
      .style('font-weight', 'normal')
      .style('fill', 'var(--viz-text-color)')
      .text(truncatedToken);

    // Percentage label
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
    .style('font-size', '18px')
    .style('font-family', '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif')
    .style('font-weight', '500')
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
