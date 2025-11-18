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

/**
 * Check if a token is a special token that should be filtered out
 * Special tokens include: <BOS_TOKEN>, <EOS_TOKEN>, <|{TOKEN_NAME}|>
 * @param {string} token - Token to check
 * @returns {boolean} True if token should be filtered out
 */
function isSpecialToken(token) {
  if (!token || typeof token !== 'string') return false;

  // Match <BOS_TOKEN>, <EOS_TOKEN>, or <|anything|>
  return token === '<BOS_TOKEN>' || token === '<EOS_TOKEN>' || /^<\|.*\|>$/.test(token);
}

/**
 * Filter special tokens from a generation step
 * @param {Object} step - Generation step object
 * @returns {Object} Filtered step
 */
function filterStepTokens(step) {
  if (!step || !step.tokens) return step;

  const filteredIndices = [];
  const filteredTokens = [];
  const filteredTokenIds = [];

  step.tokens.forEach((token, index) => {
    if (!isSpecialToken(token)) {
      filteredIndices.push(index);
      filteredTokens.push(token);
      if (step.token_ids && step.token_ids[index] !== undefined) {
        filteredTokenIds.push(step.token_ids[index]);
      }
    }
  });

  // Filter embeddings if they exist
  const filteredEmbeddings = {};
  if (step.embeddings) {
    for (const [key, embArray] of Object.entries(step.embeddings)) {
      if (Array.isArray(embArray)) {
        filteredEmbeddings[key] = filteredIndices
          .map((i) => embArray[i])
          .filter((e) => e !== undefined);
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
 * Filter special tokens from example data
 * @param {Object} data - Example data
 * @returns {Object} Filtered example data
 */
function filterSpecialTokens(data) {
  if (!data || !data.generation_steps) return data;

  return {
    ...data,
    generation_steps: data.generation_steps.map(filterStepTokens),
  };
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
  const cacheKey = `${exampleId}_${showSpecialTokens}`;

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

    // Filter out special tokens before caching, unless showSpecialTokens is true
    const processedData = showSpecialTokens ? data : filterSpecialTokens(data);

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
