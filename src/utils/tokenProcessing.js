/**
 * Utility functions for processing tokens with special space characters
 */

/**
 * Process a token for display in the visualization canvas
 * Converts "Ġ" and "▁" to "▁" for visual representation
 * @param {string} token - The raw token string
 * @returns {string} Processed token for visualization
 */
export function processTokenForVisualization(token) {
  if (!token) return token;

  // Replace both "Ġ" and "▁" with "▁" for visualization
  return token.replace(/Ġ/g, '▁').replace(/▁/g, '▁');
}

/**
 * Process a token for display in text (user input or model answer)
 * Converts "Ġ" and "▁" to regular space " "
 * @param {string} token - The raw token string
 * @returns {string} Processed token for text display
 */
export function processTokenForText(token) {
  if (!token) return token;

  // Replace both "Ġ" and "▁" with a regular space
  return token.replace(/Ġ/g, ' ').replace(/▁/g, ' ');
}

/**
 * Check if a token contains a space marker
 * @param {string} token - The raw token string
 * @returns {boolean} True if token starts with a space marker
 */
export function hasSpaceMarker(token) {
  if (!token) return false;
  return token.includes('Ġ') || token.includes('▁');
}
