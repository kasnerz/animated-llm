# Refactor and Modularization Plan

This document proposes a pragmatic, staged refactor for the Animated LLM project. It focuses on maintainability and clear module boundaries while preserving current behavior.

## Decisions and scope (confirmed)

- Language: JavaScript (no TypeScript for now).
- Visualization will expand (more blocks, details), so design for extensibility.
- No routing needed.
- Responsiveness: basic desktop-first; small screens are not a priority.
- No performance optimization phase now (leave hooks/structure ready for later).
- i18n limited to EN/CZ, but easy to extend.
- No tests for now (prototype stage). We will still keep seams for future tests.

## Goals

- Reduce complexity in `VisualizationCanvas.jsx` via composable layers and pure helpers.
- Make state transitions explicit and predictable (useReducer, action types).
- Remove brittle patterns (dynamic require in i18n) and circular dependencies.
- Establish clear folders: services, visualization core/layers, i18n, app contexts.
- Keep behavior and visuals unchanged during early phases.

## Current architecture (summary)

- Vite + React 18, D3 v7, GSAP 3, ESLint configured.
- Global state in `AppContext.jsx` with a single `useState` blob and many action callbacks.
- UI: `InputSection`, `GeneratedAnswer`, `VisualizationCanvas` (monolithic imperative D3/GSAP + inner helpers).
- Utilities: `config.js`, `utils/i18n.js` (dynamic require of context), `utils/colorSchemes.js`.
- Styles under `src/styles` are global CSS files.

## Key pain points

- "God component": `VisualizationCanvas.jsx` mixes layout, rendering primitives, animation, and local interaction state.
- Context couples settings, data loading, and generation/animation control in one state object.
- i18n hook dynamically requires context to avoid circular deps.
- Data access logic (`fetch`) sits in context.

---

## Phased plan

Each phase is intended to be a small PR with no behavior change unless stated. Phases are independent where possible.

### Phase 0 — Dev workflow hygiene (no tests)

- Add npm scripts for lint/format and consider Prettier integration.
- Optionally add `lint-staged` + `husky` pre-commit (no tests enforced).

Acceptance

- `npm run lint` and `npm run format` run clean on main.

Notes

- We won’t add a test runner now. Keep code seams for future tests.

### Phase 1 — Boundaries and services

- Create folders (no logic changes yet):
  - `src/services/` — data access.
  - `src/visualization/` — visualization modules (core, layers, animation).
  - `src/i18n/` — translations/provider.
  - `src/app/` — contexts/providers (or keep `contexts/` and add structure inside).
- Extract data loading from `AppContext` to `services/examplesApi.js`:
  - `listExamples(): Promise<{id:string,prompt:string}[]>`
  - `getExample(id: string): Promise<Example>`
- Keep current `AppContext` behavior; just delegate fetches to service.

Acceptance

- Build runs; loading/selection still work.

### Phase 2 — i18n cleanup (EN/CZ only)

- Replace `utils/i18n.js` dynamic require with a dedicated provider:
  - `i18n/I18nProvider.jsx` storing `language` and providing `useI18n()` that returns `t(key)` and current `language`.
  - Store translations in `i18n/translations.js`.
- Wire provider above `AppContent` (or share language from settings context; see Phase 3). Maintain keyboard toggle behavior.

Acceptance

- All text is still localized; Ctrl+L toggles language.

### Phase 3 — State management hardening (no tests)

- Convert `AppContext` to `useReducer` with typed action objects.
- Optional split (kept in a single provider initially to limit churn):
  - Settings slice: theme, language, animationSpeed.
  - Generation slice: examples, current example, current step/substep, playback flags, generatedAnswer.
- Side effects like writing `data-theme` attribute move to a dedicated `useThemeEffect(theme)` hook.
- Keep action names stable to minimize component changes.

Acceptance

- Keyboard shortcuts (Space/KeyR/Ctrl+T/Ctrl+L) behave the same.
- Generation and sub-step advance logic unchanged.

