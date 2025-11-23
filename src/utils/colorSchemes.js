// Color schemes for tokens and embeddings

/**
 * Token colors - used for token boxes
 */
export const TOKEN_COLORS = {
  default: [
    '#FFB6C1', // Light pink
    '#87CEEB', // Sky blue
    '#98FB98', // Pale green
    '#FFD700', // Gold
    '#DDA0DD', // Plum
    '#FFA07A', // Light salmon
    '#87CEFA', // Light sky blue
    '#F0E68C', // Khaki
    '#FFB6E1', // Light magenta
    '#B0E0E6', // Powder blue
  ],
};

/**
 * Get color for a token by index
 * @param {number} index - Token index
 * @returns {string} Color hex code
 */
export function getTokenColor(index) {
  return TOKEN_COLORS.default[index % TOKEN_COLORS.default.length];
}

/**
 * Get color for embedding value (-1 to 1 range)
 * Uses grayscale: negative values → lighter, positive values → darker
 * @param {number} value - Embedding value between -1 and 1
 * @returns {string} RGB color string
 */
export function getEmbeddingColor(value) {
  // Clamp value to [-1, 1]
  const clampedValue = Math.max(-1, Math.min(1, value));

  if (clampedValue < 0) {
    // Negative: lighter grays (towards white)
    const intensity = Math.abs(clampedValue); // 0 to 1
    // Range from light gray (#e0e0e0) to white (#ffffff)
    const grayValue = Math.floor(224 + (255 - 224) * (1 - intensity));
    return `rgb(${grayValue}, ${grayValue}, ${grayValue})`;
  } else {
    // Positive: darker grays
    const intensity = clampedValue; // 0 to 1
    // Range from light gray (#e0e0e0) to dark gray (#505050)
    const grayValue = Math.floor(224 - (224 - 80) * intensity);
    return `rgb(${grayValue}, ${grayValue}, ${grayValue})`;
  }
}

/**
 * Get color for probability value (0 to 1 range)
 * Returns color from theme (green for high probability)
 * @param {number} probability - Probability between 0 and 1
 * @returns {string} CSS color variable or hex
 */
export function getProbabilityColor(probability) {
  // Use CSS variables from theme
  if (probability > 0.5) {
    return 'var(--primary-color)';
  } else if (probability > 0.2) {
    return 'var(--secondary-color)';
  } else {
    return 'var(--tertiary-color)';
  }
}

/**
 * Simple Viridis colormap implementation (discrete stops, fast & dependency-free)
 * Source stop values approximated from matplotlib viridis.
 * We keep it lightweight – no interpolation needed for this visualization.
 * @param {number} value - Probability in [0,1]
 * @returns {string} Hex color
 */
export function getViridisColor(value) {
  const stops = [
    '#440154', // dark purple
    '#414487', // indigo
    '#2A788E', // teal-ish
    '#22A884', // green-teal
    '#7AD151', // yellow-green
    '#FDE725', // bright yellow
  ];
  if (isNaN(value) || value < 0) value = 0;
  if (value > 1) value = 1;
  const idx = Math.min(stops.length - 1, Math.floor(value * (stops.length - 1)));
  return stops[idx];
}

/**
 * Get opacity for visualization elements based on state
 * @param {string} state - Element state ('active', 'inactive', 'hover')
 * @returns {number} Opacity value between 0 and 1
 */
export function getOpacity(state) {
  switch (state) {
    case 'active':
      return 1.0;
    case 'hover':
      return 0.8;
    case 'inactive':
      return 0.3;
    default:
      return 1.0;
  }
}

export default {
  TOKEN_COLORS,
  getTokenColor,
  getEmbeddingColor,
  getProbabilityColor,
  getViridisColor,
  getOpacity,
};
