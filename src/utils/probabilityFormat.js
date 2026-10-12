/**
 * Utility functions for displaying next-token probabilities consistently
 */

/**
 * Get the factor that renormalizes a set of candidate probabilities summing above 1.
 * The stored probabilities come from low-precision softmax outputs, so the top token
 * can be exactly 1.0 while other candidates are still non-zero.
 * @param {number[]} probs - Candidate probabilities
 * @returns {number} Factor to multiply each probability by
 */
export function probabilityScale(probs) {
  const sum = probs.reduce((acc, p) => acc + (p > 0 ? p : 0), 0);
  return sum > 1 ? 1 / sum : 1;
}

/**
 * Format a probability as a percentage, rounded down so that the displayed values
 * of a distribution never add up to more than 100%.
 * @param {number} prob - Probability in [0, 1]
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted percentage, e.g. "99.99%"
 */
export function formatProbability(prob, decimals = 2) {
  const factor = 10 ** decimals;
  const pct = prob > 0 ? Math.min(prob, 1) * 100 : 0;
  // The tiny epsilon keeps values like 0.29 * 100 = 28.999999999999996 from dropping a digit
  const floored = Math.floor(pct * factor + 1e-9) / factor;
  return `${floored.toFixed(decimals)}%`;
}
