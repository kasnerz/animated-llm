/**
 * Translations for the application
 * Supports English (en) and Czech (cs)
 */

export const translations = {
  en: {
    start_generation: 'Start Generation',
    next_token: 'Next Token',
    toggle_theme: 'Toggle Theme',
    toggle_language: 'Toggle Language',
    loading: 'Loading...',
    error: 'Error',
    retry: 'Retry',
    // Stage labels
    stage_tokenization: 'Tokenization',
    stage_token_ids: 'Token ids',
    stage_input_embeddings: 'Input embeddings',
    stage_attention_layer: 'Attention layer',
    stage_feedforward_layer: 'Feed-forward layer',
    stage_output_embeddings: 'Output embeddings',
    stage_last_embedding: 'Last embedding',
    stage_output_probabilities: 'Output probabilities',
  },
  cs: {
    start_generation: 'Začít generování',
    next_token: 'Další token',
    toggle_theme: 'Přepnout téma',
    toggle_language: 'Přepnout jazyk',
    loading: 'Načítání...',
    error: 'Chyba',
    retry: 'Zkusit znovu',
    // Stage labels
    stage_tokenization: 'Tokenizace',
    stage_token_ids: 'Id tokenů',
    stage_input_embeddings: 'Vstupní embeddingy',
    stage_attention_layer: 'Vrstva Attention',
    stage_feedforward_layer: 'Vrstva Feed-forward',
    stage_output_embeddings: 'Výstupní embeddingy',
    stage_last_embedding: 'Poslední embedding',
    stage_output_probabilities: 'Pravděpodobnosti výstupu',
  },
};

/**
 * Get translated text for a key
 * @param {string} key - Translation key
 * @param {string} language - Language code ('en' or 'cs')
 * @returns {string} Translated text
 */
export function translate(key, language = 'en') {
  return translations[language]?.[key] || translations.en[key] || key;
}
