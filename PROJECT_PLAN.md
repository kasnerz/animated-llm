# Animated LLM - Client-Only React Demo
## Project Plan

**Date:** October 24, 2025  
**Goal:** Create a client-only educational demo app showing step-by-step LLM text generation using pre-computed data

---

## 1. Overview

### 1.1 Transition from Flask to React
- **From:** Flask backend calling vLLM API in real-time
- **To:** Pure React frontend with pre-computed JSON data
- **Why:** Real-time LLM calls are infeasible; offline data allows reliable, fast demonstrations

### 1.2 Core Concept
- Users see animations of how LLMs generate text token-by-token
- Each step shows: tokenization → embeddings → transformer processing → output distribution → token selection
- Target audience: Kids, outsiders, lay users
- Educational focus: Demystifying the generation process

---

## 2. Architecture

### 2.1 Technology Stack
```
Frontend:
- React 18+
- D3.js (visualization)
- GSAP (animations)
- CSS Modules / Styled Components
- React Context (state management)

Build Tools:
- Vite (fast development)
- TypeScript (optional, recommended)

No Backend:
- Static hosting (GitHub Pages, Netlify, Vercel)
- All data in JSON files
```

### 2.2 Project Structure
```
animated-llm/
├── public/
│   ├── data/
│   │   ├── examples.json           # Index of all examples
│   │   ├── example_001.json        # Individual example data
│   │   ├── example_002.json
│   │   └── ...
│   └── index.html
├── src/
│   ├── components/
│   │   ├── App.jsx
│   │   ├── InputSection.jsx        # Prompt display + controls
│   │   ├── VisualizationCanvas.jsx # Main SVG canvas
│   │   ├── TokenDisplay.jsx        # Token boxes
│   │   ├── EmbeddingDisplay.jsx    # Embedding vectors
│   │   ├── TransformerBlock.jsx    # Simplified transformer
│   │   ├── OutputDistribution.jsx  # Probability bars
│   │   └── Controls/
│   │       ├── ThemeToggle.jsx
│   │       ├── LanguageToggle.jsx
│   │       ├── SpeedControl.jsx
│   │       └── PlaybackControls.jsx
│   ├── hooks/
│   │   ├── useAnimation.js         # GSAP animation logic
│   │   ├── useVisualization.js     # D3 visualization logic
│   │   └── useExampleData.js       # Data loading/management
│   ├── contexts/
│   │   ├── AppContext.jsx          # Global app state
│   │   └── AnimationContext.jsx    # Animation state
│   ├── utils/
│   │   ├── colorSchemes.js         # Token/embedding colors
│   │   └── i18n.js                 # Translation utilities
│   ├── styles/
│   │   ├── themes.css              # Light/dark themes
│   │   ├── main.css                # Base styles
│   │   └── visualization.css       # Visualization-specific
│   ├── config.js                   # App configuration
│   ├── main.jsx                    # React entry point
│   └── index.css                   # Global styles
├── package.json
├── vite.config.js
└── README.md
```

---

## 3. Data Format

### 3.1 Example Index (`public/data/examples.json`)
```json
{
  "examples": [
    {
      "id": "example_001",
      "prompt": "Which ingredients do I need to make scrambled eggs?",
      "language": "en",
      "description": "Cooking instructions - scrambled eggs",
      "num_tokens": 8,
      "file": "example_001.json"
    },
    {
      "id": "example_002",
      "prompt": "How do I reset my password?",
      "language": "en",
      "description": "Tech support question",
      "num_tokens": 6,
      "file": "example_002.json"
    }
  ]
}
```

