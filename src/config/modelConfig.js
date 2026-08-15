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
 * - name: display name; keep it to the bare model identifier, since the
 *   properties listed in the model hint popover carry the explanatory detail
 * - repo: link to the model's repository, omitted where there is nothing
 *   meaningful to link to (the Vanilla Transformer has random weights)
 * - instruction_tuned: model was fine-tuned to follow instructions
 * - reasoning: model emits a thinking/reasoning trace before its answer
 */
export const MODEL_REGISTRY = [
  // Example entries - populate with actual models
  // NOTE: gemma-4-E4B-it must come before the gemma-4-E4B base entry, otherwise
  // the base pattern would also match the instruction-tuned model id.
  {
    pattern: /gemma-4-E4B-it/i,
    logo: 'gemma.png',
    size: '4b',
    id: 'google/gemma-4-E4B-it',
    repo: 'https://huggingface.co/google/gemma-4-E4B-it',
    name: 'Gemma4-E4B-it',
    training_view: true,
    decoding_view: true,
    instruction_tuned: true,
    reasoning: false,
  },
  {
    pattern: /gemma-4-E4B$/i,
    logo: 'gemma.png',
    size: '4b',
    id: 'google/gemma-4-E4B',
    repo: 'https://huggingface.co/google/gemma-4-E4B',
    name: 'Gemma4-E4B',
    training_view: true,
    decoding_view: true,
    instruction_tuned: false,
    reasoning: false,
  },
  {
    pattern: /SmolLM-1\.7B-Instruct/i,
    logo: 'huggingface.png',
    size: '1.7b',
    id: 'HuggingFaceTB/SmolLM-1.7B-Instruct',
    repo: 'https://huggingface.co/HuggingFaceTB/SmolLM-1.7B-Instruct',
    name: 'SmolLM-1.7B',
    training_view: true,
    decoding_view: true,
    instruction_tuned: true,
    reasoning: false,
  },
  {
    pattern: /Qwen3\.5-9B/i,
    logo: 'qwen.png',
    size: '9b',
    id: 'Qwen/Qwen3.5-9B',
    repo: 'https://huggingface.co/Qwen/Qwen3.5-9B',
    name: 'Qwen3.5-9B',
    training_view: true,
    decoding_view: true,
    instruction_tuned: true,
    reasoning: true,
  },
  {
    pattern: /gpt2-xl/i,
    logo: 'openai.png',
    size: '1.5b',
    id: 'openai-community/gpt2-xl',
    repo: 'https://huggingface.co/openai-community/gpt2-xl',
    name: 'GPT-2-XL',
    training_view: true,
    decoding_view: true,
    instruction_tuned: false,
    reasoning: false,
  },
  {
    pattern: /vanilla/i,
    logo: 'transformer.png',
    size: '1b',
    id: 'meta-llama/Llama-3.2-1B-Instruct',
    name: 'Transformer 1B',
    training_view: true,
    decoding_view: false,
    instruction_tuned: false,
    reasoning: false,
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
        id: entry.id,
        repo: entry.repo,
        instruction_tuned: !!entry.instruction_tuned,
        reasoning: !!entry.reasoning,
      };
    }
  }

  return null; // Unknown model
}

/**
 * Get temperature icon identifier based on value
 * @param {number} temperature - Temperature value
 * @returns {string} Icon identifier representing the temperature range
 */
export function getTemperatureEmoji(temperature) {
  if (temperature == null) return '';

  const temp = typeof temperature === 'number' ? temperature : parseFloat(temperature);

  if (temp < 1.0) return 'snowflake'; // Snowflake for cold/deterministic
  if (temp === 1.0) return 'thermometer'; // Thermometer for neutral
  return 'fire'; // Fire for creative/hot
}

/**
 * Format temperature display
 * @param {number} temperature - Temperature value
 * @returns {string} Formatted temperature string with icon identifier
 */
export function formatTemperature(temperature) {
  if (temperature == null) return '';

  const icon = getTemperatureEmoji(temperature);
  const value = typeof temperature === 'number' ? temperature.toFixed(1) : String(temperature);

  return `${icon} ${value}`;
}
