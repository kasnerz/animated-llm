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
    model_answer: 'Model answer',
    // Stage labels
    stage_tokenization: 'Tokenization',
    stage_tokenization_hint: 'Segmenting the text into smaller units',
    stage_token_ids: 'Token ids',
    stage_token_ids_hint: 'Converting tokens to numeric identifiers',
    stage_input_embeddings: 'Input embeddings',
    stage_input_embeddings_hint: 'Mapping tokens to dense vectors',
    stage_attention_layer: 'Attention layer',
    stage_attention_layer_hint: 'Identifying relationships between tokens',
    stage_feedforward_layer: 'Feed-forward layer',
    stage_feedforward_layer_hint: 'Processing information in each position',
    stage_output_embeddings: 'Output embeddings',
    stage_output_embeddings_hint: 'Transforming hidden states to embeddings',
    stage_last_embedding: 'Last embedding',
    stage_last_embedding_hint: 'Extracting the final token representation',
    stage_output_probabilities: 'Output probabilities',
    stage_output_probabilities_hint: 'Computing likelihood for each token',
  },
  cs: {
    start_generation: 'Začít generování',
    next_token: 'Další token',
    toggle_theme: 'Přepnout téma',
    toggle_language: 'Přepnout jazyk',
    loading: 'Načítání...',
    error: 'Chyba',
    retry: 'Zkusit znovu',
    model_answer: 'Odpověď modelu',
    // Stage labels
    stage_tokenization: 'Tokenizace',
    stage_tokenization_hint: 'Rozdělení textu na menší jednotky',
    stage_token_ids: 'Id tokenů',
    stage_token_ids_hint: 'Převod tokenů na číselné identifikátory',
    stage_input_embeddings: 'Vstupní embeddingy',
    stage_input_embeddings_hint: 'Mapování tokenů na husté vektory',
    stage_attention_layer: 'Vrstva Attention',
    stage_attention_layer_hint: 'Identifikace vztahů mezi tokeny',
    stage_feedforward_layer: 'Vrstva Feed-forward',
    stage_feedforward_layer_hint: 'Zpracování informací v každé pozici',
    stage_output_embeddings: 'Výstupní embeddingy',
    stage_output_embeddings_hint: 'Transformace skrytých stavů na embeddingy',
    stage_last_embedding: 'Poslední embedding',
    stage_last_embedding_hint: 'Extrakce finální reprezentace tokenu',
    stage_output_probabilities: 'Pravděpodobnosti výstupu',
    stage_output_probabilities_hint: 'Výpočet pravděpodobnosti pro každý token',
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
