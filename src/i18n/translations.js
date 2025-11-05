/**
 * Translations for the application
 * Supports English (en) and Czech (cs)
 */

const translations = {
  en: {
    play: 'Play',
    pause: 'Pause',
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
    stage_token_ids_hint: 'Retrieving a numerical identifier for each token',
    stage_input_embeddings: 'Input embeddings',
    stage_input_embeddings_hint: 'Retrieving a vector representation for each token',
    stage_attention_layer: 'Attention layer',
    stage_attention_layer_hint: 'Sharing information between tokens',
    stage_feedforward_layer: 'Feed-forward layer',
    stage_feedforward_layer_hint: 'Updating representation of each token',
    stage_last_embedding: 'Last hidden state',
    stage_last_embedding_hint: 'Extracting the processed representation of the last token',
    stage_output_probabilities: 'Output probabilities',
    stage_output_probabilities_hint: 'Determining likelihood of the next token',
    stage_next_token: 'Next token',
    stage_next_token_hint: 'Selecting the next output token',
  },
  cs: {
    play: 'Přehrát',
    pause: 'Pozastavit',
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
    stage_tokenization_hint: 'Textu je rozdělen na menší části',
    stage_token_ids: 'Id tokenů',
    stage_token_ids_hint: 'Každý token je převeden na číselný identifikátor',
    stage_input_embeddings: 'Vstupní embeddingy',
    stage_input_embeddings_hint: 'Každý identifikátor má svou vektorovou reprezentaci',
    stage_attention_layer: 'Attention vrstva',
    stage_attention_layer_hint: 'Tokeny sdílí informace mezi sebou',
    stage_feedforward_layer: 'Feed-forward vrstva',
    stage_feedforward_layer_hint: 'Model aktualizuje informaci o každém tokenu',
    stage_last_embedding: 'Reprezentace posledního tokenu',
    stage_last_embedding_hint: 'Obsahuje informaci o následujícím tokenu',
    stage_output_probabilities: 'Pravděpodobnosti výstupu',
    stage_output_probabilities_hint: 'Model určí pravděpodobnosti dalšího tokenu',
    stage_next_token: 'Další token',
    stage_next_token_hint: 'Výběr dalšího výstupního tokenu',
  },
};

export default translations;
