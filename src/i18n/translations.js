/**
 * Translations for the application
 * Supports English (en) and Czech (cs)
 */

export const translations = {
  en: {
    app_title: 'Interactive Transformer Visualization',
    title: 'Interactive Transformer Visualization',
    subtitle: 'Watch how language models generate text, token by token',
    generate_next_token: 'Generate Next Token',
    start_generation: 'Start Generation',
    next_token: 'Next Token',
    reset: 'Reset',
    pause: 'Pause',
    resume: 'Resume',
    speed: 'Animation Speed',
    animation_speed: 'Animation Speed',
    theme_dark: 'Dark Mode',
    theme_light: 'Light Mode',
    toggle_theme: 'Toggle Theme',
    toggle_language: 'Toggle Language',
    language_english: 'English',
    language_czech: 'Czech',
    tokens: 'Tokens',
    token_ids: 'Token IDs',
    embeddings: 'Embeddings',
    transformer: 'Transformer',
    output_distribution: 'Output Distribution',
    selected_token: 'Selected Token',
    probability: 'Probability',
    loading: 'Loading...',
    error: 'Error',
    retry: 'Retry',
    select_example: 'Select Example',
    prompt: 'Prompt',
    step: 'Step',
    visualization: 'Visualization',
    click_generate_to_start: "Click 'Start Generation' to begin",
    footer_text: 'Educational demo showing how LLMs generate text token by token',
    shortcuts: 'Shortcuts',
    play_pause: 'Play/Pause',
    theme: 'Theme',
    language: 'Language',
  },
  cs: {
    app_title: 'Interaktivní Vizualizace Transformeru',
    title: 'Interaktivní Vizualizace Transformeru',
    subtitle: 'Sledujte, jak jazykové modely generují text, token po tokenu',
    generate_next_token: 'Generovat další token',
    start_generation: 'Začít generování',
    next_token: 'Další token',
    reset: 'Resetovat',
    pause: 'Pozastavit',
    resume: 'Pokračovat',
    speed: 'Rychlost animace',
    animation_speed: 'Rychlost animace',
    theme_dark: 'Tmavý režim',
    theme_light: 'Světlý režim',
    toggle_theme: 'Přepnout téma',
    toggle_language: 'Přepnout jazyk',
    language_english: 'Angličtina',
    language_czech: 'Čeština',
    tokens: 'Tokeny',
    token_ids: 'ID tokenů',
    embeddings: 'Embeddingy',
    transformer: 'Transformer',
    output_distribution: 'Distribuce výstupu',
    selected_token: 'Vybraný token',
    probability: 'Pravděpodobnost',
    loading: 'Načítání...',
    error: 'Chyba',
    retry: 'Zkusit znovu',
    select_example: 'Vybrat příklad',
    prompt: 'Prompt',
    step: 'Krok',
    visualization: 'Vizualizace',
    click_generate_to_start: "Klikněte na 'Začít generování' pro spuštění",
    footer_text: 'Vzdělávací demo ukazující, jak LLM generují text token po tokenu',
    shortcuts: 'Zkratky',
    play_pause: 'Přehrát/Pozastavit',
    theme: 'Téma',
    language: 'Jazyk',
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
