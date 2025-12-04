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
    pattern: /vanilla/i,
    logo: 'transformer.png',
    size: '1b',
    id: 'meta-llama/Llama-3.2-1B-Instruct',
    name: 'Transformer 1B (random)',
    training_view: true,
    decoding_view: false,
  },
  {
    pattern: /aya-expanse-8b/i,
    logo: 'aya.png',
    size: '8b',
    id: 'CohereLabs/aya-expanse-8b',
    name: 'Aya-Expanse 8B',
    training_view: true,
    decoding_view: true,
  },
  {
    pattern: /Llama-3\.2-1B-Instruct/i,
    logo: 'meta.png',
    size: '1b',
    id: 'meta-llama/Llama-3.2-1B-Instruct',
    name: 'Llama3.2 1B',
    training_view: true,
    decoding_view: true,
  },
  {
    pattern: /Qwen3-4B-Instruct/i,
    logo: 'qwen.png',
    size: '4b',
    id: 'Qwen/Qwen3-4B-Instruct-2507',
    name: 'Qwen3-4B',
    training_view: true,
    decoding_view: true,
  },
  {
    pattern: /olmo/i,
    logo: 'ai2.png',
    size: '7b',
    id: 'allenai/Olmo-3-7B-Think',
    name: 'Olmo3-7B-Think',
    training_view: true,
    decoding_view: true,
  },
  {
    pattern: /gpt2-xl/i,
    logo: 'openai.png',
    size: '1.5b',
    id: 'openai-community/gpt2-xl',
    name: 'GPT-2-XL',
    training_view: true,
    decoding_view: true,
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
