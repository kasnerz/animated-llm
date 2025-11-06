/**
 * Model Configuration
 * Maps model identifiers to their display properties
 */

/**
 * Model registry mapping model_id patterns to display information
 *
 * Structure:
 * - pattern: RegExp or string to match against model_id
 * - logo: filename in src/assets/model-logos/ (without path)
 * - size: model size (e.g., "7b", "8b", "13b", "70b")
 * - name: optional display name (not currently used but available for future)
 */
export const MODEL_REGISTRY = [
  // Example entries - populate with actual models
  {
    pattern: /aya-expanse-8b/i,
    logo: 'aya.png',
    size: '8b',
    name: 'Aya',
  },
  // Add more model patterns here
];

/**
 * Get model display info from model_id
 * @param {string} modelId - The model identifier from the example
 * @returns {object|null} Model display info or null if not found
 */
export function getModelInfo(modelId) {
  if (!modelId) return null;

  for (const entry of MODEL_REGISTRY) {
    const pattern =
      typeof entry.pattern === 'string' ? new RegExp(entry.pattern, 'i') : entry.pattern;

    if (pattern.test(modelId)) {
      return {
        logo: entry.logo,
        size: entry.size,
        name: entry.name,
      };
    }
  }

  return null; // Unknown model
}

/**
 * Get temperature emoji based on temperature value
 * @param {number} temperature - Temperature value
 * @returns {string} Emoji representing the temperature range
 */
export function getTemperatureEmoji(temperature) {
  if (temperature == null) return '';

  const temp = typeof temperature === 'number' ? temperature : parseFloat(temperature);

  if (temp < 1.0) return '🧊'; // Ice cube for cold/deterministic
  if (temp === 1.0) return '🌡️'; // Thermometer for neutral
  return '🌶️'; // Hot pepper for creative/random
}

/**
 * Format temperature display
 * @param {number} temperature - Temperature value
 * @returns {string} Formatted temperature string with emoji
 */
export function formatTemperature(temperature) {
  if (temperature == null) return '';

  const emoji = getTemperatureEmoji(temperature);
  const value = typeof temperature === 'number' ? temperature.toFixed(1) : String(temperature);

  return `${emoji} ${value}`;
}