### 3.2 Individual Example Format (`public/data/example_001.json`)
```json
{
  "id": "example_001",
  "prompt": "Which ingredients do I need to make scrambled eggs?",
  "language": "en",
  "model_info": {
    "name": "meta-llama/Llama-3-8B",
    "num_layers": 32,
    "hidden_size": 4096,
    "num_attention_heads": 32,
    "vocab_size": 128256
  },
  "generation_steps": [
    {
      "step": 0,
      "input_text": "Which ingredients do I need to make scrambled eggs?",
      "tokens": ["Which", " ingredients", " do", " I", " need", " to", " make", " scrambled", " eggs", "?"],
      "token_ids": [23847, 14293, 656, 358, 1205, 311, 1304, 71578, 19335, 30],
      "embeddings": [
        {
          "token": "Which",
          "values": [0.12, -0.34, 0.56, -0.78]
        },
        {
          "token": " ingredients",
          "values": [-0.23, 0.45, -0.67, 0.89]
        },
        {
          "token": " do",
          "values": [0.45, -0.67, 0.12, -0.34]
        },
        {
          "token": " I",
          "values": [-0.56, 0.78, -0.23, 0.45]
        },
        {
          "token": " need",
          "values": [0.89, -0.12, 0.34, -0.56]
        },
        {
          "token": " to",
          "values": [0.23, -0.45, 0.67, -0.89]
        },
        {
          "token": " make",
          "values": [-0.34, 0.56, -0.78, 0.91]
        },
        {
          "token": " scrambled",
          "values": [0.67, -0.89, 0.12, -0.34]
        },
        {
          "token": " eggs",
          "values": [-0.12, 0.34, -0.56, 0.78]
        },
        {
          "token": "?",
          "values": [0.45, -0.23, 0.78, -0.91]
        }
      ],
      "transformer_processing": {
        "num_layers_shown": 1,
        "sample_activations": [
          {
            "layer": 0,
            "token_position": 0,
            "values": [0.34, -0.12, 0.78, -0.56]
          }
        ]
      },
      "output_distribution": {
        "top_k": 10,
        "candidates": [
          {
            "token": " To",
            "token_id": 1271,
            "logprob": -0.0001,
            "prob": 0.6234
          },
          {
            "token": " You",
            "token_id": 2675,
            "logprob": -0.856,
            "prob": 0.2123
          },
          {
            "token": " For",
            "token_id": 1789,
            "logprob": -1.456,
            "prob": 0.0823
          },
          {
            "token": " The",
            "token_id": 791,
            "logprob": -2.123,
            "prob": 0.0434
          },
          {
            "token": " Sc",
            "token_id": 3407,
            "logprob": -2.678,
            "prob": 0.0212
          },
          {
            "token": " Here",
            "token_id": 5810,
            "logprob": -3.123,
            "prob": 0.0098
          },
          {
            "token": " All",
            "token_id": 2460,
            "logprob": -3.567,
            "prob": 0.0045
          },
          {
            "token": " Eggs",
            "token_id": 36326,
            "logprob": -4.012,
            "prob": 0.0021
          },
          {
            "token": "\n",
            "token_id": 198,
            "logprob": -4.456,
            "prob": 0.0008
          },
          {
            "token": " Basic",
            "token_id": 14967,
            "logprob": -4.891,
            "prob": 0.0002
          }
        ]
      },
      "selected_token": {
        "token": " To",
        "token_id": 1271,
        "selection_method": "greedy"
      }
    },
    {
      "step": 1,
      "input_text": "Which ingredients do I need to make scrambled eggs? To",
      "tokens": ["Which", " ingredients", " do", " I", " need", " to", " make", " scrambled", " eggs", "?", " To"],
      "token_ids": [23847, 14293, 656, 358, 1205, 311, 1304, 71578, 19335, 30, 1271],
      "embeddings": [
        {
          "token": "Which",
          "values": [0.12, -0.34, 0.56, -0.78]
        },
        {
          "token": " ingredients",
          "values": [-0.23, 0.45, -0.67, 0.89]
        },
        {
          "token": " do",
          "values": [0.45, -0.67, 0.12, -0.34]
        },
        {
          "token": " I",
          "values": [-0.56, 0.78, -0.23, 0.45]
        },
        {
          "token": " need",
          "values": [0.89, -0.12, 0.34, -0.56]
        },
        {
          "token": " to",
          "values": [0.23, -0.45, 0.67, -0.89]
        },
        {
          "token": " make",
          "values": [-0.34, 0.56, -0.78, 0.91]
        },
        {
          "token": " scrambled",
          "values": [0.67, -0.89, 0.12, -0.34]
        },
        {
          "token": " eggs",
          "values": [-0.12, 0.34, -0.56, 0.78]
        },
        {
          "token": "?",
          "values": [0.45, -0.23, 0.78, -0.91]
        },
        {
          "token": " To",
          "values": [0.34, -0.67, 0.89, -0.23]
        }
      ],
      "transformer_processing": {
        "num_layers_shown": 1,
        "sample_activations": [
          {
            "layer": 0,
            "token_position": 10,
            "values": [0.23, -0.45, 0.67, -0.89]
          }
        ]
      },
      "output_distribution": {
        "top_k": 10,
        "candidates": [
          {
            "token": " make",
            "token_id": 1304,
            "logprob": -0.0002,
            "prob": 0.7123
          },
          {
            "token": " prepare",
            "token_id": 10772,
            "logprob": -0.745,
            "prob": 0.1876
          },
          {
            "token": " cook",
            "token_id": 4394,
            "logprob": -2.123,
            "prob": 0.0534
          },
          {
            "token": " create",
            "token_id": 1893,
            "logprob": -2.678,
            "prob": 0.0234
          },
          {
            "token": " get",
            "token_id": 636,
            "logprob": -3.234,
            "prob": 0.0112
          },
          {
            "token": " whip",
            "token_id": 34799,
            "logprob": -3.789,
            "prob": 0.0067
          },
          {
            "token": " start",
            "token_id": 1212,
            "logprob": -4.123,
            "prob": 0.0034
          },
          {
            "token": " begin",
            "token_id": 3240,
            "logprob": -4.567,
            "prob": 0.0015
          },
          {
            "token": " have",
            "token_id": 617,
            "logprob": -4.891,
            "prob": 0.0004
          },
          {
            "token": " scramble",
            "token_id": 77387,
            "logprob": -5.234,
            "prob": 0.0001
          }
        ]
      },
      "selected_token": {
        "token": " make",
        "token_id": 1304,
        "selection_method": "greedy"
      }
    },
    {
      "step": 2,
      "input_text": "Which ingredients do I need to make scrambled eggs? To make",
      "tokens": ["Which", " ingredients", " do", " I", " need", " to", " make", " scrambled", " eggs", "?", " To", " make"],
      "token_ids": [23847, 14293, 656, 358, 1205, 311, 1304, 71578, 19335, 30, 1271, 1304],
      "embeddings": [
        {
          "token": "Which",
          "values": [0.12, -0.34, 0.56, -0.78]
        },
        {
          "token": " ingredients",
          "values": [-0.23, 0.45, -0.67, 0.89]
        },
        {
          "token": " do",
          "values": [0.45, -0.67, 0.12, -0.34]
        },
        {
          "token": " I",
          "values": [-0.56, 0.78, -0.23, 0.45]
        },
        {
          "token": " need",
          "values": [0.89, -0.12, 0.34, -0.56]
        },
        {
          "token": " to",
          "values": [0.23, -0.45, 0.67, -0.89]
        },
        {
          "token": " make",
          "values": [-0.34, 0.56, -0.78, 0.91]
        },
        {
          "token": " scrambled",
          "values": [0.67, -0.89, 0.12, -0.34]
        },
        {
          "token": " eggs",
          "values": [-0.12, 0.34, -0.56, 0.78]
        },
        {
          "token": "?",
          "values": [0.45, -0.23, 0.78, -0.91]
        },
        {
          "token": " To",
          "values": [0.34, -0.67, 0.89, -0.23]
        },
        {
          "token": " make",
          "values": [-0.45, 0.78, -0.12, 0.56]
        }
      ],
      "transformer_processing": {
        "num_layers_shown": 1,
        "sample_activations": [
          {
            "layer": 0,
            "token_position": 11,
            "values": [0.56, -0.23, 0.89, -0.45]
          }
        ]
      },
      "output_distribution": {
        "top_k": 10,
        "candidates": [
          {
            "token": " scrambled",
            "token_id": 71578,
            "logprob": -0.0001,
            "prob": 0.8234
          },
          {
            "token": " perfect",
            "token_id": 4832,
            "logprob": -1.234,
            "prob": 0.0923
          },
          {
            "token": " delicious",
            "token_id": 18406,
            "logprob": -2.123,
            "prob": 0.0456
          },
          {
            "token": " fluffy",
            "token_id": 68125,
            "logprob": -2.567,
            "prob": 0.0234
          },
          {
            "token": " good",
            "token_id": 1695,
            "logprob": -3.012,
            "prob": 0.0098
          },
          {
            "token": " basic",
            "token_id": 6913,
            "logprob": -3.456,
            "prob": 0.0045
          },
          {
            "token": " simple",
            "token_id": 4382,
            "logprob": -3.891,
            "prob": 0.0008
          },
          {
            "token": " easy",
            "token_id": 4228,
            "logprob": -4.234,
            "prob": 0.0001
          },
          {
            "token": " great",
            "token_id": 2294,
            "logprob": -4.678,
            "prob": 0.0001
          },
          {
            "token": " classic",
            "token_id": 11670,
            "logprob": -5.012,
            "prob": 0.0000
          }
        ]
      },
      "selected_token": {
        "token": " scrambled",
        "token_id": 71578,
        "selection_method": "greedy"
      }
    }
  ]
}
```

