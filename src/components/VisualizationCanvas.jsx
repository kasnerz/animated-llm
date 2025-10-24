import { useEffect, useRef, useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { useTranslation } from '../utils/i18n';
import * as d3 from 'd3';
import config from '../config';
import '../styles/visualization.css';

/**
 * VisualizationCanvas Component
 * Main SVG container for all D3 visualizations
 */
function VisualizationCanvas() {
  const { state } = useApp();
  const { t } = useTranslation();
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [embeddingExpanded, setEmbeddingExpanded] = useState({});
  const tokensLayoutRef = useRef({ positions: [], widths: [], visibleIndices: [], gap: 24, shouldCollapse: false });

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

    // Clear previous visualization
    svg.selectAll('*').remove();

    // Create main groups for different visualization sections
    const g = svg.append('g').attr('class', 'visualization-main');

    const tokenGroup = g.append('g').attr('class', 'token-group');
    const embeddingGroup = g.append('g').attr('class', 'embedding-group');
    const transformerGroup = g.append('g').attr('class', 'transformer-group');
    const outputGroup = g.append('g').attr('class', 'output-group');

    // Get SVG dimensions
    const width = parseFloat(svg.attr('width')) || 800;
    const height = parseFloat(svg.attr('height')) || 900;

  // Determine if we need to collapse tokens
  const maxVisibleTokens = Math.floor(width / 140) - 1; // basic heuristic; dynamic sizing handled below
    const shouldCollapse = step.tokens.length > maxVisibleTokens && !isExpanded;

    // Layout configuration with proper spacing
    const layout = {
      tokenY: 90,
      embeddingY: 240,
      transformerY: 440,
      outputY: 720,
      margin: 20,
      tokenSpacing: 140,
      embeddingHeight: 100
    };

    // 1. Render tokens
  renderTokens(tokenGroup, step, layout, width, shouldCollapse, maxVisibleTokens);

    // 2. Render embeddings
  renderEmbeddings(embeddingGroup, step, layout, width, shouldCollapse, maxVisibleTokens);

    // 3. Render transformer block
    renderTransformer(transformerGroup, step, layout, width);

    // 4. Render output distribution
    renderOutput(outputGroup, step, layout, width);

    // Add expand/collapse button if needed
    if (step.tokens.length > maxVisibleTokens) {
      renderExpandButton(g, layout, width, isExpanded);
    }

  }, [state.currentStep, state.currentExample, isExpanded, embeddingExpanded]);

  /**
   * Render token sequence
   */
  const renderTokens = (group, step, layout, width, shouldCollapse, maxVisibleTokens) => {
    const tokens = step.tokens;
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
      const tokenG = group.append('g')
        .attr('class', 'token')
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

      // Arrow from token to ID
      group.append('line')
        .attr('x1', x)
        .attr('y1', layout.tokenY + 30)
        .attr('x2', x)
        .attr('y2', layout.tokenY + 55)
        .style('stroke', '#ccc')
        .style('stroke-width', 1.5)
        .style('opacity', 0.5);

      // Arrow head
      group.append('polygon')
        .attr('points', `${x},${layout.tokenY + 55} ${x - 4},${layout.tokenY + 48} ${x + 4},${layout.tokenY + 48}`)
        .style('fill', '#ccc')
        .style('opacity', 0.5);

      // Token ID below - without "ID: " prefix, further down
      tokenG.append('text')
        .attr('text-anchor', 'middle')
        .attr('y', 70)
        .attr('class', 'token-id')
        .style('font-size', '14px')
        .style('fill', 'var(--text-secondary)')
        .text(step.token_ids[actualIndex]);
    });
    
    // Render combined ellipsis between tokens and embeddings if collapsed
    if (shouldCollapse) {
  const edgeCount = Math.floor(maxVisibleTokens / 2);
  const ellipsisIndex = edgeCount; // index in visibleTokens
  const ellipsisX = positions[ellipsisIndex];
      const ellipsisY = (layout.tokenY + layout.embeddingY) / 2;
      
      group.append('text')
        .attr('x', ellipsisX)
        .attr('y', ellipsisY)
        .attr('text-anchor', 'middle')
        .style('font-size', '24px')
        .style('font-weight', 'bold')
        .style('fill', 'var(--text-tertiary)')
        .text('⋯');
    }
  };

  /**
   * Render embeddings
   */
  const renderEmbeddings = (group, step, layout, width, shouldCollapse, maxVisibleTokens) => {
    const embeddings = step.embeddings;

    // Use token layout to determine visible indices and positions
    const { visibleIndices = [], positions = [] } = tokensLayoutRef.current || {};

    visibleIndices.forEach((actualIndex, i) => {
      const x = positions[i] ?? (width / 2);
      const embedding = actualIndex >= 0 ? embeddings[actualIndex] : null;
      const embG = group.append('g')
        .attr('class', 'embedding')
        .attr('transform', `translate(${x}, ${layout.embeddingY})`);

      // Handle ellipsis - skip, already rendered in tokens section
      if (embedding === null) {
        return;
      }

      // Embedding visualization as rounded squares in a row
      const boxSize = 16;
      const boxSpacing = 3;
      const embeddingValues = embedding.values || [];
      const isEmbExpanded = embeddingExpanded[actualIndex];

      // Show first 2, ellipsis, last 2, or all if expanded
      let displayValues = embeddingValues;
      let hasEllipsis = false;

      if (!isEmbExpanded && embeddingValues.length > 4) {
        displayValues = [
          ...embeddingValues.slice(0, 2),
          null, // ellipsis marker
          ...embeddingValues.slice(-2)
        ];
        hasEllipsis = true;
      }

      const totalBoxWidth = displayValues.length * (boxSize + boxSpacing) - boxSpacing;
      const startBoxX = -totalBoxWidth / 2;

      displayValues.forEach((value, j) => {
        const boxX = startBoxX + j * (boxSize + boxSpacing);

        if (value === null) {
          // Ellipsis for hidden embedding dimensions
          const ellipsisG = embG.append('g')
            .attr('class', 'embedding-ellipsis')
            .style('cursor', 'pointer')
            .on('click', () => {
              setEmbeddingExpanded(prev => ({
                ...prev,
                [actualIndex]: !prev[actualIndex]
              }));
            });

          const ellipsisRect = ellipsisG.append('rect')
            .attr('x', boxX)
            .attr('y', -boxSize / 2)
            .attr('width', boxSize)
            .attr('height', boxSize)
            .attr('rx', 3)
            .attr('ry', 3)
            .style('fill', '#f0f0f0')
            .style('stroke', '#ddd')
            .style('stroke-width', 1);

          ellipsisG.append('text')
            .attr('x', boxX + boxSize / 2)
            .attr('y', boxSize / 2 - 3)
            .attr('text-anchor', 'middle')
            .style('font-size', '12px')
            .style('font-weight', 'bold')
            .style('fill', '#999')
            .text('⋯');

          // Hover effects
          ellipsisG.on('mouseenter', function () {
            ellipsisRect
              .transition()
              .duration(200)
              .style('fill', '#e0e0e0')
              .style('stroke', '#bbb');
          }).on('mouseleave', function () {
            ellipsisRect
              .transition()
              .duration(200)
              .style('fill', '#f0f0f0')
              .style('stroke', '#ddd');
          });

          return;
        }

        // Rounded square background
        embG.append('rect')
          .attr('x', boxX)
          .attr('y', -boxSize / 2)
          .attr('width', boxSize)
          .attr('height', boxSize)
          .attr('rx', 3)
          .attr('ry', 3)
          .attr('class', 'embedding-box')
          .style('fill', '#e0e0e0')
          .style('stroke', 'none');

        // Value text inside
        embG.append('text')
          .attr('x', boxX + boxSize / 2)
          .attr('y', boxSize / 2 - 4)
          .attr('text-anchor', 'middle')
          .attr('class', 'embedding-value')
          .style('font-size', '8px')
          .style('fill', '#333')
          .text(value.toFixed(1));
      });

      // Connecting line from token to embedding (skip for ellipsis tokens)
      if (actualIndex >= 0) {
        group.append('line')
          .attr('x1', x)
          .attr('y1', layout.tokenY + 50)
          .attr('x2', x)
          .attr('y2', layout.embeddingY - 20)
          .attr('class', 'connection-line')
          .style('stroke', '#ccc')
          .style('stroke-width', 1)
          .style('opacity', 0.5);
      }
    });
  };

  /**
   * Render transformer block
   */
  const renderTransformer = (group, step, layout, width) => {
    const centerX = width / 2;
    const boxWidth = 400;
    const boxHeight = 140;

    // Transformer box
    group.append('rect')
      .attr('x', centerX - boxWidth / 2)
      .attr('y', layout.transformerY - boxHeight / 2)
      .attr('width', boxWidth)
      .attr('height', boxHeight)
      .attr('class', 'transformer-block')
      .attr('rx', 10)
      .style('fill', '#f8f9fa')
      .style('stroke', '#ddd')
      .style('stroke-width', 2);

    // Label
    group.append('text')
      .attr('x', centerX)
      .attr('y', layout.transformerY - 40)
      .attr('text-anchor', 'middle')
      .attr('class', 'transformer-label')
      .style('font-size', '18px')
      .style('font-weight', '600')
      .text('Transformer Block');

    // Show some activation values
    const sampleActivations = step.transformer_processing?.sample_activations || [];
    if (sampleActivations.length > 0 && sampleActivations[0].values) {
      const activationValues = sampleActivations[0].values.slice(0, 4);
      activationValues.forEach((value, i) => {
        group.append('text')
          .attr('x', centerX)
          .attr('y', layout.transformerY - 10 + i * 16)
          .attr('text-anchor', 'middle')
          .attr('class', 'activation-value')
          .style('font-size', '12px')
          .style('fill', '#666')
          .text(`a${i}: ${value.toFixed(3)}`);
      });
    }
  };

  /**
   * Render output distribution
   */
  const renderOutput = (group, step, layout, width) => {
    const candidates = step.output_distribution?.candidates || [];
    const barWidth = 60;
    const barSpacing = 10;
    const maxBarHeight = 80;
    const totalWidth = candidates.length * (barWidth + barSpacing);
    const startX = (width - totalWidth) / 2;

    candidates.forEach((item, i) => {
      const x = startX + i * (barWidth + barSpacing);
      const barHeight = item.prob * maxBarHeight;

      // Bar
      group.append('rect')
        .attr('x', x)
        .attr('y', layout.outputY - barHeight)
        .attr('width', barWidth)
        .attr('height', barHeight)
        .attr('class', 'distribution-bar')
        .style('fill', `hsl(${200 + i * 10}, 70%, 60%)`);

      // Token label
      group.append('text')
        .attr('x', x + barWidth / 2)
        .attr('y', layout.outputY + 15)
        .attr('text-anchor', 'middle')
        .attr('class', 'distribution-label')
        .style('font-size', '11px')
        .text(item.token);

      // Probability
      group.append('text')
        .attr('x', x + barWidth / 2)
        .attr('y', layout.outputY - barHeight - 5)
        .attr('text-anchor', 'middle')
        .attr('class', 'distribution-prob')
        .style('font-size', '10px')
        .text(`${(item.prob * 100).toFixed(1)}%`);
    });

    // Title
    group.append('text')
      .attr('x', width / 2)
      .attr('y', layout.outputY - maxBarHeight - 20)
      .attr('text-anchor', 'middle')
      .attr('class', 'output-title')
      .text(t('output_distribution'));
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