### Phase 4 — Visualization modularization (major)

Refactor `VisualizationCanvas.jsx` into composable layers and pure helpers while preserving visuals and sub-steps.

Structure

- `visualization/core/`
  - `layout.js` — derive positions, widths, collapse/expand logic, y-coordinates.
  - `draw.js` — D3/SVG primitives: arrows, rounded paths, embedding columns, horizontal vectors.
  - `colors.js` — token/probability color scales (consolidate with `utils/colorSchemes.js`).
  - `selectors.js` — class names and query selectors used by GSAP.
- `visualization/layers/`
  - `TokensLayer.jsx`
  - `EmbeddingsLayer.jsx`
  - `TransformerBlock.jsx`
  - `BottomEmbeddings.jsx`
  - `OutputDistribution.jsx`
- `visualization/animation/`
  - `timeline.js` — builds GSAP timeline for the current sub-step only.
  - `useGsapTimeline.js` — hook to create/kill timeline on dependency change.

Principles

- Move all inner helpers (e.g., `drawArrow`, `drawEmbeddingColumn`, `rightAngleRoundedPath`) to `core/draw.js` with pure inputs/outputs.
- Memoize derived layout and stable data per step to avoid unnecessary recomputation.
- Keep expand/collapse and local embedding toggles as local state via small hooks, not global context.

Acceptance

- Visual parity across sub-steps (compare quickly side-by-side during manual QA).
- Keyboard-controlled sub-step still drives the same sequence.

### Phase 5 — Styling and responsiveness

- Centralize CSS variables in `styles/themes.css` and reduce hard-coded colors in JS (use CSS vars where feasible).
- Extract magic numbers into constants in `visualization/core/layout.js` where CSS is insufficient.
- Ensure collapsed token view works well at narrower widths; keep expand button.
- Basic containment and overflow behavior for the SVG container.

Acceptance

- Desktop renders cleanly; narrow viewport remains readable without layout breakage.

### Phase 6 — Future expansions (not in this refactor)

- Multiple transformer blocks, per-head attention overlays.
- Live data or pluggable example source.
- Performance tuning (selective updates instead of full SVG rebuilds; caching static layers).
- Optional routing for shareable example/step (currently out of scope).

---

## Risks and mitigations

- Animation regressions: keep class names/selectors centralized; migrate in small steps layer-by-layer.
- D3/GSAP interplay: limit direct DOM querying to layer roots; pass refs explicitly.
- Refactor churn: keep public action names stable; avoid renaming visible strings.

## Rollout strategy

1. Phase 0–1 (low risk) in quick PRs.
2. Phase 2 (i18n provider) — small PR, then update imports.
3. Phase 3 (reducer) — migrate actions and internal state shape; verify flows.
4. Phase 4 (visualization) — split by layers in 2–3 PRs to keep scope manageable.
5. Phase 5 (styling) — final polish.

## Extension points to keep in mind

- Visualization layers should accept data describing any number of blocks/heads.
- `services/` should allow swapping sources (local JSON now, remote later).
- i18n provider should support lazy language pack loading later on.

## Acceptance checklist per phase

- Build succeeds with Vite.
- ESLint passes (and Prettier if added).
- Manual smoke test:
  - Load default example.
  - Start generation.
  - Space advances sub-steps.
  - Ctrl+T toggles theme.
  - Ctrl+L toggles language.
  - Reset returns to initial state.

---

## Proposed file additions (as stubs in upcoming PRs)

- `src/services/examplesApi.js`
- `src/i18n/I18nProvider.jsx`, `src/i18n/translations.js`
- `src/visualization/core/{layout.js,draw.js,colors.js,selectors.js}`
- `src/visualization/layers/{TokensLayer.jsx,EmbeddingsLayer.jsx,TransformerBlock.jsx,BottomEmbeddings.jsx,OutputDistribution.jsx}`
- `src/visualization/animation/{timeline.js,useGsapTimeline.js}`

No code has been changed by this plan; it documents the intended sequence and boundaries only.