**Key Design Decisions:**
- **Embedding values**: Store first 2 and last 2 dimensions (4 total per token) for visualization
- **No display indices**: Values shown directly without dimension labels (A B ... C D format)
- **Top-K tokens**: 10 candidates for output distribution visualization
- **ChatGPT-style prompts**: Instruction-based questions users would typically ask
- **Short answers**: Mock responses kept brief for demonstration purposes

---

## 4. Component Breakdown

### 4.1 App Component (Root)
**Responsibilities:**
- Load example index
- Manage global state (theme, language, current example)
- Provide context to children
- Handle example selection (future feature)

**State:**
```javascript
{
  currentExample: null,
  currentStep: 0,
  theme: 'dark',
  language: 'en',
  animationSpeed: 15,
  isPlaying: false,
  isPaused: false
}
```

### 4.2 InputSection Component
**Port from:** `templates/index.html` (input-section)

**Features:**
- Display current prompt (readonly)
- "Generate Next Token" button
- Reset button
- Speed control slider
- Theme/language toggles

**Props:**
```javascript
{
  prompt: string,
  onGenerate: () => void,
  onReset: () => void,
  isGenerating: boolean
}
```

### 4.3 VisualizationCanvas Component
**Port from:** Current SVG visualization

**Responsibilities:**
- Render D3 visualization in React
- Manage SVG layout
- Coordinate child visualization components

