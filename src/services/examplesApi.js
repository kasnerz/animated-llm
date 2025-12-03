/**
 * Examples API Service
 * Handles loading and caching of example data from JSON files
 *
 * Language fallback behavior:
 * - If requested language has no examples, English examples are returned
 * - If example file is missing, error is thrown (no fallback at file level)
 */

// Simple in-memory cache - separate caches for inference and training
const cachedExamplesLists = {
  inference: null,
  training: null,
};
const cachedExamples = new Map();

// Build a URL to a data file that works both in dev (base='/') and
// on GitHub Pages (base='/animated-llm/').
function buildDataUrl(path) {
  const base = (import.meta.env && import.meta.env.BASE_URL) || '/';
  // Ensure single trailing slash on base
  const normalizedBase = base.endsWith('/') ? base : base + '/';
  // Remove any leading slash from path to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return normalizedBase + cleanPath;
}

import {
  isSpecialToken,
  isChatStartMarker,
  isChatEndMarker,
  isChatRoleToken,
} from '../utils/tokenProcessing.js';

/**
 * Filter special tokens from a generation step
 * @param {Object} step - Generation step object
 * @returns {Object} Filtered step
 */
function filterStepTokens(step) {
  if (!step || !Array.isArray(step.tokens)) return step;

  const keepIdx = [];
  const tokens = step.tokens;
  const ids = Array.isArray(step.token_ids) ? step.token_ids : null;
  let i = 0;
  while (i < tokens.length) {
    const tok = tokens[i];

    // IMPORTANT: handle chat header sequences BEFORE generic special tokens,
    // otherwise we'd skip only the start marker and leave the role visible.
    // Drop chat header sequences such as:
    //  - <|im_start|> user <|im_end|>
    //  - <|start_header_id|> assistant <|end_header_id|>
    if (isChatStartMarker(tok)) {
      i += 1; // skip start marker
      if (i < tokens.length && isChatRoleToken(tokens[i])) {
        i += 1; // skip role token
      }
      if (i < tokens.length && isChatEndMarker(tokens[i])) {
        i += 1; // skip corresponding end marker
      }
      continue;
    }

    // Drop standalone special tokens (markers like <|eot_id|>, <think>, etc.)
    if (isSpecialToken(tok)) {
      i += 1;
      continue;
    }

    // Keep normal tokens
    keepIdx.push(i);
    i += 1;
  }

  const filteredTokens = keepIdx.map((k) => tokens[k]);
  const filteredTokenIds = ids
    ? keepIdx.map((k) => ids[k]).filter((v) => v !== undefined)
    : step.token_ids;

  // Filter embeddings if they exist
  const filteredEmbeddings = {};
  if (step.embeddings) {
    for (const [key, embArray] of Object.entries(step.embeddings)) {
      if (Array.isArray(embArray)) {
        filteredEmbeddings[key] = keepIdx.map((k) => embArray[k]).filter((e) => e !== undefined);
      }
    }
  }

  return {
    ...step,
    tokens: filteredTokens,
    token_ids: filteredTokenIds,
    embeddings: Object.keys(filteredEmbeddings).length > 0 ? filteredEmbeddings : step.embeddings,
  };
}

/**
 * Filter an arbitrary token array (and optional ids) with the same chat-header logic.
 */
function filterTokenArray(tokens, tokenIds = null) {
  if (!Array.isArray(tokens)) return { tokens, tokenIds };
  const keepIdx = [];
  let i = 0;
  while (i < tokens.length) {
    const tok = tokens[i];
    if (isChatStartMarker(tok)) {
      i += 1;
      if (i < tokens.length && isChatRoleToken(tokens[i])) i += 1;
      if (i < tokens.length && isChatEndMarker(tokens[i])) i += 1;
      continue;
    }
    if (isSpecialToken(tok)) {
      i += 1;
      continue;
    }
    keepIdx.push(i);
    i += 1;
  }
  const filteredTokens = keepIdx.map((k) => tokens[k]);
  const filteredIds = Array.isArray(tokenIds)
    ? keepIdx.map((k) => tokenIds[k]).filter((v) => v !== undefined)
    : tokenIds;
  return { tokens: filteredTokens, tokenIds: filteredIds };
}

/**
 * Filter special tokens from example data
 * @param {Object} data - Example data
 * @returns {Object} Filtered example data
 */
