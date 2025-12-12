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
    tooltip_speed: 'Animation speed',
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
    home_pretraining_model_desc:
      'Want to dive deeper? Here you will find out how Transformer processes individual tokens during training and learns from mistakes.',
    home_pretraining_simple_title: 'Training basics',
    home_pretraining_simple_desc:
      'How is a language model trained? Check out a simple visualization of the training process on sample documents.',
    home_generation_model_title: 'How does Transformer generate text?',
    home_generation_model_desc:
      'Want to dive deeper? Here you will find out how Transformer processes individual tokens during text generation.',
    home_generation_simple_title: 'Text generation basics',
    home_generation_simple_desc:
      'How does a language model generate text? Check out a simple visualization of the generation process on sample prompts.',
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
    animation_speed: 'Animation Speed',
    slow: 'Slow',
    medium: 'Medium',
    fast: 'Fast',
    model: 'Model',
    settings: 'Settings',
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
      <p>Use the <b><a href="https://github.com/kasnerz/animated-llm/discussions">project Github</a></b> for questions and comments.</p>
    `,
    about_credits:
      'Created by <a href="https://kasnerz.github.io" target="_blank">Zdeněk Kasner</a> with substantial help from LLMs.',
    // Initial hint
    hint_press_play: 'Press the Play button to start animation',
    hint_keyboard_shortcuts: 'Keyboard shortcuts',
    // Stage labels
    stage_tokenization: 'Tokenization',
    stage_tokenization_hint: 'The text is split into smaller parts: tokens.',
    stage_positional_embeddings: 'Positional embeddings',
    stage_positional_embeddings_hint:
      'Information about the token position is added to the representation.',
    stage_input_embeddings: 'Input embeddings',
    stage_input_embeddings_hint: 'Each token has its own vector representation.',
    stage_attention_layer: 'Attention layer',
    stage_attention_layer_hint: 'Tokens share information with each other.',
    stage_feedforward_layer: 'Feed-forward layer',
    stage_feedforward_layer_hint: 'The model updates information about each token.',
    stage_last_embedding: 'Last hidden state',
    stage_last_embedding_hint: 'Contains information about the next token.',
    stage_output_probabilities: 'Output probabilities',
    stage_output_probabilities_hint: 'The model determines the probabilities of the next token.',
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
    tooltip_speed: 'Rychlost animace',
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
    home_pretraining_model_desc:
      'Chceš jít více do hloubky? Zde zjistíš, jak Transformer při trénování zpracovává jednotlivé tokeny a učí se z chyb.',
    home_pretraining_simple_title: 'Základy trénování',
    home_pretraining_simple_desc:
      'Jak se trénuje jazykový model? Prohlédni si jednoduchou vizualizaci trénovacího procesu na ukázkových dokumentech.',
    home_generation_model_title: 'Jak Transformer generuje text?',
    home_generation_model_desc:
      'Chceš jít více do hloubky? Zde zjistíš, jak Transformer při generování textu zpracovává jednotlivé tokeny.',
    home_generation_simple_title: 'Základy generování textu',
    home_generation_simple_desc:
      'Jak jazykový model generuje text text? Prohlédni si jednoduchou vizualizaci generovacího procesu na ukázkových promptech.',
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
    animation_speed: 'Rychlost animace',
    slow: 'pomalu',
    medium: 'normálně',
    fast: 'rychle',
    model: 'Model',
    settings: 'Nastavení',
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
      <p>Dotazy a připomínky směřujte na <b><a href="https://github.com/kasnerz/animated-llm/discussions">Github projektu</a></b>.</p>
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
    play: 'Lecture',
    pause: 'Pause',
    start_generation: 'Lancer la génération',
    next_token: 'Token suivant',
    toggle_theme: 'Changer de thème',
    toggle_language: 'Changer de langue',
    loading: 'Chargement...',
    error: 'Erreur',
    retry: 'Réessayer',
    model_answer: 'Réponse du modèle',
    keyboard_shortcuts: 'Raccourcis clavier',
    language: 'Langue',
    toggle_dark_light_mode: 'Mode sombre',
    view_label: 'Vue',
    show_special_tokens: 'Tokens spéciaux',
    // Tooltips
    tooltip_select_model: 'Type de modèle',
    tooltip_temperature: 'Température',
    tooltip_speed: "Vitesse de l'animation",
    tooltip_show_special_tokens: 'Afficher les tokens spéciaux',
    tooltip_start_animation: 'Démarrer',
    tooltip_probability: 'Probabilité',
    tooltip_difference: 'Différence entre les prédictions du modèle et la distribution cible',
    tooltip_training_document: "Document d'entrée",
    tooltip_token: 'Token',
    tooltip_token_id: 'ID du token',
    tooltip_embedding: 'Représentation du token',
    tooltip_attention: "Opérations de la couche d'attention",
    tooltip_feedforward: 'Opérations de la couche feed-forward',
    tooltip_last_vector: 'Représentation du dernier token',
    tooltip_probabilities: 'Probabilités de sortie (somme = 1)',
    tooltip_transformer_box: 'Bloc Transformer',
    tooltip_positional_embedding: 'Embedding positionnel',
    tooltip_projection: 'Projection de la représentation du token vers les probabilités',
    tooltip_transformer_shadow: 'Bloc Transformer précédent',
    // Home page
    home_tagline: 'Comprendre le fonctionnement des LLM',
    // Home page sections
    home_training_title: 'Entraînement',
    home_generation_title: 'Génération de texte',
    // Home page items
    home_pretraining_model_title: 'Comment le Transformer est-il entraîné ?',
    home_pretraining_model_desc:
      "Vous voulez aller plus loin ? Découvrez ici comment le Transformer traite chaque token pendant l'entraînement et apprend de ses erreurs.",
    home_pretraining_simple_title: "Bases de l'entraînement",
    home_pretraining_simple_desc:
      "Comment un modèle de langage est-il entraîné ? Découvrez une visualisation simple du processus d'entraînement sur des exemples de documents.",
    home_generation_model_title: 'Comment le Transformer génère-t-il du texte ?',
    home_generation_model_desc:
      'Vous voulez aller plus loin ? Découvrez ici comment le Transformer traite chaque token pendant la génération de texte.',
    home_generation_simple_title: 'Bases de la génération de texte',
    home_generation_simple_desc:
      'Comment un modèle de langage génère-t-il du texte ? Découvrez une visualisation simple du processus de génération sur des exemples de prompts.',
    // Category labels
    category_training: 'Entraînement',
    category_text_generation: 'Génération de texte',
    // Category descriptions
    category_training_desc: "Comprendre le processus d'entraînement des modèles de langage",
    category_text_generation_desc: 'Visualiser comment les LLM génèrent du texte token par token',
    // View labels
    view_text_generation: 'Modèle',
    view_training: 'Modèle',
    view_decoding: 'Algoritmy',
    // View descriptions
    view_text_generation_desc: 'Visualiser comment les LLM génèrent du texte token par token',
    view_training_desc: "Comprendre le processus d'entraînement des modèles de langage",
    view_decoding_desc: 'Explorer différentes stratégies et algorithmes de décodage',
    decoding_view_placeholder: 'La visualisation des algorithmes de décodage sera affichée ici.',
    model_input: 'Entrée du modèle',
    model_output: 'Sortie du modèle',
    target_distribution: 'Distribution cible',
    difference: 'Différence',
    target_token: 'Token cible',
    animation_speed: "Vitesse de l'animation",
    slow: 'Lent',
    medium: 'Moyen',
    fast: 'Rapide',
    model: 'Modèle',
    settings: 'Réglages',
    // Keyboard shortcuts
    shortcut_play_pause: "Lecture / Pause de l'animation",
    shortcut_step_forward: 'Avancer',
    shortcut_step_backward: 'Reculer',
    shortcut_next_token: 'Passer au token suivant',
    shortcut_skip_to_end: 'Aller à la fin de la génération',
    shortcut_reset: "Réinitialiser l'animation",
    shortcut_toggle_theme: 'Changer de thème',
    shortcut_toggle_language: 'Changer de langue',
    shortcut_show_shortcuts: 'Afficher les raccourcis clavier',
    // About modal
    about: 'À propos',
    about_title: 'À propos',
    about_tagline: 'Visualisation interactive des modèles de langage',
    // Single HTML/Markdown content for the About modal (editable)
    about_content: `
      <p>Cette application éducative contient une collection d'animations qui montrent comment fonctionnent les grands modèles de langage (LLM).</p><br>
      <p>Aucune donnée n'est envoyée à des serveurs externes — tout s'exécute dans votre navigateur !</p><br>
      <p>Veuillez adresser vos questions et commentaires sur le <b><a href="https://github.com/kasnerz/animated-llm/discussions">Github du projet</a></b>.</p>
    `,
    about_credits:
      'Créé par <a href="https://kasnerz.github.io" target="_blank">Zdeněk Kasner</a> avec l\'aide substantielle des LLM.',
    // Initial hint
    hint_press_play: "Appuyez sur le bouton Lecture pour démarrer l'animation",
    hint_keyboard_shortcuts: 'Raccourcis clavier',
    // Stage labels
    stage_tokenization: 'Tokenisation',
    stage_tokenization_hint: 'Le texte est divisé en parties plus petites : les tokens.',
    stage_positional_embeddings: 'Embeddings positionnels',
    stage_positional_embeddings_hint:
      'Des informations sur la position du token sont ajoutées à la représentation.',
    stage_input_embeddings: "Embeddings d'entrée",
    stage_input_embeddings_hint: 'Chaque token a sa propre représentation vectorielle.',
    stage_attention_layer: "Couche d'attention",
    stage_attention_layer_hint: 'Les tokens partagent des informations entre eux.',
    stage_feedforward_layer: 'Couche feed-forward',
    stage_feedforward_layer_hint: 'Le modèle met à jour les informations sur chaque token.',
    stage_last_embedding: 'Dernier état caché',
    stage_last_embedding_hint: 'Contient des informations sur le token suivant.',
    stage_output_probabilities: 'Probabilités de sortie',
    stage_output_probabilities_hint: 'Le modèle détermine les probabilités du token suivant.',
    stage_next_token: 'Token suivant',
    stage_next_token_hint: 'Sélection du prochain token de sortie',
    // Training-specific stage label override
    stage_compute_error: "Calcul de l'erreur des prédictions",
    stage_compute_error_hint: 'Comparer les prédictions avec la cible et calculer les erreurs',
    // Backpropagation phase (training)
    stage_backpropagation: 'Rétropropagation',
    stage_backpropagation_hint: 'Mise à jour des poids du modèle pour corriger sa prédiction.',
    // Training view
    training: {
      selectDocument: 'Sélectionner un document',
      document: 'Document',
    },
  },
  uk: {
    play: 'Відтворити',
    pause: 'Пауза',
    start_generation: 'Почати генерацію',
    next_token: 'Наступний токен',
    toggle_theme: 'Змінити тему',
    toggle_language: 'Змінити мову',
    loading: 'Завантаження...',
    error: 'Помилка',
    retry: 'Спробувати ще раз',
    model_answer: 'Відповідь моделі',
    keyboard_shortcuts: 'Гарячі клавіші',
    language: 'Мова',
    toggle_dark_light_mode: 'Темний режим',
    view_label: 'Вигляд',
    show_special_tokens: 'Спеціальні токени',
    // Tooltips
    tooltip_select_model: 'Тип моделі',
    tooltip_temperature: 'Температура',
    tooltip_speed: 'Швидкість анімації',
    tooltip_show_special_tokens: 'Показати спеціальні токени',
    tooltip_start_animation: 'Почати',
    tooltip_probability: 'Ймовірність',
    tooltip_difference: 'Різниця між передбаченнями моделі та цільовим розподілом',
    tooltip_training_document: 'Вхідний документ',
    tooltip_token: 'Токен',
    tooltip_token_id: 'ID токена',
    tooltip_embedding: 'Представлення токена',
    tooltip_attention: 'Операції шару уваги (attention)',
    tooltip_feedforward: 'Операції шару feed-forward',
    tooltip_last_vector: 'Представлення останнього токена',
    tooltip_probabilities: 'Вихідні ймовірності (сума = 1)',
    tooltip_transformer_box: 'Блок Transformer',
    tooltip_positional_embedding: 'Позиційне вбудовування (embedding)',
    tooltip_projection: 'Проекція представлення токена на ймовірності',
    tooltip_transformer_shadow: 'Попередній блок Transformer',
    // Home page
    home_tagline: 'Зрозумійте механіку LLM',
    // Home page sections
    home_training_title: 'Навчання',
    home_generation_title: 'Генерація тексту',
    // Home page items
    home_pretraining_model_title: 'Як навчається Transformer?',
    home_pretraining_model_desc:
      'Хочете заглибитися? Тут ви дізнаєтеся, як Transformer обробляє окремі токени під час навчання та вчиться на помилках.',
    home_pretraining_simple_title: 'Основи навчання',
    home_pretraining_simple_desc:
      'Як навчається мовна модель? Перегляньте просту візуалізацію процесу навчання на прикладах документів.',
    home_generation_model_title: 'Як Transformer генерує текст?',
    home_generation_model_desc:
      'Хочете заглибитися? Тут ви дізнаєтеся, як Transformer обробляє окремі токени під час генерації тексту.',
    home_generation_simple_title: 'Основи генерації тексту',
    home_generation_simple_desc:
      'Як мовна модель генерує текст? Перегляньте просту візуалізацію процесу генерації на прикладах запитів.',
    // Category labels
    category_training: 'Навчання',
    category_text_generation: 'Генерація тексту',
    // Category descriptions
    category_training_desc: 'Зрозумійте процес навчання мовних моделей',
    category_text_generation_desc: 'Візуалізуйте, як LLM генерують текст токен за токеном',
    // View labels
    view_text_generation: 'Модель',
    view_training: 'Модель',
    view_decoding: 'Алгоритми',
    // View descriptions
    view_text_generation_desc: 'Візуалізуйте, як LLM генерують текст токен за токеном',
    view_training_desc: 'Зрозумійте процес навчання мовних моделей',
    view_decoding_desc: 'Досліджуйте різні стратегії та алгоритми декодування',
    decoding_view_placeholder: 'Візуалізація алгоритмів декодування буде відображена тут.',
    model_input: 'Вхід моделі',
    model_output: 'Вихід моделі',
    target_distribution: 'Цільовий розподіл',
    difference: 'Різниця',
    target_token: 'Цільовий токен',
    animation_speed: 'Швидкість анімації',
    slow: 'Повільно',
    medium: 'Середньо',
    fast: 'Швидко',
    model: 'Модель',
    settings: 'Налаштування',
    // Keyboard shortcuts
    shortcut_play_pause: 'Відтворити / Пауза анімації',
    shortcut_step_forward: 'Крок вперед',
    shortcut_step_backward: 'Крок назад',
    shortcut_next_token: 'Перейти до наступного токена',
    shortcut_skip_to_end: 'Перейти до кінця генерації',
    shortcut_reset: 'Скинути анімацію',
    shortcut_toggle_theme: 'Змінити тему',
    shortcut_toggle_language: 'Змінити мову',
    shortcut_show_shortcuts: 'Показати гарячі клавіші',
    // About modal
    about: 'Про додаток',
    about_title: 'Про додаток',
    about_tagline: 'Інтерактивна візуалізація мовних моделей',
    // Single HTML/Markdown content for the About modal (editable)
    about_content: `
      <p>Цей освітній додаток містить колекцію анімацій, які показують, як працюють великі мовні моделі (LLM).</p><br>
      <p>Жодні дані не надсилаються на зовнішні сервери — все працює у вашому браузері!</p><br>
      <p>Запитання та коментарі надсилайте на <b><a href="https://github.com/kasnerz/animated-llm/discussions">Github проекту</a></b>.</p>
    `,
    about_credits:
      'Створено <a href="https://kasnerz.github.io" target="_blank">Zdeněk Kasner</a> за значної допомоги LLM.',
    // Initial hint
    hint_press_play: 'Натисніть кнопку Відтворити, щоб почати анімацію',
    hint_keyboard_shortcuts: 'Гарячі клавіші',
    // Stage labels
    stage_tokenization: 'Токенізація',
    stage_tokenization_hint: 'Текст розбивається на менші частини: токени.',
    stage_positional_embeddings: 'Позиційні вбудовування (embeddings)',
    stage_positional_embeddings_hint: 'Інформація про позицію токена додається до представлення.',
    stage_input_embeddings: 'Вхідні вбудовування (embeddings)',
    stage_input_embeddings_hint: 'Кожен токен має своє векторне представлення.',
    stage_attention_layer: 'Шар уваги (Attention layer)',
    stage_attention_layer_hint: 'Токени обмінюються інформацією між собою.',
    stage_feedforward_layer: 'Шар feed-forward',
    stage_feedforward_layer_hint: 'Модель оновлює інформацію про кожен токен.',
    stage_last_embedding: 'Останній прихований стан',
    stage_last_embedding_hint: 'Містить інформацію про наступний токен.',
    stage_output_probabilities: 'Вихідні ймовірності',
    stage_output_probabilities_hint: 'Модель визначає ймовірності наступного токена.',
    stage_next_token: 'Наступний токен',
    stage_next_token_hint: 'Вибір наступного вихідного токена',
    // Training-specific stage label override
    stage_compute_error: 'Обчислення помилки передбачень моделі',
    stage_compute_error_hint: 'Порівняння передбачень з ціллю та обчислення помилок',
    // Backpropagation phase (training)
    stage_backpropagation: 'Зворотне поширення помилки (Backpropagation)',
    stage_backpropagation_hint: 'Оновлення ваг моделі для виправлення її передбачення.',
    // Training view
    training: {
      selectDocument: 'Вибрати документ',
      document: 'Документ',
    },
  },
  zh: {
    play: '播放',
    pause: '暂停',
    start_generation: '开始生成',
    next_token: '下一个 Token',
    toggle_theme: '切换主题',
    toggle_language: '切换语言',
    loading: '加载中...',
    error: '错误',
    retry: '重试',
    model_answer: '模型回答',
    keyboard_shortcuts: '键盘快捷键',
    language: '语言',
    toggle_dark_light_mode: '深色模式',
    view_label: '视图',
    show_special_tokens: '特殊 Token',
    // Tooltips
    tooltip_select_model: '模型类型',
    tooltip_temperature: '温度',
    tooltip_speed: '动画速度',
    tooltip_show_special_tokens: '显示特殊 Token',
    tooltip_start_animation: '开始',
    tooltip_probability: '概率',
    tooltip_difference: '模型预测与目标分布的差异',
    tooltip_training_document: '输入文档',
    tooltip_token: 'Token',
    tooltip_token_id: 'Token ID',
    tooltip_embedding: 'Token 表示',
    tooltip_attention: '注意力层操作',
    tooltip_feedforward: '前馈层操作',
    tooltip_last_vector: '最后一个 Token 的表示',
    tooltip_probabilities: '输出概率 (总和为 1)',
    tooltip_transformer_box: 'Transformer 块',
    tooltip_positional_embedding: '位置嵌入 (Positional Embedding)',
    tooltip_projection: '将 Token 表示投影到概率',
    tooltip_transformer_shadow: '上一个 Transformer 块',
    // Home page
    home_tagline: '了解 LLM 的运作机制',
    // Home page sections
    home_training_title: '训练',
    home_generation_title: '文本生成',
    // Home page items
    home_pretraining_model_title: 'Transformer 是如何训练的？',
    home_pretraining_model_desc:
      '想深入了解吗？在这里，您将了解 Transformer 在训练过程中如何处理单个 Token 并从错误中学习。',
    home_pretraining_simple_title: '训练基础',
    home_pretraining_simple_desc: '语言模型是如何训练的？查看基于示例文档的训练过程的简单可视化。',
    home_generation_model_title: 'Transformer 如何生成文本？',
    home_generation_model_desc:
      '想深入了解吗？在这里，您将了解 Transformer 在文本生成过程中如何处理单个 Token。',
    home_generation_simple_title: '文本生成基础',
    home_generation_simple_desc: '语言模型如何生成文本？查看基于示例提示的生成过程的简单可视化。',
    // Category labels
    category_training: '训练',
    category_text_generation: '文本生成',
    // Category descriptions
    category_training_desc: '了解语言模型的训练过程',
    category_text_generation_desc: '可视化 LLM 如何逐个 Token 生成文本',
    // View labels
    view_text_generation: '模型',
    view_training: '模型',
    view_decoding: '算法',
    // View descriptions
    view_text_generation_desc: '可视化 LLM 如何逐个 Token 生成文本',
    view_training_desc: '了解语言模型的训练过程',
    view_decoding_desc: '探索不同的解码策略和算法',
    decoding_view_placeholder: '解码算法可视化将显示在这里。',
    model_input: '模型输入',
    model_output: '模型输出',
    target_distribution: '目标分布',
    difference: '差异',
    target_token: '目标 Token',
    animation_speed: '动画速度',
    slow: '慢',
    medium: '中',
    fast: '快',
    model: '模型',
    settings: '设置',
    // Keyboard shortcuts
    shortcut_play_pause: '播放 / 暂停动画',
    shortcut_step_forward: '前进',
    shortcut_step_backward: '后退',
    shortcut_next_token: '跳到下一个 Token',
    shortcut_skip_to_end: '跳到生成结束',
    shortcut_reset: '重置动画',
    shortcut_toggle_theme: '切换主题',
    shortcut_toggle_language: '切换语言',
    shortcut_show_shortcuts: '显示键盘快捷键',
    // About modal
    about: '关于',
    about_title: '关于',
    about_tagline: '语言模型的交互式可视化',
    // Single HTML/Markdown content for the About modal (editable)
    about_content: `
      <p>这个教育应用包含一系列动画，展示了大型语言模型 (LLM) 的工作原理。</p><br>
      <p>没有数据发送到外部服务器 — 一切都在您的浏览器中运行！</p><br>
      <p>如有疑问和建议，请前往 <b><a href="https://github.com/kasnerz/animated-llm/discussions">项目 Github</a></b>。</p>
    `,
    about_credits:
      '由 <a href="https://kasnerz.github.io" target="_blank">Zdeněk Kasner</a> 在 LLM 的大力帮助下创建。',
    // Initial hint
    hint_press_play: '按播放按钮开始动画',
    hint_keyboard_shortcuts: '键盘快捷键',
    // Stage labels
    stage_tokenization: 'Token 化 (Tokenization)',
    stage_tokenization_hint: '文本被分割成更小的部分：Token。',
    stage_positional_embeddings: '位置嵌入 (Positional Embeddings)',
    stage_positional_embeddings_hint: '关于 Token 位置的信息被添加到表示中。',
    stage_input_embeddings: '输入嵌入 (Input Embeddings)',
    stage_input_embeddings_hint: '每个 Token 都有自己的向量表示。',
    stage_attention_layer: '注意力层 (Attention Layer)',
    stage_attention_layer_hint: 'Token 之间共享信息。',
    stage_feedforward_layer: '前馈层 (Feed-forward Layer)',
    stage_feedforward_layer_hint: '模型更新关于每个 Token 的信息。',
    stage_last_embedding: '最后的隐藏状态',
    stage_last_embedding_hint: '包含关于下一个 Token 的信息。',
    stage_output_probabilities: '输出概率',
    stage_output_probabilities_hint: '模型确定下一个 Token 的概率。',
    stage_next_token: '下一个 Token',
    stage_next_token_hint: '选择下一个输出 Token',
    // Training-specific stage label override
    stage_compute_error: '计算模型预测误差',
    stage_compute_error_hint: '将预测与目标进行比较并计算误差',
    // Backpropagation phase (training)
    stage_backpropagation: '反向传播 (Backpropagation)',
    stage_backpropagation_hint: '更新模型权重以修正其预测。',
    // Training view
    training: {
      selectDocument: '选择文档',
      document: '文档',
    },
  },
};

export default translations;
