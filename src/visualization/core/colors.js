/**
 * Color scales and utilities for visualization
 */
import * as d3 from 'd3';

/**
 * Color scale for token visualization (cycling through predefined colors)
 * @param {number} index - Token index
 * @returns {string} Hex color
 */
export function getTokenColor(index) {
  const colors = [
    '#FF6B6B', // red
    '#4ECDC4', // teal
    '#45B7D1', // blue
    '#FFA07A', // light salmon
    '#98D8C8', // mint
    '#F7DC6F', // yellow
    '#BB8FCE', // purple
    '#85C1E2', // sky blue
    '#F8B195', // peach
    '#95E1D3', // aqua
  ];
  return colors[index % colors.length];
}

/**
 * Color scale for embedding values (blue-to-red diverging)
 * @param {number} value - Embedding value (typically -1 to 1)
 * @returns {string} RGB color
 */
export function getEmbeddingColor(value) {
  // Diverging scale: blue (negative) to white (zero) to red (positive)
  const scale = d3
    .scaleLinear()
    .domain([-1, 0, 1])
    .range(['#3498db', '#ecf0f1', '#e74c3c'])
    .clamp(true);
  return scale(value);
}

/**
 * Color scale for probability values (purple gradient)
 * @param {number} p - Probability value (0 to 1)
 * @returns {string} RGB color
 */
export function getPurpleByProb(p) {
  const scale = d3.scaleLinear().domain([0, 1]).range(['#f3e5f5', '#6a1b9a']).clamp(true);
  return scale(p);
}

/**
 * Lightness scale for attention weights
 * @param {number} weight - Attention weight (0 to 1)
 * @returns {string} RGBA color
 */
export function getAttentionColor(weight) {
  const opacity = Math.max(0.1, Math.min(1, weight));
  return `rgba(106, 27, 154, ${opacity})`; // Purple with varying opacity
}
