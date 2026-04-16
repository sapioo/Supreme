# AGENTS.md

Technical architecture and operating guide for coding agents working in this repository.

## 1) System Summary

CourtRoom AI is a single-page React application that simulates adversarial legal argument rounds for landmark Indian constitutional cases.

High-level flow:
1. Setup wizard (`start -> landing -> chooseSide`)
2. Transitional loader (`loading`)
3. Courtroom runtime (`courtroom`) with text + optional voice argument loops
4. Verdict presentation (`verdict`) with score recap and replay options

This is a client-heavy architecture with optional external service integrations:
- Voice runtime: Vapi
- Retrieval augmentation: Qdrant + NVIDIA embeddings
- Deterministic fallback: local mock AI responses/scoring

## 2) Platform and Build Architecture

### Runtime platform
- React `19.2.4`
- Browser SPA rendered via `react-dom/client`
- Vite build/dev server

### Build and tooling
- Vite `8.x` + `@vitejs/plugin-react`
- Tailwind v4 plugin (`@tailwindcss/vite`)
- ESLint 9 flat config style

### Commands
- `npm run dev` -> local development
- `npm run build` -> production bundle
- `npm run preview` -> built app preview
- `npm run lint` -> static lint checks
- `npm run ingest` -> Node ingestion pipeline for legal corpus vectors

## 3) Source Tree Architecture

Top-level app source is under `src/`.

- `src/main.jsx` -> entrypoint, provider composition, root render
- `src/App.jsx` -> page orchestration and wizard control logic
- `src/context/` -> global state machine (`GameContext`)
- `src/components/` -> feature UI modules
  - `onboarding/` setup shell
  - `landing/` case and side selection
  - `common/` shared transition UI (loader)
  - `courtroom/` runtime argument interface
  - `verdict/` post-game results
  - `ui/` shadcn-style primitive components
- `src/pages/` -> onboarding step pages
- `src/data/` -> case corpus + mock AI/score logic
- `src/hooks/` -> service hooks (Vapi)
- `src/services/` -> retrieval runtime + ingestion script
- `src/index.css` -> design tokens, global theme, resets, motion keyframes

## 4) Application Control Architecture

### Entry and provider composition
- `src/main.jsx` renders `<App />` inside `<GameProvider />` under `<StrictMode>`.
- All product state and phase transitions flow through `GameContext` reducer actions.

### Page orchestration (`src/App.jsx`)
- App checks `state.currentPage` and conditionally renders one of:
  - setup wizard composite
  - loading screen
  - courtroom arena
  - verdict screen
- Wizard has explicit step config and validation gating.

Wizard step map:
- `start` -> intro
- `landing` -> case selection
- `chooseSide` -> role selection

Step gating:
- cannot proceed past case step without `selectedCase`
- cannot proceed past side step without `selectedSide`
- final wizard advance transitions to `loading`

## 5) State Machine Architecture

### Core store
- `src/context/GameContext.jsx`
- Implemented with `useReducer`
- Context split into data context and dispatch context

### State model
- `currentPage`: phase router key
- `selectedCase`: chosen case object from corpus
- `selectedSide`: `petitioner | respondent`
- `currentRound`, `totalRounds`
- `arguments`: transcript entries (`user` and `ai`)
- `roundScores`: per-round scoring payload
- `timer`: round countdown
- `isAiTyping`: AI response pending state
- `verdict`: final aggregate result
- `isTransitioning`: visual transition flag
- `caseContext`: retrieved legal context text
- `isLoadingContext`: retrieval loading state

### Action protocol
- Setup actions:
  - `SELECT_CASE` (also clears selected side)
  - `SELECT_SIDE`
  - `SET_PAGE`
- Courtroom actions:
  - `START_GAME`
  - `SUBMIT_ARGUMENT`
  - `AI_RESPOND`
  - `SCORE_ROUND`
  - `NEXT_ROUND`
  - `UPDATE_TIMER`
  - `END_GAME`
- Retrieval/system:
  - `SET_CASE_CONTEXT`
  - `SET_LOADING_CONTEXT`
  - `SET_TRANSITIONING`
- Session reset:
  - `RESET`

### Invariants
- `SELECT_CASE` resets side to prevent stale role across cases.
- Wizard pages are treated as pre-game setup phases, not gameplay phases.
- `START_GAME` reinitializes round/timer/argument/score state.

## 6) Feature Architecture by Domain

### A) Onboarding domain

Primary files:
- `src/components/onboarding/SetupWizardShell.jsx`
- `src/pages/StartPage.jsx`
- `src/pages/LandingPage.jsx`
- `src/components/landing/ChooseSide.jsx`
- `src/components/landing/CaseGrid.jsx`
- `src/components/landing/CaseCard.jsx`

Responsibilities:
- central shell provides progress bar, step labels, CTA frame
- each step surface only owns local display + selection interaction
- `App.jsx` owns navigation decisions and validity checks

### B) Transitional loading domain

Primary file:
- `src/components/common/GavelLoader.jsx`

Responsibilities:
- timed staged loading choreography
- emits completion callback to trigger `START_GAME`

### C) Courtroom runtime domain

Primary file:
- `src/components/courtroom/CourtroomArena.jsx`

Submodules:
- `TopBar.jsx` -> timer + round + case identity
- `JudgeBench.jsx` -> running score panel
- `ChatArea.jsx` -> transcript stream + view mode + voice controls
- `ArgumentInput.jsx` -> text entry and voice mode controls
- `ArgumentBubble.jsx` -> per-message render unit
- `VoiceWaveform.jsx` -> assistant speech visualization

