# Animated LLM - Interactive Transformer Visualization

An educational React demo showing how Large Language Models generate text token by token. This is a client-only application that uses pre-computed generation data to visualize the transformer architecture in action.

## Features

- 🎨 Interactive D3.js visualizations
- 🌗 Dark/Light theme support
- 🌍 Bilingual interface (English/Czech)
- 📊 Step-by-step token generation
- 🎬 Smooth animations showing:
  - Tokenization
  - Token IDs
  - Embeddings (4-dimensional visualization)
  - Transformer block processing
  - Output probability distribution

## Getting Started

### Prerequisites

- Node.js 20.9.0 or higher
- npm

### Installation

1. Install dependencies:

```bash
npm install
```

2. Generate mock data (if not already generated):

```bash
python scripts/generate_mock_data.py
```

### Development

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173/`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## Usage

1. **Select an Example**: Choose from 10 pre-computed examples in the dropdown
2. **Start Generation**: Click the play button to begin the visualization
3. **Step Through**: Press `Space` to advance through sub-steps of the animation
4. **Toggle Theme**: Press `Ctrl+T` to switch between dark and light themes
5. **Change Language**: Press `Ctrl+L` to toggle between English and Czech

### Keyboard Shortcuts

- `Space` - Advance to next animation sub-step
- `R` - Reset to initial state
- `Ctrl+T` - Toggle theme (Dark/Light)
- `Ctrl+L` - Toggle language (English/Czech)

## Project Structure

```
animated-llm/
├── public/
│   └── data/           # Pre-computed generation examples
│       ├── examples.json
│       └── example_001.json - example_010.json
├── src/
│   ├── components/     # React UI components
│   │   ├── InputSection.jsx
│   │   ├── GeneratedAnswer.jsx
│   │   └── VisualizationCanvas.jsx
│   ├── contexts/       # React context providers
│   │   └── AppContext.jsx
│   ├── services/       # Data access layer
│   │   └── examplesApi.js
│   ├── i18n/           # Internationalization
│   │   ├── I18nProvider.jsx
│   │   └── translations.js
│   ├── visualization/  # Visualization modules
│   │   ├── core/       # Pure functions and utilities
│   │   │   ├── colors.js      # Color scales
│   │   │   ├── constants.js   # Layout and style constants
│   │   │   ├── draw.js        # D3 drawing primitives
│   │   │   ├── layout.js      # Position calculations
│   │   │   └── selectors.js   # DOM selectors
│   │   ├── layers/     # Layer rendering functions
│   │   │   └── renderLayers.js
│   │   └── animation/  # GSAP animation logic
│   │       ├── timeline.js
│   │       └── useGsapTimeline.js
│   ├── hooks/          # Custom React hooks
│   │   └── useThemeEffect.js
│   ├── styles/         # CSS files
│   │   ├── themes.css         # Theme variables
│   │   ├── main.css           # Main styles
│   │   ├── visualization.css  # Visualization styles
│   │   ├── app.css            # App-level styles
│   │   └── generated-answer.css
│   ├── utils/          # Legacy utilities (being phased out)
│   │   └── colorSchemes.js
│   ├── config.js       # App configuration
│   ├── App.jsx         # Root component
│   ├── main.jsx        # Entry point
│   └── index.css       # Global styles
├── scripts/
│   └── generate_mock_data.py  # Data generator
└── package.json
```

## Data Format

Each example JSON file contains:

- `prompt`: The input prompt
- `language`: Language code (en/cs)
- `num_tokens`: Total number of tokens to generate
- `generation_steps`: Array of steps, each containing:
  - `tokens`: Token strings at this step
  - `token_ids`: Corresponding token IDs
  - `embeddings`: 4-value embeddings (simplified visualization)
  - `transformer_activations`: Activation values
  - `output_distribution`: Top-10 most likely next tokens with probabilities

## Technologies

- **React 18.3.1** - UI framework
- **Vite 5.4.2** - Build tool and dev server
- **D3.js 7.9.0** - Data visualization
- **GSAP 3.12.5** - Animation library
- **CSS Variables** - Theme system with dark/light mode support

## Architecture

The project follows a modular architecture with clear separation of concerns:

### State Management

- **AppContext**: Central state management using React Context + useReducer
- Clean action-based state updates
- Separate effects for theme application and language handling

### Visualization Layer

The visualization is split into modular, reusable components:

- **Core modules**: Pure functions for layout calculations, drawing primitives, and color scales
- **Layer renderers**: Separate functions for tokens, embeddings, transformer blocks, and output distribution
- **Animation system**: GSAP-based timeline management with custom hooks

### Styling System

- **CSS custom properties** for theming (centralized in `themes.css`)
- Theme-aware constants that read from CSS variables
- Responsive breakpoints for desktop, tablet, and mobile
- Smooth theme transitions

### Benefits of the Refactored Architecture

1. **Maintainability**: Clear module boundaries and single responsibility
2. **Testability**: Pure functions enable easy unit testing (when needed)
3. **Extensibility**: Easy to add new visualization layers or features
4. **Performance**: Memoization-ready structure for optimization
5. **Theme support**: Consistent colors across themes with CSS variables

## Educational Goals

This demo is designed for:

- Kids learning about AI
- Non-technical audiences curious about LLMs
- Students studying natural language processing
- Anyone wanting to understand how transformers work

The visualization simplifies complex concepts while maintaining accuracy:

- Real embeddings would be 768+ dimensions, we show 4 for clarity
- Real transformers have 12-96 layers, we show one block for understanding
- Actual vocabulary is 30k-50k tokens, we show top-10 for readability

## Development Notes

### Build System

Built with React + Vite template. See the [Vite documentation](https://vite.dev/) for more information about the build tool.

### Code Quality

- ESLint configured for code quality enforcement
- Run `npm run lint` to check for issues
- All phases of the refactoring plan (Phases 0-5) have been completed

### Refactoring History

The project has undergone a comprehensive refactoring to improve maintainability and extensibility:

- **Phase 0**: Development workflow (linting, formatting)
- **Phase 1**: Service layer extraction and folder structure
- **Phase 2**: i18n cleanup with dedicated provider
- **Phase 3**: State management with useReducer
- **Phase 4**: Visualization modularization (core/layers/animation split)
- **Phase 5**: CSS variables, constants extraction, responsive design

See `REFACTOR_PLAN.md` and `PHASE4_SUMMARY.md`/`PHASE5_SUMMARY.md` for details.

## License

MIT

## Author

Created as an educational tool for visualizing LLM token generation.
