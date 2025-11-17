# Visualization Architecture

This document describes the structure and organization of visualization components to ensure clear separation between views and reusability.

## Overview

The visualization system is organized into three main categories:

1. **View-Specific Components** - Canvas and timeline implementations for each view
2. **Reusable Renderers** - View-agnostic D3 rendering functions
3. **Shared Utilities** - Core helpers, constants, and utilities

## Directory Structure

```
src/
├── components/
│   ├── TextGenerationCanvas.jsx     # VIEW-SPECIFIC: Text generation visualization canvas
│   ├── InputSection.jsx              # Reusable: Prompt input and example selector
│   ├── GeneratedAnswer.jsx           # Reusable: Generated text display
│   └── ...
│
├── views/
│   ├── TextGenerationView.jsx        # Text generation view layout
│   ├── TrainingView.jsx              # Training view layout (WIP)
│   └── DecodingView.jsx              # Decoding view layout (WIP)
│
└── visualization/
    ├── animation/
    │   ├── textGenerationTimeline.js  # VIEW-SPECIFIC: Text generation GSAP animations
    │   ├── trainingTimeline.js        # VIEW-SPECIFIC: Training GSAP animations (TODO)
    │   ├── decodingTimeline.js        # VIEW-SPECIFIC: Decoding GSAP animations (TODO)
    │   └── useGsapTimeline.js         # REUSABLE: Generic GSAP timeline hook
    │
    ├── layers/
    │   ├── tokenRenderer.js           # REUSABLE: Token visualization
    │   ├── embeddingRenderer.js       # REUSABLE: Embedding visualization
    │   ├── transformerRenderer.js     # REUSABLE: Transformer block visualization
    │   ├── outputRenderer.js          # REUSABLE: Output distribution visualization
    │   └── helpers/
    │       ├── vectorHelpers.js       # REUSABLE: Vector drawing utilities
    │       └── arrowHelpers.js        # REUSABLE: Arrow drawing utilities
    │
    └── core/
        ├── colors.js                  # SHARED: Color utilities
        ├── constants.js               # SHARED: Layout constants
        ├── draw.js                    # SHARED: Basic drawing primitives
        ├── embeddings.js              # SHARED: Embedding computations
        ├── layout.js                  # SHARED: Layout calculations
        └── selectors.js               # SHARED: CSS selectors for GSAP
```

## Component Categories

### 1. View-Specific Components

These components are tied to a specific view and should NOT be reused across views:

- **TextGenerationCanvas.jsx** - Complete canvas implementation for text generation view
- **textGenerationTimeline.js** - GSAP animations specific to text generation flow
- **trainingTimeline.js** - GSAP animations for training visualization (TODO)
- **decodingTimeline.js** - GSAP animations for decoding algorithms (TODO)

When implementing a new view:

1. Create a new Canvas component (e.g., `DecodingCanvas.jsx`)
2. Create a corresponding timeline file (e.g., `decodingTimeline.js`)
3. Use reusable renderers from `visualization/layers/` as needed

### 2. Reusable Renderers

These D3 rendering functions are **view-agnostic** and can be used across different views:

- **tokenRenderer.js** - Renders token boxes with collapse/expand functionality
- **embeddingRenderer.js** - Renders embedding vectors (vertical columns)
- **transformerRenderer.js** - Renders transformer block internals (attention, FFN)
- **outputRenderer.js** - Renders probability distribution and token selection

**Key principles:**

- Accept data via parameters (no global state dependencies)
- Return metadata for layout composition
- No view-specific logic
- Can be composed in different ways for different views

Example usage in a new view:

```javascript
import {
  renderTokensLayer,
  renderTransformerBlockLayer,
} from '../visualization/layers/renderLayers';

// Use in your custom canvas
renderTokensLayer(
  tokenGroup,
  step,
  layout,
  width,
  shouldCollapse,
  maxVisibleTokens,
  tokensLayoutRef
);
```

### 3. Reusable Helpers

Located in `visualization/layers/helpers/`:

- **vectorHelpers.js** - Drawing embedding columns, horizontal vectors, etc.
- **arrowHelpers.js** - Drawing various arrow types and connectors

These are pure utility functions that can be used by any renderer.

### 4. Shared Core Utilities

Located in `visualization/core/`:

- **colors.js** - Color generation and theming
- **constants.js** - Layout dimensions and styling constants
- **draw.js** - Basic SVG primitives (arrows, paths)
- **embeddings.js** - Embedding value computations
- **layout.js** - Layout calculation utilities
- **selectors.js** - CSS selectors for GSAP animations

## Creating a New View

To add a new view (e.g., "Attention Visualization"):

1. **Create the view component:**

   ```
   src/views/AttentionView.jsx
   ```

2. **Create the canvas component:**

   ```
   src/components/AttentionCanvas.jsx
   ```

3. **Create the timeline:**

   ```
   src/visualization/animation/attentionTimeline.js
   ```

   Implement `setInitialStates()` and `buildTimeline()` functions.

4. **Reuse existing renderers:**

   ```javascript
   import {
     renderTokensLayer,
     renderTransformerBlockLayer,
   } from '../visualization/layers/renderLayers';
   ```

5. **Use the generic timeline hook:**

   ```javascript
   import { useGsapTimeline } from '../visualization/animation/useGsapTimeline';
   import { setInitialStates, buildTimeline } from '../visualization/animation/attentionTimeline';

   // In your component:
   useGsapTimeline({
     svgRef,
     subStep,
     currentStep,
     animDuration,
     onComplete,
     setInitialStatesFn: setInitialStates,
     buildTimelineFn: buildTimeline,
   });
   ```

## Animation Timelines

Each view has its own GSAP timeline that controls the animation sequence:

- **textGenerationTimeline.js** - Controls the step-by-step text generation flow
- **trainingTimeline.js** - Will control training process visualization (TODO)
- **decodingTimeline.js** - Will control decoding algorithm comparisons (TODO)

The timeline files export two functions:

- `setInitialStates(svgElement, subStep, isInitialStep)` - Set element states before animation
- `buildTimeline(svgElement, subStep, isInitialStep, animDuration, onComplete)` - Build GSAP animation

**Do not intermingle timelines between views!** Each view's animation logic should be completely independent.

## Best Practices

1. **Separation of Concerns:**
   - View-specific logic → Canvas components and timeline files
   - Reusable visualization → Renderer functions
   - Utilities → Helper functions and core modules

2. **Naming Conventions:**
   - Canvas components: `{ViewName}Canvas.jsx`
   - Timeline files: `{viewName}Timeline.js`
   - Renderers: `{element}Renderer.js`

3. **Documentation:**
   - Mark reusable components with "REUSABLE" in comments
   - Mark view-specific components with "VIEW-SPECIFIC" in comments
   - Include usage examples for complex renderers

4. **Dependencies:**
   - Reusable components should NOT depend on view-specific state
   - Pass data explicitly via parameters
   - Use callbacks for interactions

5. **Testing New Views:**
   - Start with placeholder timeline (see `trainingTimeline.js` template)
   - Gradually implement animations
   - Reuse existing renderers before creating new ones

## Current Status

✅ **Completed:**

- Text generation view fully implemented
- Reusable renderers documented and marked
- Generic timeline hook created
- Clear separation between view-specific and reusable code

🚧 **In Progress:**

- Training view (using text generation components temporarily)

📝 **TODO:**

- Decoding view implementation
- Training-specific visualizations
- Additional reusable UI components as needed