**Child Components:**
- TokenDisplay
- EmbeddingDisplay
- TransformerBlock
- OutputDistribution

### 4.4 TokenDisplay Component
**Port from:** `visualization.js` drawTokens()

**Features:**
- Render token boxes with text
- Show token IDs below
- Animate appearance
- Highlight newly added tokens

**Data:**
```javascript
{
  tokens: Array<{token: string, tokenId: number, isNew: boolean}>
}
```

### 4.5 EmbeddingDisplay Component
**Port from:** `visualization.js` drawEmbeddings()

**Features:**
- Show embedding vectors as colored bars
- Display only first 2 and last 2 dimensions (4 total) per token
- Animate transitions
- Color based on value (-1 to 1 range)
- Show "..." between first and last dimensions

**Visual:**
```
Token: "Which"
[████████░░░░░░] [████░░░░░░░░] ... [████░░░░░░░░] [░░░░░░░░████]
  0.12        -0.34         0.56       -0.78
   A            B     ...     C           D
```

### 4.6 TransformerBlock Component
**Port from:** `visualization.js` drawTransformer()

**Features:**
- Show simplified transformer as single block
- Display sample activation colors
- Animate "processing" effect
- Future: Stack multiple blocks on top of each other.

**Visual:**
```
┌─────────────────────┐
│   TRANSFORMER       │
│   [colored dots]    │
│   Layer 1           │
└─────────────────────┘
```

### 4.7 OutputDistribution Component
**Port from:** `visualization.js` drawOutputDistribution()

**Features:**
- Show top-10 tokens as horizontal bars
- Bar length = probability
- Highlight selected token
- Animate bar growth

