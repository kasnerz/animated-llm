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
  // Token layout (used in layout.js)
  TOKEN_SPACING: 140,
  TOKEN_SPACING_ESTIMATE: 170, // Used for max visible tokens calculation
  TOKEN_WIDTH_REDUCTION: 10, // Amount to reduce from tokenSpacing for token width
  MARGIN: 20,
  MARGIN_MOBILE: -50, // Tighter margins on mobile for edge-to-edge layout
  GAP_WIDTH: 24,
  LEFT_BIAS: 0, // No horizontal bias; keep visualization centered under input
  // Token positioning
  TOKEN_Y: 10,
  EMBEDDING_Y: 75,
  // Transformer block (used via CONSTS in components)
  BLOCK_PADDING: 30, // Padding inside transformer block
  BLOCK_PADDING_LARGE: 100, // Larger padding for certain block calculations
  BLOCK_Y_OFFSET: 60, // Vertical spacing after embeddings to block
  OUTPUT_Y_OFFSET: 90, // distance from FFN bottom to output area
  BOTTOM_PADDING: 80, // final padding under the lowest element
  // Transformer block internals
  INSIDE_EMBEDDING_HEIGHT: 50, // Approximate height of embeddings inside block
  INSIDE_ATTENTION_HEIGHT: 80, // Height of attention layer inside block
  INSIDE_SPACING: 20, // Spacing between components inside block
  // Vector/embedding dimensions (used in draw.js)
  CELL_HEIGHT: 8,
  CELL_WIDTH: 8,
  EMBEDDING_WIDTH: 40,
  VECTOR_HEIGHT: 40,
  CORNER_RADIUS: 10,
  // Output distribution
  MAX_OUTPUT_TOKENS: 7, // Show at most this many tokens (+ ellipsis if more exist)
  MAX_OUTPUT_TOKENS_MOBILE: 3, // Limit to 3 tokens on mobile for tighter layout
  OUTPUT_MARGIN: 20, // Margin for output distribution
  OUTPUT_BAR_SPACING: 4, // Spacing between distribution bars
  OUTPUT_MAX_BAR_WIDTH: 80, // Maximum width of distribution bars
  OUTPUT_MAX_HEIGHT: 200, // Maximum height of distribution visualization
  // Content width calculations
  CONTENT_PADDING: 0, // Padding added to estimated content width
  EXPANDED_EXTRA_PADDING: 40, // Extra padding when tokens are expanded (to ensure scrollbar appears)
  // Sizing and thresholds
  MIN_VISUALIZATION_WIDTH: 0,
  MIN_SCROLL_AREA_WIDTH: 500,
  DEFAULT_CONTAINER_WIDTH: 800,
  MIN_LABELS_WIDTH: 340,
  MAX_LABELS_WIDTH: 360,
  MAX_LABELS_WIDTH_RATIO: 0.5, // Max labels width as ratio of total width
  // Collapse button
  COLLAPSE_BUTTON_SIZE: 32, // Full size of collapse button (buttonHalf = 16)
  COLLAPSE_BUTTON_EDGE_MARGIN: 4, // Minimum margin from edges
};

/**
 * Token rendering constants
 */
export const TOKEN = {
  MIN_BOX_WIDTH: 36,
  HORIZ_PADDING: 16,
  GAP: 70,
  CHAR_WIDTH: 10,
  BOX_HEIGHT: 44,
  BOX_RADIUS: 8,
  TEXT_SIZE: '18px',
  TEXT_Y_OFFSET: 6,
  UNDERLINE_Y: 18,
  UNDERLINE_WIDTH: 6,
  UNDERLINE_INSET: 8,
  ID_Y_OFFSET: 40,
  ID_TEXT_SIZE: '13px',
  ID_BELOW_UNDERLINE: 45,
  ELLIPSIS_WIDTH: 24,
};

/**
 * Embedding/Vector rendering constants
 */
