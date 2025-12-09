/**
 * Color scales and utilities for visualization
 */
import * as d3 from 'd3';

/**
 * SATURATION CONTROL for vector backgrounds
 */
export const VECTOR_SATURATION = {
  // Light mode: interpolation toward white (higher = less saturated)
  lighten: 0.75, // Background fill
  strokeLighten: 0.6, // Border stroke

  // Dark mode: interpolation toward black (higher = darker)
  darken: 0.5, // Background fill
  strokeDarken: 0.3, // Border stroke
};

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

/**
 * Centralized helper to get background fill and stroke for vector boxes
 * Applies theme-aware lightening/darkening using the tokenColor as a base.
 * @param {string} tokenColor - Base color (hex/rgb)
 * @param {Object} options
 * @param {boolean} options.isDarkMode - Whether dark mode is active
 * @param {number} [options.lighten] - Interpolation toward white for light mode (uses VECTOR_SATURATION.lighten if not specified)
 * @param {number} [options.darken] - Interpolation toward black for dark mode (uses VECTOR_SATURATION.darken if not specified)
 * @param {number} [options.strokeLighten] - Stroke interpolation toward white (uses VECTOR_SATURATION.strokeLighten if not specified)
 * @param {number} [options.strokeDarken] - Stroke interpolation toward black (uses VECTOR_SATURATION.strokeDarken if not specified)
 * @param {string} [options.fallbackFillLight='#f2f3f5']
 * @param {string} [options.fallbackStrokeLight='#e0e0e0']
 * @param {string} [options.fallbackFillDark='#2d2d2d']
 * @param {string} [options.fallbackStrokeDark='#404040']
 * @returns {{ fill: string, stroke: string }}
 */
export function getVectorBoxColors(
  tokenColor,
  {
    isDarkMode,
    lighten = VECTOR_SATURATION.lighten,
    darken = VECTOR_SATURATION.darken,
    strokeLighten = VECTOR_SATURATION.strokeLighten,
    strokeDarken = VECTOR_SATURATION.strokeDarken,
    fallbackFillLight = '#f2f3f5',
    fallbackStrokeLight = '#e0e0e0',
    fallbackFillDark = '#2d2d2d',
    fallbackStrokeDark = '#404040',
  } = {}
) {
  const hasColor = typeof tokenColor === 'string' && tokenColor.length > 0;
  if (isDarkMode) {
    return hasColor
      ? {
          fill: d3.interpolateRgb(tokenColor, '#000000')(darken),
          stroke: d3.interpolateRgb(tokenColor, '#000000')(strokeDarken),
        }
      : { fill: fallbackFillDark, stroke: fallbackStrokeDark };
  }
  return hasColor
    ? {
        fill: d3.interpolateRgb(tokenColor, '#ffffff')(lighten),
        stroke: d3.interpolateRgb(tokenColor, '#ffffff')(strokeLighten),
      }
    : { fill: fallbackFillLight, stroke: fallbackStrokeLight };
}

/**
 * Text color for numbers inside vectors, theme-aware.
 * @param {boolean} isDarkMode
 * @returns {string}
 */
export function getVectorTextColor(isDarkMode) {
  return isDarkMode ? '#e0e0e0' : '#111';
}