**Visual:**
```
 To        ████████████████████ 62.3%  ← Selected
 You       ████████             21.2%
 For       ███                   8.2%
 The       ██                    4.3%
 Sc        █                     2.1%
 Here      █                     1.0%
 ...
```

---

## 5. Animation Strategy

### 5.1 Animation Phases (Same as Flask version)
```javascript
const ANIMATION_PHASES = {
  TOKENIZATION: 0.15,    // 15% of total time
  TOKEN_IDS: 0.10,       // 10%
  EMBEDDINGS: 0.15,      // 15%
  TRANSFORMER: 0.40,     // 40%
  OUTPUT: 0.20           // 20%
};
```

### 5.2 useAnimation Hook
```javascript
// src/hooks/useAnimation.js
export function useAnimation(stepData, duration = 15) {
  const timelineRef = useRef(null);
  
  const playStep = () => {
    const tl = gsap.timeline();
    
    // Phase 1: Tokenization
    tl.to('.token-box', {
      opacity: 1,
      y: 0,
      duration: duration * 0.15,
      ease: 'power2.out'
    });
    
    // Phase 2: Token IDs
    tl.to('.token-id', {
      opacity: 1,
      duration: duration * 0.10
    });
    
    // ... etc
    
    timelineRef.current = tl;
  };
  
  return { playStep, pause, resume, reset };
}
```

### 5.3 Animation Control
- **Single step only** (for MVP)
- User clicks "Generate" → plays one complete step
- Can pause/resume during animation
- Reset returns to initial prompt

---

## 6. State Management

### 6.1 App Context
```javascript
// src/contexts/AppContext.jsx
const AppContext = createContext();

export function AppProvider({ children }) {
  const [state, setState] = useState({
    examples: [],
    currentExampleId: null,
    currentStep: 0,
    theme: 'dark',
    language: 'en',
    animationSpeed: 15
  });
  
  const actions = {
    loadExample: (id) => { /* ... */ },
    nextStep: () => { /* ... */ },
    reset: () => { /* ... */ },
    setTheme: (theme) => { /* ... */ },
    setLanguage: (lang) => { /* ... */ }
  };
  
  return (
    <AppContext.Provider value={{ state, actions }}>
      {children}
    </AppContext.Provider>
  );
}
```

### 6.2 Data Flow
```
User clicks "Generate"
  ↓
AppContext.nextStep()
  ↓
Load step data from example JSON
  ↓
Update currentStep state
  ↓
VisualizationCanvas receives new step data
  ↓
useAnimation hook triggers GSAP timeline
  ↓
Components animate in sequence
```

---

## 7. Styling & Theming

### 7.1 Port Existing CSS
- Keep `themes.css` (dark/light mode)
- Keep `visualization.css` (SVG styles)
- Convert to CSS Modules or keep global

### 7.2 Color Scheme
```javascript
// src/utils/colorSchemes.js
export const TOKEN_COLORS = {
  default: ['#FFB6C1', '#87CEEB', '#98FB98', '#FFD700', '#DDA0DD'],
  // ... same as current config
};

export const EMBEDDING_COLORS = {
  negative: (intensity) => `rgb(${224 + (255-224)*(1-intensity)}, ...)`,
  positive: (intensity) => `rgb(${224 - (224-80)*intensity}, ...)`
};
```

### 7.3 Responsive Design
- Keep centered vertical layout
- Ensure works on tablets (future: mobile)
- SVG viewport scaling

---

## 8. Internationalization (i18n)

### 8.1 Translation Strategy
```javascript
// src/utils/i18n.js
const translations = {
  en: {
    title: "Interactive Transformer Visualization",
    generate_next_token: "Generate Next Token",
    reset: "Reset",
    pause: "Pause",
    resume: "Resume"
  },
  cs: {
    title: "Interaktivní Vizualizace Transformeru",
    generate_next_token: "Generovat další token",
    reset: "Resetovat",
    pause: "Pozastavit",
    resume: "Pokračovat"
  }
};

export function useTranslation(language) {
  return (key) => translations[language][key] || key;
}
```

### 8.2 Language Toggle
- Same as current: 🇬🇧 / 🇨🇿 button
- Updates all UI text
- Does not affect example data (examples have their own language)

---

## 9. Implementation Phases

