# Internationalization (i18n) System

## Overview

The application supports multiple languages with automatic fallback to English when translations or examples are missing.

## Adding a New Language

To add a new language (e.g., German 'de'), follow these steps:

### 1. Add Translations

Edit `translations.js` and add a new language object:

```javascript
const translations = {
  en: {
    /* ... */
  },
  cs: {
    /* ... */
  },
  de: {
    play: 'Abspielen',
    pause: 'Pause',
    // ... add all translation keys
  },
};
```

**Important:** If you don't provide all translation keys, missing keys will automatically fallback to English.

### 2. Add Language Metadata

Edit `components/LanguageSelector.jsx` and add language info:

```javascript
const LANGUAGE_INFO = {
  en: { name: 'English', flag: '🇬🇧' },
  cs: { name: 'Čeština', flag: '🇨🇿' },
  de: { name: 'Deutsch', flag: '🇩🇪' },
};
```

**Note:** If you skip this step, the language will still work but will display with:

- name: Language code in uppercase (e.g., 'DE')
- flag: Generic globe emoji 🌐

### 3. Add Example Files

Create example data files in `public/data/` with the language prefix:

- `de-001-greedy.json`
- `de-001-sampling.json`
- etc.

Update `public/data/examples.json` to include the new examples:

```json
{
  "examples": [
    {
      "id": "de-001-greedy",
      "prompt": "Hallo Welt!",
      "language": "de",
      "description": "Hallo Welt!",
      "file": "de-001-greedy.json"
    }
  ]
}
```

**Important:** If you don't provide examples for a language, the application will automatically show English examples when that language is selected.

## Fallback System

### Translation Fallback

1. Try the requested language
2. If key not found → fallback to English
3. If still not found → display the key itself

Example:

```javascript
// User selects German, but key 'new_feature' only exists in English
t('new_feature'); // Returns English translation
```

### Example Files Fallback

1. Try to load examples for the requested language
2. If no examples found → fallback to English examples
3. If English examples not found → error

Example:

```javascript
// User selects German, but no German examples exist
listExamples('de'); // Returns English examples with console warning
```

### UI Display Fallback

For languages without metadata in `LANGUAGE_INFO`:

- Display name: Language code in uppercase
- Flag emoji: 🌐 (globe)

## Current Languages

- **English (en)**: Full support (translations + examples)
- **Czech (cs)**: Full support (translations + examples)

## Best Practices

1. **Always provide English translations** - It's the fallback language
2. **Keep translation keys consistent** - Use the same keys across all languages
3. **Test with incomplete translations** - Verify fallback works correctly
4. **Provide examples when possible** - Better user experience than fallback
5. **Document language-specific features** - Some UI elements may be language-dependent

## File Structure

```
src/
├── i18n/
│   ├── I18nProvider.jsx     # Context provider with translation logic
│   ├── translations.js       # All translation strings
│   └── README.md            # This file
├── components/
│   └── LanguageSelector.jsx # Language picker dropdown
└── services/
    └── examplesApi.js       # Example loading with language fallback

public/
└── data/
    ├── examples.json        # Example metadata
    ├── en-*.json           # English examples
    └── cs-*.json           # Czech examples
```

## Testing Fallback

To test the fallback system:

1. **Missing translation key:**

   ```javascript
   // Add to English only, test in Czech
   en: {
     test_key: 'Test value';
   }
   // Czech will show English value
   ```

2. **Missing examples:**

   ```javascript
   // Remove Czech examples from examples.json
   // App will show English examples when Czech is selected
   ```

3. **Missing language metadata:**
   ```javascript
   // Add 'de' to translations.js but not LANGUAGE_INFO
   // Selector will show 'DE' with 🌐 emoji
   ```
