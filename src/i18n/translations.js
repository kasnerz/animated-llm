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
    // Home page
    home_subtitle: 'Interactive LLM Visualizations',
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
    // InfoBox
    infobox: {
      // Text generation - before animation
      ready_to_generate_heading: 'LLM is ready to generate text.',
      ready_to_generate_desc: 'Press the Play button to start generating text.',
      // Text generation - predicting (steps 1-8)
      predicting_next_token_heading: 'LLM predicts the next token',
      predicting_user_input_desc: 'User input is passed through the model',
      predicting_generated_desc: 'Text generated so far is passed through the model',
      // Text generation - selection (steps 9-12)
      selecting_token_desc: 'Selected token is appended to the generated text',
      // Training - before animation
      ready_to_train_heading: 'LLM is ready to be trained',
      ready_to_train_desc: 'Press the Play button to train the model on the current document',
      // Training - forward pass (steps 0-9)
      forward_pass_heading: 'Forward training pass',
      forward_pass_desc: 'LLM is predicting which token comes next',
      // Training - backward pass (steps 10-15)
      backward_pass_heading: 'Backward training pass',
      backward_pass_desc: 'Model weights are updated',
    },
  },
  cs: {
    play: 'Přehrát',
    pause: 'Pozastavit',
    start_generation: 'Začít generování',
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
    // Home page
    home_subtitle: 'Interaktivní vizualizace velkých jazykových modelů',
    // Category labels
    category_training: 'Trénování',
    category_text_generation: 'Generování textu',
    // Category descriptions
    category_training_desc: 'Pochopení procesu trénování jazykových modelů',
    category_text_generation_desc: 'Vizualizace postupného generování textu token po tokenu',
    // View labels
    view_text_generation: 'Model',
    view_training: 'Model',
    view_decoding: 'Algoritmy',
    // View descriptions
    view_text_generation_desc: 'Vizualizace postupného generování textu token po tokenu',
    view_training_desc: 'Pochopení procesu trénování jazykových modelů',
    view_decoding_desc: 'Prozkoumání různých dekódovacích strategií a algoritmů',
    decoding_view_placeholder: 'Vizualizace dekódovacích algoritmů bude zobrazena zde.',
    model_input: 'Vstup modelu',
    model_output: 'Výstup modelu',
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
    // InfoBox
    infobox: {
      // Text generation - before animation
      ready_to_generate_heading: 'Jazykový model je připraven generovat text.',
      ready_to_generate_desc: 'Stiskněte tlačítko Přehrát pro začátek generování.',
      // Text generation - predicting (steps 1-8)
      predicting_next_token_heading: 'Model predikuje další token',
      predicting_user_input_desc: 'Vstup od uživatele je předán modelem',
      predicting_generated_desc: 'Dosud vygenerovaný text je předán modelem',
      // Text generation - selection (steps 9-12)
      selecting_token_desc: 'Vybraný token je přidán k vygenerovanému textu',
      // Training - before animation
      ready_to_train_heading: 'Model je připraven k trénování',
      ready_to_train_desc: 'Stiskněte tlačítko Přehrát pro trénování modelu na aktuálním dokumentu',
      // Training - forward pass (steps 0-9)
      forward_pass_heading: 'Dopředný průchod',
      forward_pass_desc: 'Model predikuje, který token následuje',
      // Training - backward pass (steps 10-15)
      backward_pass_heading: 'Zpětný průchod',
      backward_pass_desc: 'Váhy modelu jsou aktualizovány',
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
  de: {
    // German translations - fallback to English for missing keys
    play: 'Abspielen',
    pause: 'Pause',
    loading: 'Laden...',
    error: 'Fehler',
    retry: 'Wiederholen',
    model_answer: 'Modellantwort',
    keyboard_shortcuts: 'Tastenkombinationen',
    language: 'Sprache',
    toggle_dark_light_mode: 'Dunkelmodus',
  },
  es: {
    // Spanish translations - fallback to English for missing keys
    play: 'Reproducir',
    pause: 'Pausa',
    loading: 'Cargando...',
    error: 'Error',
    retry: 'Reintentar',
    model_answer: 'Respuesta del modelo',
    keyboard_shortcuts: 'Atajos de teclado',
    language: 'Idioma',
    toggle_dark_light_mode: 'Modo oscuro',
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
  ar: {
    // Arabic translations - fallback to English for missing keys
    play: 'تشغيل',
    pause: 'إيقاف مؤقت',
    loading: 'جاري التحميل...',
    error: 'خطأ',
    retry: 'إعادة المحاولة',
    model_answer: 'إجابة النموذج',
    keyboard_shortcuts: 'اختصارات لوحة المفاتيح',
    language: 'اللغة',
    toggle_dark_light_mode: 'الوضع الداكن',
  },
  hi: {
    // Hindi translations - fallback to English for missing keys
    play: 'चलाएं',
    pause: 'रोकें',
    loading: 'लोड हो रहा है...',
    error: 'त्रुटि',
    retry: 'पुनः प्रयास करें',
    model_answer: 'मॉडल उत्तर',
    keyboard_shortcuts: 'कीबोर्ड शॉर्टकट',
    language: 'भाषा',
    toggle_dark_light_mode: 'डार्क मोड',
  },
  ja: {
    // Japanese translations - fallback to English for missing keys
    play: '再生',
    pause: '一時停止',
    loading: '読み込み中...',
    error: 'エラー',
    retry: '再試行',
    model_answer: 'モデルの回答',
    keyboard_shortcuts: 'キーボードショートカット',
    language: '言語',
    toggle_dark_light_mode: 'ダークモード',
  },
};

export default translations;