### Phase 1: Project Setup (Week 1)
**Tasks:**
1. ✅ Create new React project with Vite
2. ✅ Install dependencies (React, D3, GSAP)
3. ✅ Set up project structure
4. ✅ Port CSS files (themes, main, visualization)
5. ✅ Create mock data generator script
6. ✅ Generate 2-3 mock examples

**Deliverables:**
- Working React dev server
- Mock data in `public/data/`
- Basic App component rendering

### Phase 2: Core Components (Week 2)
**Tasks:**
1. ✅ Implement AppContext
2. ✅ Build InputSection component
3. ✅ Build VisualizationCanvas (empty SVG)
4. ✅ Implement data loading logic
5. ✅ Port theme/language toggles

**Deliverables:**
- Can load and display an example
- Theme switching works
- Language switching works

### Phase 3: Visualization Components (Week 3)
**Tasks:**
1. ✅ Port TokenDisplay with D3
2. ✅ Port EmbeddingDisplay with D3
3. ✅ Port TransformerBlock visualization
4. ✅ Port OutputDistribution with D3
5. ✅ Connect components to step data

**Deliverables:**
- All visualization elements render
- Static display (no animation yet)
- Matches Flask version layout

### Phase 4: Animation Integration (Week 4)
**Tasks:**
1. ✅ Implement useAnimation hook
2. ✅ Port GSAP timeline logic
3. ✅ Add animation to each phase
4. ✅ Implement pause/resume
5. ✅ Add playback controls

**Deliverables:**
- Full animation sequence works
- Speed control functional
- Pause/resume functional

### Phase 5: Polish & Testing (Week 5)
**Tasks:**
1. ✅ Generate remaining mock examples (total 10)
2. ✅ Responsive design testing
3. ✅ Cross-browser testing
4. ✅ Performance optimization
5. ✅ Documentation (README, comments)

**Deliverables:**
- Production-ready demo
- All 10 examples working
- Deployed to static hosting

### Phase 6: Real Data Integration (Future)
**Tasks:**
1. 🔄 Create data extraction script
2. 🔄 Extract real model data
3. 🔄 Replace mock examples
4. 🔄 Validate accuracy

**Note:** This happens when you provide real LLM data

---

## 10. Mock Data Generator

### 10.1 Script Purpose
Generate realistic-looking mock data for development before real model data is available.

### 10.2 Script Location
```
animated-llm/
└── scripts/
    └── generate_mock_data.py
```

