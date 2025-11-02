import { useEffect, useRef, useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { useTranslation } from '../utils/i18n';
import * as d3 from 'd3';
import { gsap } from 'gsap';
import config from '../config';
import '../styles/visualization.css';

/**
 * VisualizationCanvas Component
 * Main SVG container for all D3 visualizations
 */
function VisualizationCanvas() {
  const { state, actions } = useApp();
  // Extract stable callbacks to avoid re-running effects when the provider re-renders
  const { onStepAnimationComplete } = actions;
  const { t } = useTranslation();
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [embeddingExpanded, setEmbeddingExpanded] = useState({});
  const tokensLayoutRef = useRef({ positions: [], widths: [], visibleIndices: [], gap: 24, shouldCollapse: false });
  const gsapRef = useRef(null);

  // Initialize SVG and get dimensions
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const svg = d3.select(svgRef.current);

    // Update SVG dimensions based on container
    const updateDimensions = () => {
      const rect = container.getBoundingClientRect();
      svg
        .attr('width', rect.width)
        .attr('height', rect.height);
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Render visualization based on current step
  useEffect(() => {
    if (!svgRef.current || !state.currentExample || state.currentStep === 0) return;

    const svg = d3.select(svgRef.current);
    const step = state.currentExample.generation_steps[state.currentStep - 1];
    const subStep = state.currentAnimationSubStep;

    // Clear previous visualization
    svg.selectAll('*').remove();

    // Create main groups for different visualization sections
    const g = svg.append('g').attr('class', 'visualization-main');

    const tokenGroup = g.append('g').attr('class', 'token-group');
    const embeddingGroup = g.append('g').attr('class', 'embedding-group'); // outside (top)
    const transformerGroup = g.append('g').attr('class', 'transformer-group'); // inside block
    const bottomEmbeddingGroup = g.append('g').attr('class', 'bottom-embedding-group'); // outside (bottom)
    const outputGroup = g.append('g').attr('class', 'output-group');

    // Get SVG dimensions
    const width = parseFloat(svg.attr('width')) || 800;
    const height = parseFloat(svg.attr('height')) || 900;

    // Determine if we need to collapse tokens
    const maxVisibleTokens = Math.floor(width / 140) - 1; // basic heuristic; dynamic sizing handled below
    const shouldCollapse = step.tokens.length > maxVisibleTokens && !isExpanded;

    // Layout configuration with proper spacing
    const layout = {
      tokenY: 80,
      embeddingY: 200, // shifted down to leave room for ID → embedding arrows
      margin: 20,
      tokenSpacing: 140,
      blockPadding: 30,
    };

    // 1. Render tokens
    renderTokens(tokenGroup, step, layout, width, shouldCollapse, maxVisibleTokens);

    // 2. Render embeddings
    const outerMeta = renderOuterEmbeddings(embeddingGroup, step, layout, width, shouldCollapse, maxVisibleTokens);

    // 3. New transformer block pipeline
    const blockMeta = renderTransformerBlock(transformerGroup, step, layout, width, outerMeta);

    // 4. Bottom outside embeddings + FFN arrows
    const bottomInfo = renderBottomEmbeddings(bottomEmbeddingGroup, step, layout, width, blockMeta);

    // 5. Output distribution below
    // Reduce vertical offset before the output area to keep bars within the canvas height
    const outputYOffset = 120;
    layout.outputY = bottomInfo.afterBottomY + outputYOffset;
    renderOutput(outputGroup, step, layout, width, bottomInfo, subStep);

    // Add expand/collapse button if needed
    if (step.tokens.length > maxVisibleTokens) {
      renderExpandButton(g, layout, width, isExpanded);
    }

    // Animate the sequence using GSAP - now controlled by sub-steps
    if (gsapRef.current) {
      gsapRef.current.kill();
      gsapRef.current = null;
    }

    const animDuration = 0.6; // Duration for each transition
    const isInitialStep = state.currentStep === 1;

    // Set initial states for all elements based on current sub-step
    // Everything before current sub-step should be visible, everything after should be hidden
    if (isInitialStep) {
      // Initial visualization: set states based on what should already be visible
      gsap.set(svgRef.current.querySelectorAll('.token'), { opacity: subStep >= 0 ? 1 : 0 });
      gsap.set(svgRef.current.querySelectorAll('.token-id'), { opacity: subStep >= 1 ? 1 : 0 });
      gsap.set(svgRef.current.querySelectorAll('.token-id-arrow'), { opacity: subStep >= 1 ? 1 : 0 });
      gsap.set(svgRef.current.querySelectorAll('.embedding-group, .embedding-group *'), { opacity: subStep >= 2 ? 1 : 0, y: subStep >= 2 ? 0 : -8 });
      gsap.set(svgRef.current.querySelectorAll('.id-to-emb-arrow'), { opacity: subStep >= 2 ? 1 : 0 });

      gsap.set(svgRef.current.querySelectorAll('.transformer-group .transformer-box'), { opacity: subStep >= 3 ? 1 : 0, scaleY: subStep >= 3 ? 1 : 0.95, transformOrigin: '50% 0%' });
      gsap.set(svgRef.current.querySelectorAll('.transformer-group .inside-top-embeddings, .transformer-group .inside-top-embeddings *'), { opacity: subStep >= 3 ? 1 : 0, y: subStep >= 3 ? 0 : -8 });
      gsap.set(svgRef.current.querySelectorAll('.outer-to-block-arrow'), { opacity: subStep >= 3 ? 1 : 0 });
      gsap.set(svgRef.current.querySelectorAll('.transformer-group .attention-mash, .transformer-group .attention-mash *'), { opacity: subStep >= 3 ? 1 : 0 });

      gsap.set(svgRef.current.querySelectorAll('.transformer-group .inside-bottom-embeddings, .transformer-group .inside-bottom-embeddings *'), { opacity: subStep >= 4 ? 1 : 0, y: subStep >= 4 ? 0 : 8 });
      gsap.set(svgRef.current.querySelectorAll('.ffn-arrow'), { opacity: subStep >= 4 ? 1 : 0 });

      gsap.set(svgRef.current.querySelectorAll('.bottom-embedding-group, .bottom-embedding-group *'), { opacity: subStep >= 5 ? 1 : 0, y: subStep >= 5 ? 0 : 8 });

      gsap.set(svgRef.current.querySelectorAll('.extracted-embedding'), { opacity: 0 });
      // Keep the connector path and rotated vector hidden until after the dummy fits in place
      gsap.set(svgRef.current.querySelectorAll('.extracted-path-arrow'), { opacity: subStep >= 7 ? 1 : 0 });
      gsap.set(svgRef.current.querySelectorAll('.extracted-horizontal'), { opacity: subStep >= 7 ? 1 : 0 });
      gsap.set(svgRef.current.querySelectorAll('.logprob-arrow'), { opacity: subStep >= 7 ? 1 : 0 });
      gsap.set(svgRef.current.querySelectorAll('.logprob-vector'), { opacity: subStep >= 7 ? 1 : 0 });
      gsap.set(svgRef.current.querySelectorAll('.distribution-bar'), { opacity: subStep >= 8 ? 1 : 0, scaleY: subStep >= 8 ? 1 : 0.1, transformOrigin: '50% 100%' });
      gsap.set(svgRef.current.querySelectorAll('.distribution-token-label, .distribution-percentage-label'), { opacity: subStep >= 8 ? 1 : 0 });
    } else {
      // Subsequent steps: keep previous stacks visible based on sub-step
      gsap.set(svgRef.current.querySelectorAll('.token.prev-token'), { opacity: 1 });
      gsap.set(svgRef.current.querySelectorAll('.token.new-token'), { opacity: subStep >= 0 ? 1 : 0 });
      gsap.set(svgRef.current.querySelectorAll('.token-id.prev-token'), { opacity: 1 });
      gsap.set(svgRef.current.querySelectorAll('.token-id.new-token'), { opacity: subStep >= 1 ? 1 : 0 });
      gsap.set(svgRef.current.querySelectorAll('.token-id-arrow.prev-token'), { opacity: 1 });
      gsap.set(svgRef.current.querySelectorAll('.token-id-arrow.new-token'), { opacity: subStep >= 1 ? 1 : 0 });

      gsap.set(svgRef.current.querySelectorAll('.embedding-group .embedding-col.prev-token'), { opacity: 1, y: 0 });
      gsap.set(svgRef.current.querySelectorAll('.embedding-group .embedding-col.new-token'), { opacity: subStep >= 2 ? 1 : 0, y: subStep >= 2 ? 0 : -8 });
      gsap.set(svgRef.current.querySelectorAll('.id-to-emb-arrow.prev-token'), { opacity: 1 });
      gsap.set(svgRef.current.querySelectorAll('.id-to-emb-arrow.new-token'), { opacity: subStep >= 2 ? 1 : 0 });

      gsap.set(svgRef.current.querySelectorAll('.transformer-group .transformer-box'), { opacity: 1, scaleY: 1, transformOrigin: '50% 0%' });
      gsap.set(svgRef.current.querySelectorAll('.transformer-group .inside-top-embeddings .embedding-col.prev-token'), { opacity: 1, y: 0 });
      gsap.set(svgRef.current.querySelectorAll('.transformer-group .inside-top-embeddings .embedding-col.new-token'), { opacity: subStep >= 3 ? 1 : 0, y: subStep >= 3 ? 0 : -8 });
      gsap.set(svgRef.current.querySelectorAll('.outer-to-block-arrow.prev-token'), { opacity: 1 });
      gsap.set(svgRef.current.querySelectorAll('.outer-to-block-arrow.new-token'), { opacity: subStep >= 3 ? 1 : 0 });
      gsap.set(svgRef.current.querySelectorAll('.transformer-group .attention-mash, .transformer-group .attention-mash *'), { opacity: 1 });

      gsap.set(svgRef.current.querySelectorAll('.transformer-group .inside-bottom-embeddings .embedding-col.prev-token'), { opacity: 1, y: 0 });
      gsap.set(svgRef.current.querySelectorAll('.transformer-group .inside-bottom-embeddings .embedding-col.new-token'), { opacity: subStep >= 4 ? 1 : 0, y: subStep >= 4 ? 0 : 8 });
      gsap.set(svgRef.current.querySelectorAll('.ffn-arrow.prev-token'), { opacity: 1 });
      gsap.set(svgRef.current.querySelectorAll('.ffn-arrow.new-token'), { opacity: subStep >= 4 ? 1 : 0 });

      gsap.set(svgRef.current.querySelectorAll('.bottom-embedding-group .embedding-col.prev-token'), { opacity: 1, y: 0 });
      gsap.set(svgRef.current.querySelectorAll('.bottom-embedding-group .embedding-col.new-token'), { opacity: subStep >= 5 ? 1 : 0, y: subStep >= 5 ? 0 : 8 });

      gsap.set(svgRef.current.querySelectorAll('.extracted-embedding'), { opacity: 0 });
      // Keep the connector path and rotated vector hidden until after the dummy fits in place
      gsap.set(svgRef.current.querySelectorAll('.extracted-path-arrow'), { opacity: subStep >= 7 ? 1 : 0 });
      gsap.set(svgRef.current.querySelectorAll('.extracted-horizontal'), { opacity: subStep >= 7 ? 1 : 0 });
      gsap.set(svgRef.current.querySelectorAll('.logprob-arrow'), { opacity: subStep >= 7 ? 1 : 0 });
      gsap.set(svgRef.current.querySelectorAll('.logprob-vector'), { opacity: subStep >= 7 ? 1 : 0 });
      gsap.set(svgRef.current.querySelectorAll('.distribution-bar'), { opacity: subStep >= 8 ? 1 : 0, scaleY: subStep >= 8 ? 1 : 0.1, transformOrigin: '50% 100%' });
      gsap.set(svgRef.current.querySelectorAll('.distribution-token-label, .distribution-percentage-label'), { opacity: subStep >= 8 ? 1 : 0 });
    }

    const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

    // Animation sub-steps - only animate the CURRENT sub-step
    // 0: Show tokens only
    // 1: Show IDs (token->ID arrows + ID labels)
    // 2: Show embeddings (ID->embedding arrows + embedding columns)
    // 3: Show attention (transformer box + top embeddings + outer-to-block arrows + attention mash)
    // 4: Show feed-forward (bottom embeddings inside block + FFN arrows)
    // 5: Show extraction (bottom embeddings outside block)
    // 6: Extract & rotate last vector (move to center, rotate)
    // 7: Project to probabilities (show logprob vector)
    // 8: Show bar chart
    // 9: Select token & complete (highlight selection, add to output)

    if (isInitialStep) {
      // For the first step, animate all tokens together
      if (subStep === 0) {
        tl.to(svgRef.current.querySelectorAll('.token'), { opacity: 1, duration: animDuration, stagger: 0.02 });
      } else if (subStep === 1) {
        tl.to(svgRef.current.querySelectorAll('.token-id-arrow'), { opacity: 1, duration: animDuration * 0.5 });
        tl.to(svgRef.current.querySelectorAll('.token-id'), { opacity: 1, duration: animDuration, stagger: 0.02 }, '<');
      } else if (subStep === 2) {
        tl.to(svgRef.current.querySelectorAll('.embedding-group, .embedding-group *'), { opacity: 1, y: 0, duration: animDuration });
        tl.to(svgRef.current.querySelectorAll('.id-to-emb-arrow'), { opacity: 1, duration: animDuration * 0.5 }, '<');
      } else if (subStep === 3) {
        tl.to(svgRef.current.querySelectorAll('.transformer-group .transformer-box'), { opacity: 1, scaleY: 1, duration: animDuration * 0.8 });
        tl.to(svgRef.current.querySelectorAll('.transformer-group .inside-top-embeddings, .transformer-group .inside-top-embeddings *'), { opacity: 1, y: 0, duration: animDuration });
        tl.to(svgRef.current.querySelectorAll('.outer-to-block-arrow'), { opacity: 1, duration: animDuration * 0.5 }, '<');
        tl.to(svgRef.current.querySelectorAll('.transformer-group .attention-mash, .transformer-group .attention-mash *'), { opacity: 1, duration: animDuration });
      } else if (subStep === 4) {
        tl.to(svgRef.current.querySelectorAll('.transformer-group .inside-bottom-embeddings, .transformer-group .inside-bottom-embeddings *'), { opacity: 1, y: 0, duration: animDuration });
        tl.to(svgRef.current.querySelectorAll('.ffn-arrow'), { opacity: 1, duration: animDuration * 0.5 }, '<');
      } else if (subStep === 5) {
        tl.to(svgRef.current.querySelectorAll('.bottom-embedding-group, .bottom-embedding-group *'), { opacity: 1, y: 0, duration: animDuration });
      }
    } else {
      // Subsequent steps: animate only new token stack
      if (subStep === 0) {
        tl.to(svgRef.current.querySelectorAll('.token.new-token'), { opacity: 1, duration: animDuration });
      } else if (subStep === 1) {
        tl.to(svgRef.current.querySelectorAll('.token-id-arrow.new-token'), { opacity: 1, duration: animDuration * 0.5 });
        tl.to(svgRef.current.querySelectorAll('.token-id.new-token'), { opacity: 1, duration: animDuration }, '<');
      } else if (subStep === 2) {
        tl.to(svgRef.current.querySelectorAll('.embedding-group .embedding-col.new-token'), { opacity: 1, y: 0, duration: animDuration });
        tl.to(svgRef.current.querySelectorAll('.id-to-emb-arrow.new-token'), { opacity: 1, duration: animDuration * 0.5 }, '<');
      } else if (subStep === 3) {
        tl.to(svgRef.current.querySelectorAll('.transformer-group .inside-top-embeddings .embedding-col.new-token'), { opacity: 1, y: 0, duration: animDuration });
        tl.to(svgRef.current.querySelectorAll('.outer-to-block-arrow.new-token'), { opacity: 1, duration: animDuration * 0.5 }, '<');
      } else if (subStep === 4) {
        tl.to(svgRef.current.querySelectorAll('.transformer-group .inside-bottom-embeddings .embedding-col.new-token'), { opacity: 1, y: 0, duration: animDuration });
        tl.to(svgRef.current.querySelectorAll('.ffn-arrow.new-token'), { opacity: 1, duration: animDuration * 0.5 }, '<');
      } else if (subStep === 5) {
        tl.to(svgRef.current.querySelectorAll('.bottom-embedding-group .embedding-col.new-token'), { opacity: 1, y: 0, duration: animDuration });
      }
    }

    // Steps 6-9: Extract, rotate, project, and show output (same for both initial and subsequent)
    const extractedNode = svgRef.current.querySelector('.extracted-embedding');
    if (subStep === 6 && extractedNode) {
      const dx = parseFloat(extractedNode.getAttribute('data-dx') || '0');
      const dy = parseFloat(extractedNode.getAttribute('data-dy') || '0');
      // 1) Show the dummy rectangle
      tl.to(extractedNode, { opacity: 1, duration: animDuration * 0.4 });
      // 2) Move and rotate the dummy into place
      tl.to(extractedNode, { x: dx, y: dy, rotation: -90, scale: 1.3, transformOrigin: '50% 50%', duration: animDuration * 1.5, ease: 'power2.inOut' });
      // 3) After it fits, reveal the connector path and the rotated horizontal vector
      tl.to(svgRef.current.querySelectorAll('.extracted-path-arrow'), { opacity: 1, duration: animDuration * 0.4 }, '>-0.1');
      tl.to(svgRef.current.querySelectorAll('.extracted-horizontal'), { opacity: 1, scale: 1.35, transformOrigin: '50% 50%', duration: animDuration * 0.7 }, '<');
      // 4) Fade the dummy out
      tl.to(extractedNode, { opacity: 0.0, duration: animDuration * 0.4 }, '>-0.2');
    }

    if (subStep === 7) {
      tl.to(svgRef.current.querySelectorAll('.logprob-arrow'), { opacity: 1, duration: animDuration * 0.5 });
      tl.to(svgRef.current.querySelectorAll('.logprob-vector'), { opacity: 1, duration: animDuration }, '<');
    }

    if (subStep === 8) {
      tl.fromTo(svgRef.current.querySelectorAll('.distribution-bar'),
        { opacity: 0, scaleY: 0.1, transformOrigin: '50% 100%' },
        { opacity: 1, scaleY: 1, duration: animDuration * 1.2, stagger: 0.02, ease: 'power2.out' });
      tl.to(svgRef.current.querySelectorAll('.distribution-token-label, .distribution-percentage-label'),
        { opacity: 1, duration: animDuration * 0.8, stagger: 0.015 }, '<+0.2');
    }

    if (subStep === 9) {
      // Mark animation as complete and add token to output
      tl.eventCallback('onComplete', () => {
        onStepAnimationComplete();
      });
    }

    gsapRef.current = tl;

  }, [state.currentStep, state.currentExample, state.currentAnimationSubStep, isExpanded, embeddingExpanded, onStepAnimationComplete]);

  /**
   * Render token sequence
   */
  const renderTokens = (group, step, layout, width, shouldCollapse, maxVisibleTokens) => {
    const tokens = step.tokens;
    const lastActualIndex = tokens.length - 1;
    let visibleTokens = tokens;
    let tokenIndices = tokens.map((_, i) => i);

    // If collapsed, show only first few and last few tokens
    if (shouldCollapse) {
      const edgeCount = Math.floor(maxVisibleTokens / 2);
      const leftTokens = tokens.slice(0, edgeCount);
      const rightTokens = tokens.slice(-edgeCount);
      const leftIndices = tokenIndices.slice(0, edgeCount);
      const rightIndices = tokenIndices.slice(-edgeCount);

      visibleTokens = [...leftTokens, '...', ...rightTokens];
      tokenIndices = [...leftIndices, -1, ...rightIndices]; // -1 for ellipsis
    }

    // Compute dynamic widths based on token length (minimalistic wrap)
    const minBox = 36;
    const horizPadding = 16; // total horizontal padding
    const gap = 24; // equal gap between boxes
    const widths = visibleTokens.map(tok => tok === '...' ? 24 : Math.max(minBox, tok.length * 10 + horizPadding));
    const contentWidth = widths.reduce((a, b) => a + b, 0) + gap * (visibleTokens.length - 1);
    const startX = isExpanded ? layout.margin : (width - contentWidth) / 2;

    // Precompute center positions for each visible token
    const positions = [];
    let cursor = startX;
    widths.forEach((w, i) => {
      positions.push(cursor + w / 2);
      cursor += w + gap;
    });

    // Save for other renderers (embeddings/lines)
    tokensLayoutRef.current = {
      positions,
      widths,
      visibleIndices: tokenIndices,
      gap,
      shouldCollapse
    };

    visibleTokens.forEach((token, i) => {
      const actualIndex = tokenIndices[i];
      const x = positions[i];
      const isNew = actualIndex === lastActualIndex;
      const tokenG = group.append('g')
        .attr('class', `token ${isNew ? 'new-token' : 'prev-token'}`)
        .attr('transform', `translate(${x}, ${layout.tokenY})`);

      // Handle ellipsis - skip rendering for token, will render combined one later
      if (token === '...') {
        return;
      }

      // Calculate dynamic box width based on token length
      const estimatedWidth = widths[i];

      // Token box - much larger
      tokenG.append('rect')
        .attr('x', -estimatedWidth / 2)
        .attr('y', -22)
        .attr('width', estimatedWidth)
        .attr('height', 44)
        .attr('rx', 8)
        .attr('class', 'token-box')
        .style('fill', getTokenColor(actualIndex));

      // Token text - larger, regular font
      tokenG.append('text')
        .attr('text-anchor', 'middle')
        .attr('y', 6)
        .attr('class', 'token-text')
        .style('font-size', '18px')
        .style('font-family', '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif')
        .style('font-weight', '500')
        .style('fill', '#1a1a1a')
        .text(token);

      // Arrow from token to ID (now appended to tokenG for relative positioning)
      const arrowG = tokenG.append('g').attr('class', `token-id-arrow ${isNew ? 'new-token' : 'prev-token'}`);
      arrowG.append('line')
        .attr('x1', 0) // Relative to tokenG center
        .attr('y1', 26)
        .attr('x2', 0) // Relative to tokenG center
        .attr('y2', 52) // slightly longer for more top margin above ID
        .style('stroke', '#ccc')
        .style('stroke-width', 1.5)
        .style('opacity', 0.7);

      arrowG.append('polygon')
        .attr('points', `0,52 -4,46 4,46`) // Relative to tokenG center
        .style('fill', '#ccc')
        .style('opacity', 0.7);

      // Token ID below - monospace numeric
      tokenG.append('text')
        .attr('text-anchor', 'middle')
        .attr('y', 72) // pushed down to increase top and bottom margins
        .attr('class', `token-id ${isNew ? 'new-token' : 'prev-token'}`)
        .style('font-size', '20px')
        .style('fill', 'var(--text-secondary)')
        .text(step.token_ids[actualIndex]);
    });

    // Render combined ellipsis between tokens and embeddings if collapsed
    if (shouldCollapse) {
      const edgeCount = Math.floor(maxVisibleTokens / 2);
      const ellipsisIndex = edgeCount; // index in visibleTokens
      const ellipsisX = positions[ellipsisIndex];

      // Render ellipsis as a token-level group so it aligns exactly with IDs and animates with tokens
      const ellipsisG = group.append('g')
        .attr('class', 'token token-ellipsis')
        .attr('transform', `translate(${ellipsisX}, ${layout.tokenY})`);
      ellipsisG.append('text')
        .attr('text-anchor', 'middle')
        .attr('y', 72)
        .attr('class', 'token-id')
        .style('font-size', '20px')
        .style('fill', 'var(--text-tertiary)')
        .text('⋯');
    }
  };

  /**
   * Render outside (top) embeddings as vertical compact columns
   */
  const renderOuterEmbeddings = (group, step, layout, width, shouldCollapse, maxVisibleTokens) => {
    const embeddings = step.embeddings;
    const { visibleIndices = [], positions = [] } = tokensLayoutRef.current || {};
    const lastActualIndex = (step.tokens || []).length - 1;

    const columnsMeta = [];
    let maxOuterHeight = 0;

    visibleIndices.forEach((actualIndex, i) => {
      const x = positions[i] ?? (width / 2);
      if (actualIndex < 0) { columnsMeta.push(null); return; }
      const values = embeddings[actualIndex]?.values || [];
      const expanded = !!embeddingExpanded[actualIndex];
      const tokenColor = getTokenColor(actualIndex);
      const isNew = actualIndex === lastActualIndex;
      const meta = drawEmbeddingColumn(group, x, layout.embeddingY, values, { expanded, interactive: true, index: actualIndex, tokenColor, className: isNew ? 'new-token' : 'prev-token' });
      columnsMeta.push(meta);
      maxOuterHeight = Math.max(maxOuterHeight, meta.height);

      // Arrow from token ID to embedding top
      // First, a connector line down from below the ID to just above the embedding,
      // then a short arrow segment (≈20px) that ends exactly on the embedding top edge.
      const connectorStart = layout.tokenY + 84;      // a bit below the ID baseline (72)
      const arrowStart = meta.topY - 20;              // short arrow begins 20px above top of embedding
      group.append('line')
        .attr('x1', x)
        .attr('y1', connectorStart)
        .attr('x2', x)
        .attr('y2', arrowStart)
        .style('stroke', '#ccc')
        .style('stroke-width', 1.5)
        .style('opacity', 0.7);
      drawArrow(group, x, arrowStart, x, meta.topY, { className: `id-to-emb-arrow ${isNew ? 'new-token' : 'prev-token'}` });
    });

    return { columnsMeta, maxOuterHeight };
  };

  // Draw a compact vertical embedding column (rectangle divided into square cells)
  const drawEmbeddingColumn = (group, centerX, topY, values, opts = {}) => {
    const { expanded = false, interactive = false, index = -1, tokenColor = null, className = '' } = opts;
    const cellSize = 16; // larger squares
    const cellGap = 3;
    const padding = 6; // larger rectangle padding

    let displayValues = values;
    if (!expanded && values.length > 4) {
      displayValues = [...values.slice(0, 2), null, ...values.slice(-2)];
    }
    const n = displayValues.length;
    const width = cellSize + padding * 2;
    const height = n * cellSize + (n - 1) * cellGap + padding * 2;
    const leftX = centerX - width / 2;

    // wrap into a column group so we can animate per-token
    const colG = group.append('g').attr('class', `embedding-col ${className}`);

    // Outer rect - use lightened token color if provided
    let outerFill = '#f2f3f5';
    let outerStroke = '#e0e0e0';
    if (tokenColor) {
      // Lighten the token color by mixing with white
      const lightenedColor = d3.interpolateRgb(tokenColor, '#ffffff')(0.7); // 70% towards white
      outerFill = lightenedColor;
      outerStroke = d3.interpolateRgb(tokenColor, '#ffffff')(0.5); // 50% towards white for border
    }

    colG.append('rect')
      .attr('x', leftX)
      .attr('y', topY)
      .attr('width', width)
      .attr('height', height)
      .attr('rx', 4)
      .style('fill', outerFill)
      .style('stroke', outerStroke);

    // Cells
    displayValues.forEach((v, i) => {
      const y = topY + padding + i * (cellSize + cellGap);
      if (v === null) {
        const ellG = group.append('g');
        const r = ellG.append('rect')
          .attr('x', centerX - cellSize / 2)
          .attr('y', y)
          .attr('width', cellSize)
          .attr('height', cellSize)
          .attr('rx', 2)
          .style('fill', '#e9eaed')
          .style('stroke', '#d0d0d0');
        ellG.append('text')
          .attr('x', centerX)
          .attr('y', y + cellSize / 2 + 3)
          .attr('text-anchor', 'middle')
          .style('font-size', '12px')
          .style('fill', '#9aa0a6')
          .text('⋯');
        if (interactive) {
          ellG.style('cursor', 'pointer')
            .on('click', () => {
              setEmbeddingExpanded(prev => ({ ...prev, [index]: !prev[index] }));
            });
        }
        return;
      }
      const cell = colG.append('rect')
        .attr('x', centerX - cellSize / 2)
        .attr('y', y)
        .attr('width', cellSize)
        .attr('height', cellSize)
        .attr('rx', 2)
        .style('fill', 'transparent')
        .style('stroke', 'none');

      // Numeric value inside each square
      colG.append('text')
        .attr('x', centerX)
        .attr('y', y + cellSize / 2 + 3)
        .attr('text-anchor', 'middle')
        .style('font-size', '9px')
        .style('fill', '#333')
        .text((typeof v === 'number') ? v.toFixed(1) : '');
    });

    return { topY, bottomY: topY + height, height, width, centerX };
  };

  // Utility to draw an arrow with optional small box (for FFN)
  const drawArrow = (group, x1, y1, x2, y2, opts = {}) => {
    const { withBox = false, className = '' } = opts;
    const arrowG = group.append('g').attr('class', className);
    arrowG.append('line')
      .attr('x1', x1)
      .attr('y1', y1)
      .attr('x2', x2)
      .attr('y2', y2)
      .style('stroke', '#ccc')
      .style('stroke-width', 1.5)
      .style('opacity', 0.7);

    const angle = Math.atan2(y2 - y1, x2 - x1);
    const headLen = 6;
    const hx = x2 - Math.cos(angle) * headLen;
    const hy = y2 - Math.sin(angle) * headLen;
    const points = `${x2},${y2} ${hx - Math.sin(angle) * 3},${hy + Math.cos(angle) * 3} ${hx + Math.sin(angle) * 3},${hy - Math.cos(angle) * 3}`;
    arrowG.append('polygon')
      .attr('points', points)
      .style('fill', '#ccc')
      .style('opacity', 0.7);

    if (withBox) {
      arrowG.append('rect')
        .attr('x', x1 - 6)
        .attr('y', y1 + 6)
        .attr('width', 12)
        .attr('height', 12)
        .attr('rx', 2)
        .style('fill', '#e8e8ff')
        .style('stroke', '#c0c0ff')
        .style('opacity', 0.9);
    }
  };

  // Create a right-angled path with rounded corner
  const rightAngleRoundedPath = (x1, y1, x2, y2, radius = 10) => {
    // Go down from (x1, y1), then horizontally to (x2, y2)
    const midY = y2; // the turn happens at y2

    // Calculate the corner points
    const cornerX1 = x1;
    const cornerY1 = midY - (y2 > y1 ? radius : -radius);
    const cornerX2 = x1 + (x2 > x1 ? radius : -radius);
    const cornerY2 = midY;

    return `
      M ${x1},${y1}
      L ${cornerX1},${cornerY1}
      Q ${x1},${midY} ${cornerX2},${cornerY2}
      L ${x2},${y2}
    `;
  };

  // New transformer block between outside embeddings
  const renderTransformerBlock = (group, step, layout, width, outerMeta) => {
    const { visibleIndices = [], positions = [] } = tokensLayoutRef.current || {};
    const columnsMeta = outerMeta.columnsMeta;

    // Determine block horizontal bounds from visible token positions
    const validXs = positions.filter((_, i) => visibleIndices[i] >= 0);
    if (validXs.length === 0) {
      return { blockTopY: layout.embeddingY, blockBottomY: layout.embeddingY, insideBottomMeta: [] };
    }
    const minX = Math.min(...validXs) - 60;
    const maxX = Math.max(...validXs) + 60;

    const afterOuterBottom = layout.embeddingY + outerMeta.maxOuterHeight;
    const blockTopY = afterOuterBottom + 40;
    const insideTopY = blockTopY + layout.blockPadding;

    // Inside top embeddings (copy of outside top values)
    const embeddings = step.embeddings;
    const insideTopGroup = group.append('g').attr('class', 'inside-top-embeddings');
    const insideTopMeta = [];
    let maxInsideTopHeight = 0;
    visibleIndices.forEach((actualIndex, i) => {
      const x = positions[i];
      if (actualIndex < 0) { insideTopMeta.push(null); return; }
      const vals = embeddings[actualIndex]?.values || [];
      const tokenColor = getTokenColor(actualIndex);
      const isNew = actualIndex === (step.tokens?.length - 1);
      const meta = drawEmbeddingColumn(insideTopGroup, x, insideTopY, vals, { expanded: false, tokenColor, className: isNew ? 'new-token' : 'prev-token' });
      insideTopMeta.push(meta);
      maxInsideTopHeight = Math.max(maxInsideTopHeight, meta.height);
      // Arrow from outside embeddings into the block
      const outerCol = columnsMeta[i];
      if (outerCol) {
        drawArrow(group, x, outerCol.bottomY + 4, x, meta.topY - 8, { className: `outer-to-block-arrow ${isNew ? 'new-token' : 'prev-token'}` });
      }
    });

    // Attention mash: all-to-all lines between token centers with varied color/thickness
    // The attention connections should start exactly at the bottom of the top embeddings
    const attentionStartY = insideTopY + maxInsideTopHeight; // bottom edge of top embeddings
    const insideBottomY = attentionStartY + 60; // spacing inside the block before bottom embeddings
    const attentionGroup = group.append('g').attr('class', 'attention-mash');
    const centers = insideTopMeta.map(m => (m ? { x: m.centerX } : null));
    centers.forEach((a, i) => {
      if (!a) return;
      centers.forEach((b, j) => {
        if (!b || i === j) return;
        // Deterministic pseudo-random strength per pair
        const s = Math.abs(Math.sin((i * 37 + j * 17) * 12.9898)) % 1; // 0..1
        // Use lighter grayscale tones so they don't overpower; still visible on gray box
        const color = d3.interpolateRgb('#C5CBD3', '#9AA0A6')(s);
        const width = 0.6 + s * 2.0;
        const opacity = 0.25 + s * 0.25; // 0.25..0.5

        attentionGroup.append('line')
          .attr('x1', a.x)
          .attr('y1', attentionStartY)
          .attr('x2', b.x)
          .attr('y2', insideBottomY)
          .style('stroke', color)
          .style('stroke-width', width)
          .style('opacity', opacity);
      });
    });

    // Inside bottom embeddings (post-attention)
    const insideBottomGroup = group.append('g').attr('class', 'inside-bottom-embeddings');
    const insideBottomMeta = [];
    let maxInsideBottomHeight = 0;
    visibleIndices.forEach((actualIndex, i) => {
      const x = positions[i];
      if (actualIndex < 0) { insideBottomMeta.push(null); return; }
      const vals = embeddings[actualIndex]?.values || [];
      const tokenColor = getTokenColor(actualIndex);
      const isNew = actualIndex === (step.tokens?.length - 1);
      const meta = drawEmbeddingColumn(insideBottomGroup, x, insideBottomY, vals, { expanded: false, tokenColor, className: isNew ? 'new-token' : 'prev-token' });
      insideBottomMeta.push(meta);
      maxInsideBottomHeight = Math.max(maxInsideBottomHeight, meta.height);
    });

    const blockBottomY = insideBottomY + maxInsideBottomHeight + layout.blockPadding;

    // Draw spacious gray box behind contents
    group.insert('rect', ':first-child')
      .attr('x', minX)
      .attr('y', blockTopY)
      .attr('width', maxX - minX)
      .attr('height', blockBottomY - blockTopY)
      .attr('rx', 10)
      .attr('class', 'transformer-box')
      .style('fill', '#f3f4f6')
      .style('stroke', '#d9d9e3')
      .style('stroke-dasharray', '4 4');

    return { blockTopY, blockBottomY, insideBottomMeta };
  };

  // Outside (bottom) embeddings and FFN arrows
  const renderBottomEmbeddings = (group, step, layout, width, blockMeta) => {
    const { visibleIndices = [], positions = [] } = tokensLayoutRef.current || {};
    const embeddings = step.embeddings;
    const topY = blockMeta.blockBottomY + 40;

    let maxHeight = 0;
    const metas = [];
    visibleIndices.forEach((actualIndex, i) => {
      const x = positions[i];
      if (actualIndex < 0) return;
      const vals = embeddings[actualIndex]?.values || [];
      const tokenColor = getTokenColor(actualIndex);
      // FFN arrow with small box
      const insideBottom = blockMeta.insideBottomMeta[i];
      const isNew = actualIndex === (step.tokens?.length - 1);
      if (insideBottom) {
        drawArrow(group, x, insideBottom.bottomY + 4, x, topY - 8, { withBox: true, className: `ffn-arrow ${isNew ? 'new-token' : 'prev-token'}` });
      }
      const meta = drawEmbeddingColumn(group, x, topY, vals, { expanded: false, tokenColor, className: isNew ? 'new-token' : 'prev-token' });
      metas[i] = meta;
      maxHeight = Math.max(maxHeight, meta.height);
    });

    // find rightmost visible index
    let rightmostIdx = -1;
    for (let i = visibleIndices.length - 1; i >= 0; i--) {
      if (visibleIndices[i] >= 0) { rightmostIdx = i; break; }
    }
    const rightmostMeta = rightmostIdx >= 0 ? metas[rightmostIdx] : null;

    return { afterBottomY: topY + maxHeight, topY, maxHeight, metas, rightmostIdx, rightmostMeta };
  };

  /**
   * Render output distribution
   */
  const renderOutput = (group, step, layout, width, bottomInfo, subStep) => {
    const candidates = step.output_distribution?.candidates || [];

    // 1) Extract the rightmost bottom embedding and animate it to center as a horizontal vector
    const rm = bottomInfo.rightmostMeta;
    const { visibleIndices = [], positions = [] } = tokensLayoutRef.current || {};
    let rightmostActualIndex = -1;
    for (let i = visibleIndices.length - 1; i >= 0; i--) {
      if (visibleIndices[i] >= 0) { rightmostActualIndex = visibleIndices[i]; break; }
    }
    const tokenColor = rightmostActualIndex >= 0 ? getTokenColor(rightmostActualIndex) : '#999';
    const baseFill = d3.interpolateRgb(tokenColor, '#ffffff')(0.7);
    const baseStroke = d3.interpolateRgb(tokenColor, '#ffffff')(0.5);

    // Target placement for the rotated version
    // Bring the horizontal embedding vector closer to the bottom embeddings so the bars fit
    const horizY = bottomInfo.afterBottomY + 20; // was +60
    const horizCenterX = width / 2;

    // Create a background layer inserted under bottom embeddings for extraction visuals
    const mainRoot = d3.select(svgRef.current).select('g.visualization-main');
    const extractionBg = mainRoot.insert('g', '.bottom-embedding-group').attr('class', 'extraction-bg-layer');

    // Draw the right-angle path FIRST (behind everything) - only when needed (subStep >= 6)
    if (rm && subStep >= 6) {
      const startX = rm.centerX;
      const startY = rm.topY + rm.height / 2;
      const endX = horizCenterX;
      const endY = horizY + 12; // near the horizontal vector
      const pathD = rightAngleRoundedPath(startX, startY, endX, endY, 20);
      extractionBg.append('path')
        .attr('d', pathD)
        .attr('class', 'extracted-path-arrow')
        .style('fill', 'none')
        .style('stroke', '#c0c0c0')
        .style('stroke-width', 1.5)
        .style('stroke-linecap', 'round')
        .style('stroke-linejoin', 'round')
        .style('opacity', 0.9);
    }

    // Underlay group inside output for arrows under vectors
    const underlays = group.append('g').attr('class', 'output-underlays');

    let hv1 = null;
    if (subStep >= 6) {
      // Draw the animated dummy rectangle in the background (below bottom embeddings)
      const extracted = extractionBg.append('g').attr('class', 'extracted-embedding');
      if (rm) {
        extracted.append('rect')
          .attr('x', rm.centerX - rm.width / 2)
          .attr('y', rm.topY)
          .attr('width', rm.width)
          .attr('height', rm.height)
          .attr('rx', 4)
          .style('fill', baseFill)
          .style('stroke', baseStroke);
        // store deltas for GSAP animation (move from current position to horiz target)
        const dx = horizCenterX - rm.centerX;
        const dy = (horizY + (rm.height / 2)) - (rm.topY + (rm.height / 2));
        extracted.attr('data-dx', dx).attr('data-dy', dy);
      }
      // Draw final horizontal vector (hidden initially) representing the copied embedding
      const sampleValues = (rightmostActualIndex >= 0 ? (step.embeddings?.[rightmostActualIndex]?.values || []) : []).slice(0, 8);
      hv1 = drawHorizontalVector(group, horizCenterX, horizY, sampleValues, { className: 'extracted-horizontal', tokenColor, bgFill: baseFill });
    }

    // 2) Arrow with a small box to logprob vector (only subStep >= 7)
    let hv2 = null;
    // Tighten spacing between the copied embedding vector and the logprob vector
    let logprobY = (hv1 ? hv1.bottomY : (horizY + 36)) + 28; // was +40
    const probs = candidates.map(c => c.prob);
    if (subStep >= 7) {
      hv2 = drawHorizontalVector(group, horizCenterX, logprobY, probs, {
        className: 'logprob-vector',
        tokenColor: '#8B5CF6',
        format: v => (v).toFixed(2),
        isLogprob: true  // Mark this as logprob vector for larger sizing
      });
      // arrow from hv1 to hv2
      if (hv1 && hv2) {
        drawArrow(underlays, horizCenterX, hv1.bottomY + 6, horizCenterX, hv2.topY - 8, { withBox: true, className: 'logprob-arrow' });
      }
    }

    // 3) Output distribution bars aligned to hv2 cells, positioned below the vector (only subStep >= 8)
    if (subStep >= 8 && hv2) {
      // Keep the bars comfortably within the canvas height
      const maxBarHeight = 140;  // was 180
      const barTopY = hv2.bottomY + 20; // was +50
      const barBaselineY = barTopY + maxBarHeight; // baseline for bar heights

      hv2.centers.forEach((cx, i) => {
        const p = probs[i] ?? 0;
        const barH = p * maxBarHeight;
        const bw = Math.max(40, hv2.cellWidth * 0.8); // Much wider bars for better visibility

        const color = getPurpleByProb(p);

        const isSelected = i === 0; // greedy selection (first)
        group.append('rect')
          .attr('x', cx - bw / 2)
          .attr('y', barBaselineY - barH)
          .attr('width', bw)
          .attr('height', barH)
          .attr('rx', 4)
          .attr('class', `distribution-bar ${isSelected ? 'selected' : ''}`)
          .style('fill', isSelected ? '#e11d48' : color);
      });

      // 4) Legend below bars with token labels and percentages
      // Slightly less space under bars so labels are visible within canvas
      const legendY = barBaselineY + 24;  // was +30
      hv2.centers.forEach((cx, i) => {
        const p = probs[i] ?? 0;
        const token = candidates[i]?.token ?? '';
        const percentage = (p * 100).toFixed(1) + '%';

        // Token label - much larger font
        const isSelected = i === 0;
        group.append('text')
          .attr('x', cx)
          .attr('y', legendY)
          .attr('text-anchor', 'middle')
          .attr('class', 'distribution-token-label')
          .style('font-size', '18px')  // Increased from 11px
          .style('font-weight', isSelected ? '700' : '600')
          .style('fill', isSelected ? '#e11d48' : '#333')
          .text(token);

        // Percentage label below token - much larger font
        group.append('text')
          .attr('x', cx)
          .attr('y', legendY + 24)  // More vertical space
          .attr('text-anchor', 'middle')
          .attr('class', 'distribution-percentage-label')
          .style('font-size', '16px')  // Increased from 9px
          .style('font-weight', '500')
          .style('fill', isSelected ? '#e11d48' : '#666')
          .text(percentage);
      });
    }
  };

  // Draw a horizontal vector with numbers inside narrow cells; returns centers for alignment
  const drawHorizontalVector = (group, centerX, topY, values, opts = {}) => {
    const { className = '', tokenColor = '#ddd', bgFill = null, format, isLogprob = false } = opts;
    const g = group.append('g').attr('class', className);
    const n = values.length;

    // Make logprob vector much larger and stretch to ~2/3 of canvas width
    const cellWidth = isLogprob ? 80 : 26;
    const cellHeight = isLogprob ? 36 : 18;
    const gap = isLogprob ? 12 : 6;
    const fontSize = isLogprob ? '18px' : '10px';

    const width = n * cellWidth + (n - 1) * gap + 12;
    const leftX = centerX - width / 2 + 6;
    const centers = [];

    // background pill using lightened token color
    const bg = bgFill ?? d3.interpolateRgb(typeof tokenColor === 'string' ? tokenColor : '#ddd', '#ffffff')(0.85);
    g.append('rect')
      .attr('x', leftX - 6)
      .attr('y', topY)
      .attr('width', width)
      .attr('height', cellHeight + 12)
      .attr('rx', 10)
      .style('fill', bg)
      .style('stroke', '#e5e7eb');

    values.forEach((v, i) => {
      const x = leftX + i * (cellWidth + gap);
      const cx = x + cellWidth / 2;
      centers.push(cx);
      // transparent cell
      g.append('rect')
        .attr('x', x)
        .attr('y', topY + 6)
        .attr('width', cellWidth)
        .attr('height', cellHeight)
        .attr('rx', 4)
        .style('fill', 'transparent');
      // number
      g.append('text')
        .attr('x', cx)
        .attr('y', topY + 6 + cellHeight / 2 + (isLogprob ? 6 : 3))
        .attr('text-anchor', 'middle')
        .style('font-size', fontSize)
        .style('font-weight', isLogprob ? '600' : 'normal')
        .style('fill', '#111')
        .text(format ? format(v) : (typeof v === 'number' ? v.toFixed(1) : ''));
    });

    return { topY, bottomY: topY + cellHeight + 12, centers, width, cellWidth };
  };

  // Utility: smooth connector path (downward then right) using cubic bezier
  const smoothConnectorPath = (x1, y1, x2, y2) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const c1x = x1;
    const c1y = y1 + dy * 0.6; // pull mostly downward from start
    const c2x = x2 - dx * 0.4; // then ease into the end horizontally
    const c2y = y2;
    return `M ${x1} ${y1} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${x2} ${y2}`;
  };

  const getPurpleByProb = (p) => {
    const s = 45 + Math.round(p * 45); // 45%..90%
    const l = 62 - Math.round(p * 10); // 62%..52%
    return `hsl(270, ${s}%, ${l}%)`;
  };

  /**
   * Render expand/collapse button
   */
  const renderExpandButton = (group, layout, width, isCurrentlyExpanded) => {
    const buttonG = group.append('g')
      .attr('class', 'expand-button')
      .attr('transform', `translate(${width - 50}, 30)`)
      .style('cursor', 'pointer')
      .on('click', () => {
        setIsExpanded(!isCurrentlyExpanded);
      });

    // Button circle background
    buttonG.append('circle')
      .attr('cx', 20)
      .attr('cy', 15)
      .attr('r', 16)
      .style('fill', 'transparent')
      .style('stroke', 'var(--border-color)')
      .style('stroke-width', 1.5)
      .style('opacity', 0.6);

    // Icon: arrows pointing left-right for expand, or pointing inward for collapse
    if (isCurrentlyExpanded) {
      // Collapse icon: arrows pointing inward ← →
      buttonG.append('path')
        .attr('d', 'M 14 15 L 18 15 M 22 15 L 26 15 M 18 12 L 15 15 L 18 18 M 22 12 L 25 15 L 22 18')
        .style('stroke', 'var(--text-secondary)')
        .style('stroke-width', 1.5)
        .style('fill', 'none')
        .style('stroke-linecap', 'round')
        .style('stroke-linejoin', 'round');
    } else {
      // Expand icon: arrows pointing outward → ←
      buttonG.append('path')
        .attr('d', 'M 18 15 L 14 15 M 26 15 L 22 15 M 14 12 L 11 15 L 14 18 M 26 12 L 29 15 L 26 18')
        .style('stroke', 'var(--text-secondary)')
        .style('stroke-width', 1.5)
        .style('fill', 'none')
        .style('stroke-linecap', 'round')
        .style('stroke-linejoin', 'round');
    }

    // Hover effect
    buttonG.on('mouseenter', function () {
      d3.select(this).select('circle')
        .transition()
        .duration(200)
        .style('opacity', 1)
        .style('stroke', 'var(--accent-primary)');
    }).on('mouseleave', function () {
      d3.select(this).select('circle')
        .transition()
        .duration(200)
        .style('opacity', 0.6)
        .style('stroke', 'var(--border-color)');
    });
  };

  /**
   * Get color for token
   */
  const getTokenColor = (index) => {
    // Vibrant palette inspired by tokenizer playground
    const colors = [
      '#FF7A7A', // bright coral red
      '#6EC1FF', // vivid sky blue
      '#7DFFA0', // bright mint
      '#FFD166', // warm sunflower
      '#C792EA', // vibrant purple
      '#F78C6B', // orange salmon
      '#2ED1A2'  // aqua green
    ];
    return colors[index % colors.length];
  };

  /**
   * Get color for embedding value
   */
  const getEmbeddingColor = (value) => {
    // Map -1 to 1 range to grayscale
    const normalized = (value + 1) / 2;
    const gray = Math.floor(normalized * 200 + 55);
    return `rgb(${gray}, ${gray}, ${gray})`;
  };

  return (
    <section
      className={`visualization-section ${isExpanded ? 'expanded' : ''}`}
      ref={containerRef}
      style={{
        overflowX: isExpanded ? 'auto' : 'hidden',
        transition: 'all 0.3s ease'
      }}
    >
      {(() => {
        // Estimate dynamic min-width when expanded based on token content
        const currentStepData = state.currentExample?.generation_steps?.[state.currentStep - 1];
        const tokens = currentStepData?.tokens || [];
        const gap = 24;
        const estWidths = tokens.map(tok => Math.max(36, tok.length * 10 + 16));
        const estimatedMinWidth = estWidths.reduce((a, b) => a + b, 0) + (tokens.length > 0 ? gap * (tokens.length - 1) : 0) + 40;
        // Render SVG with computed minWidth
        return (
          <svg
            ref={svgRef}
            className="visualization-canvas"
            style={{
              minWidth: isExpanded ? `${estimatedMinWidth}px` : '100%',
              transition: 'min-width 0.3s ease'
            }}
          />
        );
      })()}
    </section>
  );
}

export default VisualizationCanvas;
