/**
 * Translations for the application
 * Supports multiple languages with automatic fallback to English for missing keys
 */

const translations = {
  en: {
    play: 'Play',
    pause: 'Pause',
    start_generation: 'Start Generation',
    next_token: 'Next Token',
    toggle_theme: 'Toggle Theme',
    toggle_language: 'Cycle Language',
    loading: 'Loading...',
    error: 'Error',
    retry: 'Retry',
    model_answer: 'Model answer',
    keyboard_shortcuts: 'Keyboard Shortcuts',
    language: 'Language',
    toggle_dark_light_mode: 'Dark mode',
    view_label: 'View',
    show_special_tokens: 'Special tokens',
    // Tooltips
    tooltip_select_model: 'Model type',
    tooltip_temperature: 'Temperature',
    tooltip_show_special_tokens: 'Show special tokens',
    tooltip_start_animation: 'Start',
    tooltip_probability: 'Probability',
    tooltip_difference: 'Difference between model predictions and target distribution',
    tooltip_training_document: 'Input document',
    tooltip_token: 'Token',
    tooltip_token_id: 'Token id',
    tooltip_embedding: 'Token representation',
    tooltip_attention: 'Attention layer operations',
    tooltip_feedforward: 'Feed-forward layer operations',
    tooltip_last_vector: 'Last token representation',
    tooltip_probabilities: 'Output probabilities (sum to 1)',
    tooltip_transformer_box: 'Transformer block',
    tooltip_positional_embedding: 'Positional embedding',
    tooltip_projection: 'Projecting token representation to probabilities',
    tooltip_transformer_shadow: 'Previous Transformer block',
    // Home page
    home_tagline: 'Understand the mechanics of LLMs',
    // Home page sections
    home_training_title: 'Training',
    home_generation_title: 'Text Generation',
    // Home page items
    home_pretraining_model_title: 'How is Transformer trained?',
    home_pretraining_model_desc: 'Training step by step',
    home_pretraining_simple_title: 'Training basics',
    home_pretraining_simple_desc: 'Simple visualization of model training',
    home_generation_model_title: 'How does Transformer generate text?',
    home_generation_model_desc: 'Text generation step by step',
    home_generation_simple_title: 'Text generation basics',
    home_generation_simple_desc: 'Simple visualization of text generation',
    // Category labels
    category_training: 'Training',
    category_text_generation: 'Text generation',
    // Category descriptions
    category_training_desc: 'Understand the training process of language models',
    category_text_generation_desc: 'Visualize how LLMs generate text token by token',
    // View labels
    view_text_generation: 'Model',
    view_training: 'Model',
    view_decoding: 'Algorithms',
    // View descriptions
    view_text_generation_desc: 'Visualize how LLMs generate text token by token',
    view_training_desc: 'Understand the training process of language models',
    view_decoding_desc: 'Explore different decoding strategies and algorithms',
    decoding_view_placeholder: 'Decoding algorithms visualization will be displayed here.',
    model_input: 'Model Input',
    model_output: 'Model Output',
    target_distribution: 'Target Distribution',
    difference: 'Difference',
    target_token: 'Target token',
    // Keyboard shortcuts
    shortcut_play_pause: 'Play / Pause animation',
    shortcut_step_forward: 'Step forward',
    shortcut_step_backward: 'Step backward',
    shortcut_next_token: 'Skip to next token',
    shortcut_skip_to_end: 'Skip to end of generation',
    shortcut_reset: 'Reset animation',
    shortcut_toggle_theme: 'Toggle theme',
    shortcut_toggle_language: 'Cycle language',
    shortcut_show_shortcuts: 'Show keyboard shortcuts',
    // About modal
    about: 'About',
    about_title: 'About',
    about_tagline: 'Interactive visualization of language models',
    // Single HTML/Markdown content for the About modal (editable)
    about_content: `
      <p>This educational app contains a collection of animations that show how large language models (LLMs) work.</p><br>
      <p>No data is sent to external servers — everything runs in your browser!</p><br>
      <p><strong>Contact:</strong> <a href="mailto:kasner@ufal.mff.cuni.cz">kasner@ufal.mff.cuni.cz</a></p>
    `,
    about_credits:
      'Created by <a href="https://kasnerz.github.io" target="_blank">Zdeněk Kasner</a> with substantial help from LLMs.',
    // Initial hint
    hint_press_play: 'Press the Play button to start animation',
    hint_keyboard_shortcuts: 'Keyboard shortcuts',
    // Stage labels
    stage_tokenization: 'Tokenization',
    stage_tokenization_hint: 'Segmenting the text into smaller units',
    stage_positional_embeddings: 'Positional embeddings',
    stage_positional_embeddings_hint: 'Adding position information to each token',
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
    // Training-specific stage label override
    stage_compute_error: 'Computing error of model predictions',
    stage_compute_error_hint: 'Compare predictions with the target and compute errors',
    // Backpropagation phase (training)
    stage_backpropagation: 'Backpropagation',
    stage_backpropagation_hint: 'Updating model weights to fix its prediction.',
    // Training view
    training: {
      selectDocument: 'Select document',
      document: 'Document',
    },
  },
  cs: {
    play: 'Přehrát',
    pause: 'Pozastavit',
    start_generation: 'Začít generovat',
    next_token: 'Další token',
    toggle_theme: 'Přepnout téma',
    toggle_language: 'Změnit jazyk',
    loading: 'Načítání...',
    error: 'Chyba',
    retry: 'Zkusit znovu',
    model_answer: 'Odpověď modelu',
    keyboard_shortcuts: 'Klávesové zkratky',
    language: 'Jazyk',
    toggle_dark_light_mode: 'Tmavý režim',
    view_label: 'Zobrazení',
    show_special_tokens: 'Speciální tokeny',
    // Tooltips
    tooltip_select_model: 'Typ modelu',
    tooltip_temperature: 'Teplota',
    tooltip_show_special_tokens: 'Zobrazovat speciální tokeny',
    tooltip_start_animation: 'Spustit',
    tooltip_probability: 'Pravděpodobnost',
    tooltip_difference: 'Rozdíl mezi predikcemi modelu a cílovou distribucí',
    tooltip_training_document: 'Vstupní dokument',
    tooltip_token: 'Token',
    tooltip_token_id: 'ID tokenu',
    tooltip_embedding: 'Reprezentace tokenu',
    tooltip_attention: 'Operace attention vrstvy',
    tooltip_feedforward: 'Operace feed-forward vrstvy',
    tooltip_last_vector: 'Reprezentace posledního tokenu',
    tooltip_probabilities: 'Pravděpodobnosti (součet = 1)',
    tooltip_transformer_box: 'Transformer blok',
    tooltip_positional_embedding: 'Poziční embedding',
    tooltip_projection: 'Projekce reprezentace tokenu na pravděpodobnosti',
    tooltip_transformer_shadow: 'Předchozí Transformer blok',
    // Home page
    home_tagline: 'Pochop, jak fungují velké jazykové modely',
    // Home page sections
    home_training_title: 'Trénování',
    home_generation_title: 'Generování textu',
    // Home page items
    home_pretraining_model_title: 'Jak se trénuje Transformer?',
    home_pretraining_model_desc: 'Trénování krok za krokem.',
    home_pretraining_simple_title: 'Základy trénování',
    home_pretraining_simple_desc: 'Zjednodušená vizualizace trénování.',
    home_generation_model_title: 'Jak Transformer generuje text?',
    home_generation_model_desc: 'Generování textu krok za krokem.',
    home_generation_simple_title: 'Základy generování textu',
    home_generation_simple_desc: 'Zjednodušená vizualizace generování textu.',
    // Category labels
    category_training: 'Trénování',
    category_text_generation: 'Generování textu',
    // Category descriptions
    view_text_generation: 'Model',
    view_training: 'Model',
    view_decoding: 'Algoritmy',
    model_input: 'Vstup modelu',
    model_output: 'Výstup modelu',
    target_distribution: 'Cílové rozdělení',
    difference: 'Chyba',
    target_token: 'Cílový token',
    // Keyboard shortcuts
    shortcut_play_pause: 'Přehrát / Pozastavit animaci',
    shortcut_step_forward: 'Krok vpřed',
    shortcut_step_backward: 'Krok zpět',
    shortcut_next_token: 'Přeskočit na další token',
    shortcut_skip_to_end: 'Přeskočit na konec generování',
    shortcut_reset: 'Resetovat animaci',
    shortcut_toggle_theme: 'Přepnout téma',
    shortcut_toggle_language: 'Přepnout jazyk',
    shortcut_show_shortcuts: 'Zobrazit klávesové zkratky',
    // About modal
    about: 'O aplikaci',
    about_title: 'O aplikaci',
    // Single HTML/Markdown content for the About modal (editable)
    about_content: `
      <p>Tato vzdělávací aplikace obsahuje kolekci animací, které ukazují, jak fungují velké jazykové modely (LLMs).</p><br>
      <p>Žádná data nejsou odesílána na externí servery — vše běží ve vašem prohlížeči!</p><br>
      <p><strong>Kontakt:</strong> <a href="mailto:kasner@ufal.mff.cuni.cz">kasner@ufal.mff.cuni.cz</a></p>
    `,
    about_credits:
      'Vytvořil <a href="https://kasnerz.github.io">Zdeněk Kasner</a> s vydatnou pomocí velkých jazykových modelů.',
    // Initial hint
    hint_press_play: 'Stiskněte tlačítko Přehrát pro začátek animace',
    hint_keyboard_shortcuts: 'Klávesové zkratky',
    // Stage labels
    stage_tokenization: 'Tokenizace',
    stage_tokenization_hint: 'Text je rozdělen na menší části: tokeny.',
    stage_positional_embeddings: 'Poziční embeddingy',
    stage_positional_embeddings_hint: 'K reprezentaci se přidá informace o pozici tokenu',
    stage_input_embeddings: 'Vstupní embeddingy',
    stage_input_embeddings_hint: 'Každý token má svou vektorovou reprezentaci',
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
    // Training-specific stage label override
    stage_compute_error: 'Výpočet chyby modelových predikcí',
    stage_compute_error_hint: 'Porovnání predikcí s cílem a výpočet chyb',
    // Backpropagation phase (training)
    stage_backpropagation: 'Backpropagace',
    stage_backpropagation_hint: 'Aktualizace vah modelu pro opravu předpovědi.',
    // Training view
    training: {
      selectDocument: 'Vybrat dokument',
      document: 'Dokument',
    },
  },
  fr: {
    // French translations - fallback to English for missing keys
    play: 'Lecture',
    pause: 'Pause',
    loading: 'Chargement...',
    error: 'Erreur',
    retry: 'Réessayer',
    model_answer: 'Réponse du modèle',
    keyboard_shortcuts: 'Raccourcis clavier',
    language: 'Langue',
    toggle_dark_light_mode: 'Mode sombre',
  },
  uk: {
    // Ukrainian translations - fallback to English for missing keys
    play: 'Відтворити',
    pause: 'Пауза',
    loading: 'Завантаження...',
    error: 'Помилка',
    retry: 'Повторити',
    model_answer: 'Відповідь моделі',
    keyboard_shortcuts: 'Гарячі клавіші',
    language: 'Мова',
    toggle_dark_light_mode: 'Темний режим',
  },
  zh: {
    // Chinese translations - fallback to English for missing keys
    play: '播放',
    pause: '暂停',
    loading: '加载中...',
    error: '错误',
    retry: '重试',
    model_answer: '模型回答',
    keyboard_shortcuts: '键盘快捷键',
    language: '语言',
    toggle_dark_light_mode: '深色模式',
  },
};

export default translations;