export const VECTOR = {
  // Horizontal mini-vector (3-value display)
  CELL_WIDTH: 26,
  CELL_HEIGHT: 18,
  GAP: 6,
  PADDING_X: 6,
  PADDING_Y: 6,
  BOX_RADIUS: 8,
  CELL_RADIUS: 4,
  TEXT_SIZE: '10px',
  TEXT_Y_OFFSET: 3,

  // Logprob vector (wider cells for probability display)
  LOGPROB_CELL_WIDTH: 60,
  LOGPROB_CELL_HEIGHT: 24,
  LOGPROB_GAP: 9,
  LOGPROB_BOX_RADIUS: 10,
};

/**
 * Transformer block constants
 */
export const TRANSFORMER = {
  BLOCK_TOP_OFFSET: 90,
  STACK_OFFSET_X: 8,
  STACK_OFFSET_Y: -8,
  MAX_SHADOWS: 3,
  SHADOW_PADDING: 60,
  ATTENTION_HEIGHT: 45,
  FFN_ARROW_GAP: 70,
  POSITIONAL_CIRCLE_RADIUS: 10,
  POSITIONAL_TEXT_SIZE: '10px',
  POSITIONAL_Y_BIAS: -15,
  FEEDBACK_ARROW_LIFT: 28,
  FEEDBACK_ARROW_SIZE: 4,
  PROJECTION_BOX_SIZE: 18,
  PROJECTION_BOX_RADIUS: 5,
  ATTENTION_LINE_WIDTH: 0.5,
  ATTENTION_BASE_OPACITY: 0.3,
  ATTENTION_OPACITY_RANGE: 0.15,
  STACK_LABEL_SIZE: '14px',
  STACK_LABEL_OFFSET_X: 14,
  STACK_LABEL_OFFSET_Y: 6,
};

/**
 * Output layer constants
 */
export const OUTPUT = {
  OUTER_TO_HORIZ_GAP: 20,
  HORIZ_TO_LOGPROB_GAP: 60,
  ARROW_START_OFFSET: 8,
  ARROW_HEIGHT: 18,
  LABEL_GAP: 6,
  LABEL_SPACING: 20,
  TOKEN_LABEL_SIZE: '13px',
  PERCENTAGE_LABEL_SIZE: '12px',
  ELLIPSIS_SIZE: '16px',
  HIGHLIGHT_PADDING: 10,
  HIGHLIGHT_RADIUS: 12,
  HIGHLIGHT_STROKE_WIDTH: 3,
  APPEND_PATH_DOWN: 26,
  APPEND_PATH_RADIUS: 10,
  MARKER_SIZE: 6,
  MAX_TOKEN_CHARS_APPROX: 7, // Approximate char width for 13px font
  // Training-specific geometry
  TARGET_VECTOR_EXTRA_GAP: 30, // extra gap under percentage labels before target vector
  DIFF_ARROW_HEIGHT: 12, // shorter upward arrow height
};

/**
 * Stage label constants
 */
export const STAGE_LABEL = {
  GAP_TO_LINE: 0,
  GAP_LINE_TO_LABEL: 12,
  HIGHLIGHT_WIDTH: 300,
  HIGHLIGHT_HEIGHT: 50,
  HIGHLIGHT_RADIUS: 6,
  HEADING_SIZE: '17px',
  HINT_SIZE: '11px',
  HINT_Y_OFFSET: 19,
  LINE_WIDTH: 1.5,
  CONNECTOR_DASHARRAY: '3,3',
  VERTICAL_PADDING: 40,
  // Fixed Y positions for each stage label
  Y_TOKENIZATION: 22,
  Y_INPUT_EMBEDDINGS: 85,
  Y_POSITIONAL_EMBEDDINGS: 150,
  Y_ATTENTION_LAYER: 265,
  Y_FEEDFORWARD_LAYER: 370,
  Y_LAST_EMBEDDING: 490,
  Y_OUTPUT_PROBABILITIES: 590,
  Y_NEXT_TOKEN: 660,
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
  MARKER_SIZE: 4,
};

/**
 * Font settings
 */