### 10.3 Script Features
```python
import json
import random
import math

def generate_mock_example(
    prompt: str,
    language: str,
    num_steps: int = 3,
    example_id: str = "example_001"
):
    """
    Generate a mock example with realistic-looking data.
    
    Args:
        prompt: Initial text prompt (ChatGPT-style instruction)
        language: 'en' or 'cs'
        num_steps: Number of generation steps
        example_id: Unique identifier
    """
    
    # Mock tokenization
    tokens = tokenize_mock(prompt)
    
    steps = []
    current_text = prompt
    
    for step in range(num_steps):
        step_data = {
            "step": step,
            "input_text": current_text,
            "tokens": get_tokens(current_text),
            "token_ids": get_mock_token_ids(get_tokens(current_text)),
            "embeddings": generate_mock_embeddings(get_tokens(current_text)),
            "transformer_processing": generate_mock_activations(),
            "output_distribution": generate_mock_distribution(language, step),
            "selected_token": {}  # Set from distribution
        }
        
        # Select token (highest prob)
        selected = step_data["output_distribution"]["candidates"][0]
        step_data["selected_token"] = {
            "token": selected["token"],
            "token_id": selected["token_id"],
            "selection_method": "greedy"
        }
        
        # Update text for next step
        current_text += selected["token"]
        
        steps.append(step_data)
    
    return {
        "id": example_id,
        "prompt": prompt,
        "language": language,
        "model_info": {
            "name": "mock-model",
            "num_layers": 32,
            "hidden_size": 4096,
            "num_attention_heads": 32,
            "vocab_size": 128256
        },
        "generation_steps": steps
    }

def generate_mock_embeddings(tokens):
    """Generate mock embedding values using sine waves"""
    embeddings = []
    for i, token in enumerate(tokens):
        # First 2 + last 2 dimensions (4 total)
        values = [
            math.sin(i * 0.1 + j * 0.5) 
            for j in range(4)
        ]
        embeddings.append({
            "token": token,
            "values": values
        })
    return embeddings

def generate_mock_activations():
    """Generate mock transformer activation values"""
    # 4 sample values for coloring
    return {
        "num_layers_shown": 1,
        "sample_activations": [
            {
                "layer": 0,
                "token_position": random.randint(0, 10),
                "values": [random.uniform(-1, 1) for _ in range(4)]
            }
        ]
    }

def generate_mock_distribution(language, step):
    """Generate mock probability distribution with top-10 tokens"""
    # Context-aware token suggestions based on step
    token_sets = {
        "en": [
            [" To", " You", " For", " The", " Sc", " Here", " All", " Eggs", "\n", " Basic"],
            [" make", " prepare", " cook", " create", " get", " whip", " start", " begin", " have", " scramble"],
            [" scrambled", " perfect", " delicious", " fluffy", " good", " basic", " simple", " easy", " great", " classic"]
        ]
    }
    
    tokens = token_sets.get(language, token_sets["en"])[min(step, len(token_sets["en"])-1)]
    
    candidates = []
    remaining_prob = 1.0
    
    for i, token in enumerate(tokens[:10]):
        if i == 0:
            prob = 0.6 + random.random() * 0.2
        else:
            prob = remaining_prob * (0.3 + random.random() * 0.4)
        
        remaining_prob -= prob
        logprob = math.log(prob)
        
        candidates.append({
            "token": token,
            "token_id": random.randint(1, 128000),
            "logprob": logprob,
            "prob": prob
        })
    
    # Sort by probability
    candidates.sort(key=lambda x: x["prob"], reverse=True)
    
    return {
        "top_k": 10,
        "candidates": candidates
    }

# Usage - ChatGPT-style instruction prompts
examples = [
    ("Which ingredients do I need to make scrambled eggs?", "en", 3, "example_001"),
    ("How do I reset my password?", "en", 3, "example_002"),
    ("What is the capital of France?", "en", 2, "example_003"),
    ("Explain photosynthesis in simple terms.", "en", 4, "example_004"),
    ("Write a haiku about coding.", "en", 5, "example_005"),
    ("What are the benefits of exercise?", "en", 3, "example_006"),
    ("How do I bake chocolate chip cookies?", "en", 4, "example_007"),
    ("What is machine learning?", "en", 3, "example_008"),
    ("Give me a fun fact about dolphins.", "en", 3, "example_009"),
    ("How do I start learning Python?", "en", 4, "example_010"),
]

for prompt, lang, steps, id in examples:
    data = generate_mock_example(prompt, lang, steps, id)
    with open(f"public/data/{id}.json", "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

# Generate examples index
examples_index = {
    "examples": [
        {
            "id": f"example_{i+1:03d}",
            "prompt": prompt,
            "language": lang,
            "description": f"ChatGPT-style prompt: {prompt[:50]}...",
            "num_tokens": steps,
            "file": f"example_{i+1:03d}.json"
        }
        for i, (prompt, lang, steps, _) in enumerate(examples)
    ]
}

with open("public/data/examples.json", "w", encoding="utf-8") as f:
    json.dump(examples_index, f, indent=2, ensure_ascii=False)
```
]

