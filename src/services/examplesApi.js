/**
 * Examples API Service
 * Handles loading and caching of example data from JSON files
 */

// Simple in-memory cache
let cachedExamplesList = null;
const cachedExamples = new Map();

/**
 * List all available examples
 * @param {string} language - Optional language filter ('en' or 'cs')
 * @returns {Promise<Array<{id: string, prompt: string}>>} Array of example metadata
 */
export async function listExamples(language = null) {
  try {
    // Always fetch fresh data if we don't have it cached
    if (!cachedExamplesList) {
      const response = await fetch('/data/examples.json');
      if (!response.ok) {
        throw new Error(`Failed to load examples: ${response.statusText}`);
      }

      const data = await response.json();
      cachedExamplesList = data.examples;
    }

    // Filter by language if specified
    if (language) {
      return cachedExamplesList.filter((ex) => ex.language === language);
    }

    return cachedExamplesList;
  } catch (error) {
    console.error('Error loading examples list:', error);
    throw error;
  }
}

/**
 * Get a specific example by ID
 * @param {string} exampleId - The ID of the example to load
 * @returns {Promise<Object>} The example data including generation steps
 */
export async function getExample(exampleId) {
  // Return cached example if available
  if (cachedExamples.has(exampleId)) {
    return cachedExamples.get(exampleId);
  }

  try {
    // First, get the examples list to find the correct filename
    const examples = await listExamples();
    const exampleMeta = examples.find((ex) => ex.id === exampleId);

    if (!exampleMeta) {
      throw new Error(`Example ${exampleId} not found in examples list`);
    }

    // Use the filename from the examples list
    const filename = exampleMeta.file || `${exampleId}.json`;
    const response = await fetch(`/data/${filename}`);

    if (!response.ok) {
      throw new Error(`Failed to load example ${exampleId}: ${response.statusText}`);
    }

    const data = await response.json();
    cachedExamples.set(exampleId, data);
    return data;
  } catch (error) {
    console.error(`Error loading example ${exampleId}:`, error);
    throw error;
  }
}

/**
 * Clear the cache (useful for testing or forced refresh)
 */
export function clearCache() {
  cachedExamplesList = null;
  cachedExamples.clear();
}