function filterSpecialTokens(data) {
  if (!data) return data;

  const result = { ...data };

  // Inference data: filter generation steps
  if (Array.isArray(result.generation_steps)) {
    result.generation_steps = result.generation_steps.map(filterStepTokens);
  }

  // Training data: filter top-level tokens and each training step (with chat-header logic)
  if (Array.isArray(result.tokens)) {
    const { tokens: topTokens, tokenIds: topTokenIds } = filterTokenArray(
      result.tokens,
      Array.isArray(result.token_ids) ? result.token_ids : null
    );
    result.tokens = topTokens;
    if (Array.isArray(result.token_ids)) {
      result.token_ids = topTokenIds;
    }
    if (typeof result.num_tokens === 'number') {
      result.num_tokens = topTokens.length;
    }
  }

  if (Array.isArray(result.training_steps)) {
    // For each training step:
    // - drop steps where target token is special
    // - remove special tokens from input tokens
    // - optionally remove special tokens from predictions (if any)
    const filteredTrainingSteps = [];
    for (const step of result.training_steps) {
      const targetTok = step?.target_token;
      if (isSpecialToken(targetTok)) {
        continue; // skip this step entirely
      }
      const newStep = { ...step };
      // Filter input tokens (with chat-header logic)
      if (Array.isArray(step.input_tokens)) {
        const { tokens: toks, tokenIds: ids } = filterTokenArray(
          step.input_tokens,
          Array.isArray(step.input_token_ids) ? step.input_token_ids : null
        );
        newStep.input_tokens = toks;
        if (Array.isArray(step.input_token_ids)) {
          newStep.input_token_ids = ids;
        }
      }
      // Filter predictions (rarely contain specials, but safe to filter)
      if (Array.isArray(step.predictions)) {
        newStep.predictions = step.predictions.filter((p) => !isSpecialToken(p?.token));
      }
      filteredTrainingSteps.push(newStep);
    }
    result.training_steps = filteredTrainingSteps;
  }

  return result;
}

/**
 * List all available examples
 * @param {string} language - Optional language filter ('en' or 'cs')
 * @param {string} type - Type of examples to load ('inference' or 'training'), defaults to 'inference'
 * @returns {Promise<Array<{id: string, prompt: string}>>} Array of example metadata
 */
export async function listExamples(language = null, type = 'inference') {
  try {
    // Always fetch fresh data if we don't have it cached
    if (!cachedExamplesLists[type]) {
      const response = await fetch(buildDataUrl(`data/${type}/examples.json`));
      if (!response.ok) {
        throw new Error(`Failed to load examples: ${response.statusText}`);
      }

      const data = await response.json();
      cachedExamplesLists[type] = data.examples;
    }

    // Filter by language if specified
    if (language) {
      const filteredExamples = cachedExamplesLists[type].filter((ex) => ex.language === language);

      // If no examples found for the requested language, fallback to English
      if (filteredExamples.length === 0 && language !== 'en') {
        console.warn(`No examples found for language '${language}', falling back to English`);
        return cachedExamplesLists[type].filter((ex) => ex.language === 'en');
      }

      return filteredExamples;
    }

    return cachedExamplesLists[type];
  } catch (error) {
    console.error('Error loading examples list:', error);
    throw error;
  }
}

/**
 * Get a specific example by ID
 * @param {string} exampleId - The ID of the example to load
 * @param {string} type - Type of example to load ('inference' or 'training'), defaults to 'inference'
 * @param {boolean} showSpecialTokens - Whether to include special tokens in the data, defaults to false
 * @returns {Promise<Object>} The example data including generation steps
 */
export async function getExample(exampleId, type = 'inference', showSpecialTokens = false) {
  // Create a cache key that includes the showSpecialTokens flag
  const cacheKey = `${type}_${exampleId}_${showSpecialTokens}`;

  // Return cached example if available
  if (cachedExamples.has(cacheKey)) {
    return cachedExamples.get(cacheKey);
  }

  try {
    // First, get the examples list to find the correct filename and language
    const examples = await listExamples(null, type);
    const exampleMeta = examples.find((ex) => ex.id === exampleId);

    if (!exampleMeta) {
      throw new Error(`Example ${exampleId} not found in examples list`);
    }

    // Use the filename from the examples list
    const filename = exampleMeta.file || `${exampleId}.json`;

    // Construct the path: data/{type}/{filename}
    // Note: The filename already includes the language subfolder (e.g., "cs/cs-001-full.json")
    const response = await fetch(buildDataUrl(`data/${type}/${filename}`));

    if (!response.ok) {
      throw new Error(`Failed to load example ${exampleId}: ${response.statusText}`);
    }

    const data = await response.json();

    // Filter out special tokens before caching.
    // In training view, we ALWAYS filter to hide special tokens.
    const shouldFilter = type === 'training' ? true : !showSpecialTokens;
    const processedData = shouldFilter ? filterSpecialTokens(data) : data;

    cachedExamples.set(cacheKey, processedData);
    return processedData;
  } catch (error) {
    console.error(`Error loading example ${exampleId}:`, error);
    throw error;
  }
}

/**
 * Clear the cache (useful for testing or forced refresh)
 */
export function clearCache() {
  cachedExamplesLists.inference = null;
  cachedExamplesLists.training = null;
  cachedExamples.clear();
}