for prompt, lang, steps, id in examples:
    data = generate_mock_example(prompt, lang, steps, id)
    with open(f"public/data/{id}.json", "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
```

---

## 11. Future Enhancements

### 11.1 Multiple Transformer Layers (Phase 7)
- Stack transformer blocks vertically
- Animate "deck of cards" effect
- Show information flowing through layers
- Zoom/collapse layers

### 11.2 Example Selection (Phase 8)
- UI to browse all 10 examples
- Thumbnail previews
- Filter by language
- Direct URL to specific example

### 11.3 Step-by-Step Manual Control (Phase 9)
- "Next Token" button generates one at a time
- Timeline slider to jump to any step
- Replay from any point

### 11.4 Educational Annotations (Phase 10)
- Tooltips explaining each phase
- "Info" mode with text descriptions
- Guided tour mode
- Quiz/test knowledge

### 11.5 Advanced Features (Future)
- Compare different models
- Compare sampling strategies (greedy vs. temperature)
- Export animation as video
- Slow-motion zoom into specific phases

---

## 12. Development Guidelines

### 12.1 Code Style
- Use functional components + hooks
- PropTypes or TypeScript for type safety
- Meaningful variable names (no abbreviations)
- Comment complex D3/GSAP code
- Keep components under 200 lines

### 12.2 Performance
- Use React.memo for expensive components
- useCallback for event handlers
- useMemo for computed values
- Debounce animation speed slider
- Lazy load example data

### 12.3 Accessibility
- Semantic HTML
- ARIA labels for controls
- Keyboard navigation
- High contrast mode support
- Skip animation option for motion sensitivity

### 12.4 Testing
- Unit tests for utility functions
- Integration tests for data loading
- Visual regression tests for layout
- Manual testing on target devices

---

## 13. Deployment

### 13.1 Build Process
```bash
npm run build
# Outputs to dist/
```

### 13.2 Hosting Options
1. **GitHub Pages** (Free, easy)
   - Push to gh-pages branch
   - Configure base URL in vite.config.js
   
2. **Netlify** (Free, automatic deploys)
   - Connect GitHub repo
   - Auto-deploy on push
   
3. **Vercel** (Free, optimized for React)
   - One-click deployment
   - Preview deployments for PRs

### 13.3 Configuration
```javascript
// vite.config.js
export default defineConfig({
  base: '/animated-llm/', // For GitHub Pages subdirectory
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
});
```

---

## 14. Success Criteria

### 14.1 MVP Checklist
- [ ] React app runs locally
- [ ] 10 mock examples load correctly
- [ ] All visualization components render
- [ ] Animation plays smoothly (60fps)
- [ ] Theme switching works
- [ ] Language switching works
- [ ] Speed control works
- [ ] Pause/resume works
- [ ] Layout matches Flask version
- [ ] Responsive on tablets
- [ ] Deploys to static hosting

### 14.2 Quality Metrics
- **Performance:** Animation at 60fps on mid-range devices
- **Size:** Total bundle < 500KB (gzipped)
- **Load time:** First render < 1 second
- **Accessibility:** WCAG 2.1 AA compliance
- **Browser support:** Chrome, Firefox, Safari, Edge (latest 2 versions)

---

## 15. Migration Checklist

### 15.1 Files to Port
- [x] `static/css/themes.css` → `src/styles/themes.css`
- [x] `static/css/main.css` → `src/styles/main.css`
- [x] `static/css/visualization.css` → `src/styles/visualization.css`
- [ ] `static/js/animation.js` → `src/hooks/useAnimation.js`
- [ ] `static/js/visualization.js` → `src/hooks/useVisualization.js`
- [ ] `templates/index.html` → `src/components/*.jsx`
- [ ] `config.yaml` → `src/config.js`
- [ ] Translations → `src/utils/i18n.js`

### 15.2 Files Not Needed
- ❌ `app.py` (no backend)
- ❌ `static/js/api.js` (no API calls)
- ❌ `requirements.txt` (no Python)
- ❌ `babel.cfg` (use different i18n)

---

## 16. Getting Started Commands

```bash
# Create React app with Vite
npm create vite@latest animated-llm -- --template react
cd animated-llm

# Install dependencies
npm install
npm install d3 gsap
npm install --save-dev @types/d3  # If using TypeScript

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 17. Next Steps

1. **Review this plan** - Make sure everything aligns with your vision
2. **Set up React project** - Initialize with Vite
3. **Generate mock data** - Create 2-3 examples to start
4. **Port one component** - Start with InputSection (simplest)
5. **Test iteration cycle** - Make changes, see results
6. **Continue phase by phase** - Follow the implementation timeline

---

## Questions for Iteration

As you implement, consider:
- Is the data format adequate for your needs?
- Are there additional visualization elements you want?
- Should we add more interactivity in Phase 1?
- How do you want to handle edge cases (very long tokens, etc.)?

Let me know when you're ready to begin implementation, and I can help with specific code!
