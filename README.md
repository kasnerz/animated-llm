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
2. **Start Generation**: Click "Start Generation" to begin the visualization
3. **Step Through**: Click "Next Token" to see each generation step
4. **Reset**: Click "Reset" to return to the initial state
5. **Adjust Speed**: Use the slider to control animation speed (0.5x - 2.0x)

### Keyboard Shortcuts

- `Space` - Play/Pause animation
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
│   ├── components/     # React components
│   │   ├── InputSection.jsx
│   │   └── VisualizationCanvas.jsx
│   ├── contexts/       # React context providers
│   │   └── AppContext.jsx
│   ├── hooks/          # Custom React hooks (future)
│   ├── styles/         # CSS files
│   │   ├── themes.css
│   │   ├── main.css
│   │   ├── visualization.css
│   │   └── app.css
│   ├── utils/          # Utility functions
│   │   ├── i18n.js
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
- **GSAP 3.12.5** - Animation library (for future use)
- **CSS Variables** - Theming system

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

Built with React + Vite template. See the [Vite documentation](https://vite.dev/) for more information about the build tool.

## License

MIT

## Author

Created as an educational tool for visualizing LLM token generation.
