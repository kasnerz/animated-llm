/**
 * Visualization constants and defaults
 * Central place for magic numbers and default values
 */

/**
 * Get computed CSS variable value
 * @param {string} varName - CSS variable name (with or without --)
 * @returns {string} Computed value
 */
function getCSSVar(varName) {
  const name = varName.startsWith('--') ? varName : `--${varName}`;
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/**
 * Layout constants
 */
export const LAYOUT = {
  TOKEN_SPACING: 140,
  MARGIN: 20,
  BLOCK_PADDING: 30,
  TOKEN_Y: 10,
  EMBEDDING_Y: 140,
  // Vertical spacing controls
  OUTPUT_Y_OFFSET: 90, // distance from FFN bottom to output area
  BOTTOM_PADDING: 80, // final padding under the lowest element (easy to tweak)
  CELL_HEIGHT: 8,
  CELL_WIDTH: 8,
  EMBEDDING_WIDTH: 40,
  VECTOR_HEIGHT: 40,
  CORNER_RADIUS: 10,
  GAP_WIDTH: 24,
};

/**
 * Animation timing constants
 */
export const TIMING = {
  TRANSITION_DURATION: 0.3,
  ANIMATION_DURATION: 1.0,
  EASE: 'power2.inOut',
};

/**
 * Color getters that read from CSS variables
 * These are functions so they reflect theme changes
 */
export const COLORS = {
  // Visualization-specific
  getArrowColor: () => getCSSVar('viz-arrow-color') || '#cccccc',
  getStrokeColor: () => getCSSVar('viz-stroke-color') || '#555555',
  getTextColor: () => getCSSVar('viz-text-color') || '#333333',
  getMutedColor: () => getCSSVar('viz-muted-color') || '#666666',
  getNeutralColor: () => getCSSVar('viz-neutral-color') || '#cccccc',

  // Theme colors
  getPrimaryText: () => getCSSVar('text-primary') || '#1a1a1a',
  getSecondaryText: () => getCSSVar('text-secondary') || '#666666',
  getBorderColor: () => getCSSVar('border-color') || '#e0e0e0',

  // Default fallbacks for pure functions
  DEFAULT_ARROW: '#999',
  DEFAULT_STROKE: '#555',
  DEFAULT_FILL: '#ccc',
  DEFAULT_TEXT: '#333',
  DEFAULT_MUTED: '#666',
};

/**
 * Marker and stroke defaults
 */
export const STROKE = {
  WIDTH_THIN: 0.5,
  WIDTH_NORMAL: 1.5,
  WIDTH_THICK: 2,
  OPACITY_DEFAULT: 0.8,
  OPACITY_HOVER: 1.0,
  MARKER_SIZE: 6,
};

/**
 * Font settings
 */
export const FONTS = {
  MONO: "'Consolas', 'Courier New', monospace",
  SIZE_SMALL: '8px',
  SIZE_NORMAL: '12px',
  SIZE_MEDIUM: '14px',
  SIZE_LARGE: '16px',
  SIZE_XLARGE: '20px',
  SIZE_HEADING: '22px',
};