export const FONTS = {
  MONO: "'Consolas', 'Courier New', monospace",
  FAMILY_UI: "'Roboto', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI',  sans-serif",
  SIZE_SMALL: '8px',
  SIZE_NORMAL: '12px',
  SIZE_MEDIUM: '14px',
  SIZE_LARGE: '16px',
  SIZE_XLARGE: '20px',
  SIZE_HEADING: '22px',
  WEIGHT_NORMAL: '400',
  WEIGHT_MEDIUM: '500',
  WEIGHT_SEMIBOLD: '600',
  WEIGHT_BOLD: '700',
};

/**
 * Embedding layer arrow constants
 */
export const EMBEDDING_ARROW = {
  STROKE_COLOR: '#cccccc',
  STROKE_WIDTH: 1.5,
  OPACITY: 0.7,
  HEAD_FILL: '#cccccc',
  HEAD_SIZE: 4,
  FROM_TOKEN_OFFSET: 45,
  TO_VECTOR_OFFSET: 3,
};

/**
 * Transformer layer arrow constants
 */
export const TRANSFORMER_ARROWS = {
  ARROW_BACK_OFFSET: 22,
  FEEDBACK_STROKE: '#c0c0c0',
  FEEDBACK_WIDTH: 1.5,
  FEEDBACK_OPACITY: 0.9,
  POSITIONAL_STROKE: '#cccccc',
  POSITIONAL_WIDTH: 1.5,
  POSITIONAL_OPACITY: 1.0,
};

/**
 * FFN connector constants
 */
export const FFN_CONNECTOR = {
  LINE_WIDTH: 0.5,
  LINE_OPACITY_INITIAL: 0,
  COLOR_START: '#E5E7EB',
  COLOR_END: '#797b7dff',
  PROJECTION_BOX_FILL: '#c4d3cfff',
  PROJECTION_BOX_OPACITY_INITIAL: 0,
};

/**
 * Attention connection constants
 */
export const ATTENTION_LINES = {
  COLOR_START: '#E5E7EB',
  COLOR_END: '#797b7dff',
  ALL_TO_ONE_OPACITY: 0.35,
};

/**
 * Positional indicator constants
 */
export const POSITIONAL_INDICATOR = {
  CIRCLE_FILL: '#eeeeee',
  CIRCLE_STROKE: '#bbbbbb',
  TEXT_FILL: '#777777',
  TEXT_Y_OFFSET: 3,
};

/**
 * Transformer box constants
 */
export const TRANSFORMER_BOX = {
  BORDER_RADIUS: 10,
  STROKE_WIDTH: 2,
};

/**
 * Output layer arrow constants
 */
export const OUTPUT_ARROWS = {
  EXTRACTED_STROKE: '#c0c0c0',
  EXTRACTED_WIDTH: 1.5,
  EXTRACTED_OPACITY: 0.9,
  DISTRIBUTION_STROKE: '#999999',
  DISTRIBUTION_WIDTH: 1.5,
  DISTRIBUTION_OPACITY: 0.7,
  DISTRIBUTION_HEAD_SIZE: 4,
  APPEND_STROKE: '#969595ff',
  APPEND_WIDTH: 1,
  APPEND_DASHARRAY: '4,4',
  APPEND_MARKER_FILL: '#cccccc',
  APPEND_OPACITY_INITIAL: 0,
  HIGHLIGHT_STROKE_COLOR: '#007E66',
  ELLIPSIS_COLOR: '#999999',
  // Upward arrows from target vector to difference labels (lighter, shorter)
  DIFF_UP_STROKE: '#bbbbbb',
  DIFF_UP_WIDTH: 1.2,
  DIFF_UP_OPACITY: 0.6,
  DIFF_UP_HEAD_SIZE: 3.5,
};

/**
 * Stage label opacity constants
 */
export const STAGE_LABEL_OPACITY = {
  DELIMITER: 0.4,
  HIGHLIGHT: 0.6,
  CONNECTOR_ACTIVE: 0.6,
  CONNECTOR_INACTIVE: 0.3,
  TEXT: 1.0,
  HINT: 0.8,
};
