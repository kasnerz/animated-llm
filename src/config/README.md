# Model Display Configuration

This directory contains the configuration for displaying model information in the dropdown selector.

## Overview

The system provides:

1. **Temperature Display**: Emoji-based temperature indicators with values
   - 🧊 for temperature < 1.0 (deterministic/cold)
   - 🌡️ for temperature = 1.0 (neutral)
   - 🌶️ for temperature > 1.0 (creative/hot)

2. **Model Display**: Logo + size for known models, identifier for unknown ones
   - Known models: Show logo image + size (e.g., "8b", "70b")
   - Unknown models: Show the raw model identifier

## Configuration File

The configuration is in `src/config/modelConfig.js`.

### Adding a New Model

1. **Add the model logo** to `src/assets/model-logos/` (e.g., `llama.png`)
   - Recommended size: 32x32px or 64x64px PNG with transparency
   - Square aspect ratio

2. **Add entry to MODEL_REGISTRY** in `modelConfig.js`:

```javascript
{
  pattern: /llama-3\.1-8b/i,  // RegExp or string to match model_id
  logo: 'llama.png',           // Filename in model-logos folder
  size: '8b',                  // Model size display
  name: 'Llama 3.1'           // Optional: display name for future use
}
```

### Pattern Matching

The `pattern` field can be:

- A **RegExp**: For flexible matching (e.g., `/gpt-4/i` matches "gpt-4", "GPT-4", "gpt-4-turbo")
- A **string**: For exact matching (converted to case-insensitive RegExp)

Use RegExp for models with multiple variants or flexible naming.

### Example Entry

```javascript
{
  pattern: /llama-3\.1-(\d+)b/i,
  logo: 'llama.png',
  size: '8b',
  name: 'Llama 3.1'
}
```

This would match:

- `llama-3.1-8b-instruct`
- `Llama-3.1-8B`
- `llama-3.1-8b-chat`

## Testing

After adding a model:

1. Ensure the logo file exists in `src/assets/model-logos/`
2. Check that the pattern matches your model_id from the data files
3. Test in the UI dropdown to verify correct display

## Functions

### `getModelInfo(modelId)`

Returns model display info (logo, size, name) for a given model ID, or null if unknown.

### `formatTemperature(temperature)`

Returns emoji + value string for temperature display (e.g., "🌶️ 1.5").

### `getTemperatureEmoji(temperature)`

Returns just the emoji for a temperature value.