Runtime control loop:
1. user submits argument (typed text or voice transcript)
2. `SUBMIT_ARGUMENT` recorded, AI pending state set
3. AI response generated (mock, optionally retrieval-augmented)
4. `AI_RESPOND` recorded
5. scoring functions run and `SCORE_ROUND` dispatched
6. if last round -> aggregate totals + `END_GAME`; else `NEXT_ROUND`

### D) Verdict domain

Primary file:
- `src/components/verdict/VerdictScreen.jsx`

Submodules:
- `ScalesTipping.jsx`
- `Scorecard.jsx`
- `CaseSummary.jsx`

Responsibilities:
- phased reveal sequence
- winner presentation and totals
- replay/reset controls (`RESET`)

## 7) Data and Decision Architecture

### Static corpus
- `src/data/cases.js`
- Each case includes metadata, tags/articles, and side-specific argument structures.

### Mock AI behavior
- `src/data/mockAI.js`

Exports:
- `getAIResponse(caseId, round, aiSide)`
- `scoreArgument(userArgument, caseData, side, round)`
- `getAIScore(round)`
- `getJudgeComment(userScore, aiScore)`

Design intent:
- deterministic-ish per case/round narratives
- heuristic scoring based on lexical/legal signal density
- playable fallback when external providers are unavailable

## 8) External Service Architecture

### A) Retrieval augmentation (Qdrant + NVIDIA)

Runtime service:
- `src/services/qdrantService.js`

Core functions:
- `isQdrantConfigured()`
- `embedText(text)` via NVIDIA embeddings endpoint
- `searchRelevantContext({ queryText, caseId, aiSide, limit })`
- `getCaseOverview(caseId)`
- `formatContextForPrompt(results)`

Runtime usage in courtroom:
- on case load, app attempts broad overview retrieval
- on each user argument, app attempts targeted retrieval
- retrieved formatted context is appended to system prompt context
- failure paths log and gracefully degrade to mock-only behavior

### B) Voice orchestration (Vapi)

Hook:
- `src/hooks/useVapi.js`

Responsibilities:
- instance bootstrap and teardown
- call start/stop
- transcript event routing
- speaking status and volume stream state
- mute controls

Fallback behavior:
- if `VITE_VAPI_PUBLIC_KEY` missing/placeholder, voice controls degrade without app crash

## 9) Ingestion Pipeline Architecture (Node Script)

Script:
- `src/services/ingestCases.js`

Purpose:
- fetch legal judgments from Indian Kanoon API
- normalize and strip HTML
- classify chunks by legal section semantics
- generate embeddings via NVIDIA
- upsert vectors and payload metadata into Qdrant collection

Pipeline stages (high-level):
1. case lookup/search against Indian Kanoon
2. fetch document payload
3. clean HTML and tokenize/chunk text
4. classify chunk types (`petitioner_argument`, `respondent_argument`, `court_reasoning`, etc.)
5. embed chunk text
6. upsert into `courtroom_cases` collection

Operational notes:
- includes retry/backoff for rate limits
- relies on Node env variables (loaded via `dotenv/config`)

## 10) UI Primitive Architecture

Reusable primitives under `src/components/ui/` include:
- `button.jsx`
- `card.jsx`
- `badge.jsx`
- `separator.jsx`
- `progress.jsx`
- `textarea.jsx`
- others (`tabs`, `tooltip`, `avatar`)

These are consumed variably across features:
- courtroom uses utility-heavy style + primitives
- onboarding has migrated toward compact SaaS-style block patterns

## 11) Theming and Styling Architecture

### Global theming
- `src/index.css` defines core tokens:
  - semantic color variables
  - typography stacks
  - spacing/radius/elevation
  - motion and keyframes

### Styling model
- hybrid strategy:
  - utility classes for dense interactive surfaces
  - per-feature CSS modules/files for composed layouts

### Important implication
- visual changes should preserve token usage and avoid hardcoded one-off palette drift unless deliberate.

## 12) Environment and Configuration Contract

### Required for optional retrieval
- `VITE_QDRANT_URL`
- `VITE_QDRANT_API_KEY`
- `VITE_NVIDIA_API_KEY`

### Required for optional voice
- `VITE_VAPI_PUBLIC_KEY`
- `VITE_VAPI_ASSISTANT_ID` (optional)

### Ingestion-only env
- `VITE_INDIANKANOON_API_KEY`

If env vars are absent, product should remain operational using local/mock paths.

## 13) Error Handling and Fallback Architecture

Fallback philosophy in this repo is fail-soft:
- retrieval failures -> log + empty context + continue gameplay
- voice unavailable -> disable/idle controls without blocking text mode
- service init issues -> keep user in deterministic local simulation path

Agents should preserve this behavior when refactoring integrations.

## 14) Current Known Engineering Constraints

- Build currently succeeds (`npm run build`).
- Lint currently has existing repo-wide failures unrelated to a single module.
- Some files in working tree may be user-modified; avoid reverting unrelated changes.

## 15) Implementation Rules for Agents

When editing:
- do not break the reducer action contract used by existing components
- keep page routing states aligned with `currentPage` enum values
- maintain setup gating rules in `App.jsx`
- preserve graceful degradation for external integrations
- prefer extension of existing domains over duplicating alternate flows

When validating:
- run build for regression safety
- run lint and report honest status with affected files
- include concise migration notes when architecture-level behavior changes

## 16) Quick Dependency Map

- `main.jsx` -> `GameProvider` -> `App`
- `App` -> wizard pages OR loader OR courtroom OR verdict
- `CourtroomArena` -> `useVapi` + `mockAI` + optional `qdrantService`
- `VerdictScreen` consumes reducer-computed verdict + scores
- `ingestCases.js` populates retrieval backend used by `qdrantService`

This dependency graph is the core technical architecture of the product.
