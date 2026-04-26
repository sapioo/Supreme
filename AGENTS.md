# AGENTS.md

## Purpose

This repository is a single-package Vite frontend for `SUPREME`. It now contains three distinct product surfaces:

- the courtroom simulator
- the drafting workspace
- the `FIRM` advocate recommendation flow

Use this file as the operating guide before making code, UX, AI-service, or infrastructure changes.

## Project Shape

- App type: single-package React app
- Framework: React 19
- Build tool: Vite 8
- Language: JavaScript with JSX
- State model:
  - courtroom app state: React Context + reducer
  - drafting workspace state: component-local React state
- Styling:
  - legacy pages/components: plain CSS modules-by-convention (`*.css`)
  - drafting workspace and shared primitives: Tailwind 4 utilities + Radix UI primitives
- AI integrations:
  - Gemini OpenAI-compatible endpoint for generation, scoring, tone analysis, and drafting assistant behavior
  - NVIDIA embeddings for retrieval
  - Qdrant Cloud for vector search
  - Vapi Web SDK for live voice sessions
- Persistence:
  - archived courtroom sessions: browser `localStorage`
  - drafting workspace drafts: browser `localStorage`
- Data ingestion: standalone Node script in `src/services/ingestCases.js`

This is not a monorepo. There is still no backend service in this repo.

## High-Level Architecture

The app is client-rendered and state-driven. `src/App.jsx` acts as the top-level page switcher instead of URL routing.

Current page states in practice:

- `start`
- `drafting`
- `landing`
- `firm`
- `customCase`
- `chooseSide`
- `loading`
- `courtroom`
- `verdict`

Important note:

- `src/context/GameContext.jsx` still has an outdated inline page comment that omits `firm` and `customCase`.
- The reducer itself supports these pages through `SET_PAGE`; do not treat the comment as authoritative.

## Runtime Flow

`src/main.jsx`
- Bootstraps React
- Wraps the app in `GameProvider`
- Wraps rendering in `ErrorBoundary`

`src/App.jsx`
- Chooses which top-level experience to render
- Wires callbacks between the start screen, landing flow, drafting flow, courtroom flow, and verdict flow

`src/context/GameContext.jsx`
- Holds the courtroom/game reducer state
- Manages case selection, side selection, round progression, argument history, scoring, timers, tone results, and verdict state

`src/components/courtroom/CourtroomArena.jsx`
- Main courtroom orchestrator
- Coordinates text submission, voice mode, retrieval, tone analysis, AI replies, round scoring, and verdict progression

`src/pages/DraftingPage.jsx`
- Separate drafting workspace
- Manages template selection, document setup, local draft persistence, AI chat interactions, preview generation, and export UI state

`src/pages/FirmPage.jsx`
- Standalone advocate recommendation flow
- Accepts free-text case summaries and renders ranked counsel suggestions

## Important Directories

`src/pages/`
- Top-level surfaces: start, landing, drafting, and firm

`src/components/landing/`
- Case discovery, archive, side selection, and custom case builder UI

`src/components/courtroom/`
- Core debate experience
- `CourtroomArena.jsx` contains most courtroom orchestration logic

`src/components/drafting/`
- Drafting workspace shell, wizard, panes, and settings UI

`src/components/ui/`
- Reusable UI primitives, mostly Radix/Tailwind-based

`src/components/verdict/`
- End-of-case verdict and score presentation

`src/components/common/`
- Shared loading and error-boundary components

`src/context/`
- Game reducer and provider

`src/data/`
- Static case catalog, courtroom mock AI fallbacks, and drafting templates

`src/hooks/`
- `useVapi.js` owns Vapi voice session lifecycle

`src/services/`
- `nimService.js`: Gemini-backed courtroom generation/scoring and FIRM ranking
- `tonalService.js`: Gemini-backed tone analysis
- `draftingAIService.js`: Gemini-backed drafting assistant
- `draftingAISettings.js`: drafting AI env-backed settings
- `qdrantService.js`: embeddings + Qdrant search + prompt formatting
- `sessionStorage.js`: courtroom archive persistence
- `draftStorage.js`: drafting workspace persistence
- `ingestCases.js`: destructive RAG corpus ingestion pipeline

`src/test/`
- Vitest setup currently exists at `src/test/setup.js`

`docs/`
- Planning and design notes, not runtime code

## Functional Architecture

### 1. Navigation and Experience State

The application still uses state-driven page switching, not `react-router`. Treat any routing migration as structural work.

The reducer primarily owns courtroom navigation. The drafting page is rendered through the same top-level page switch but does not use the reducer for its inner workflow.

### 2. Courtroom Simulator

The courtroom flow remains:

`start -> landing -> chooseSide -> loading -> courtroom -> verdict`

Supporting branches now exist from landing:

- `firm`
- `customCase`

`CourtroomArena.jsx` is still the highest-risk file in the repo. It currently coordinates:

- user text submission
- live voice transcripts
- Vapi call lifecycle
- Qdrant health checks and case overview loading
- per-round retrieval context lookups
- Gemini argument generation
- Gemini-based scoring with local fallback
- tone analysis
- round transitions and verdict endgame

Preserve graceful degradation:

- Gemini unavailable -> mock/fallback courtroom behavior
- Qdrant unavailable -> no retrieval context
- Vapi unavailable -> text mode only

### 3. FIRM Advocate Finder

`src/pages/FirmPage.jsx` is a separate AI flow, not part of the courtroom reducer loop.

Technical behavior:

- user submits a legal situation summary
- `nimService.rankLawyersForCase()` calls Gemini
- responses are parsed into a normalized ranked list
- fallback lawyer results are synthesized if the model output is unusable

Changes here should preserve:

- graceful failure states
- the six-result ranking shape
- the current low-friction single-page UX

### 4. Drafting Workspace

`src/pages/DraftingPage.jsx` is effectively a second product inside the same app.

It includes:

- template-based draft creation from `src/data/draftingTemplates.js`
- local draft persistence via `draftStorage.js`
- wizard-style matter setup
- source/preview/AI-chat panes
- LaTeX-like source parsing for preview blocks
- Gemini-assisted drafting edits via `draftingAIService.js`

Important boundaries:

- drafting state is mostly local to `DraftingPage.jsx`
- drafting AI expects structured responses and has defensive parsing for malformed model output
- draft persistence is browser-only and localStorage-backed

### 5. Voice Mode

`src/hooks/useVapi.js` encapsulates:

- lazy Vapi client creation
- call start/stop
- user and assistant transcript streaming
- speaking state
- mute/unmute behavior
- inline assistant configuration fallback

Voice mode is optional. Text mode must remain fully usable without Vapi.

### 6. Retrieval-Augmented Generation

`src/services/qdrantService.js` handles:

- Vite/browser-safe env detection
- NVIDIA embedding calls
- Qdrant collection health checks
- filtered search by `case_id` and `section_type`
- formatting retrieved text for prompt injection

RAG is an enhancement, not a hard dependency.

### 7. Ingestion Pipeline

`src/services/ingestCases.js` is a standalone Node script that:

- reads env from the process environment
- fetches case documents from Indian Kanoon
- strips HTML
- chunks and classifies legal text
- generates NVIDIA embeddings
- recreates and repopulates the Qdrant collection

This script is destructive with respect to the target Qdrant collection. Treat it as an operator workflow, never as normal frontend runtime.

## Infrastructure and External Dependencies

### Environment Variables

The repo expects a root `.env` for local work.

Browser/runtime variables in active use:

- `VITE_VAPI_PUBLIC_KEY`
- `VITE_VAPI_ASSISTANT_ID`
- `VITE_GEMINI_API_KEY`
- `VITE_NVIDIA_API_KEY`
- `VITE_QDRANT_URL`
- `VITE_QDRANT_API_KEY`
- `VITE_INDIANKANOON_API_KEY`

Drafting-specific variables supported by Vite `envPrefix`:

- `DRAFTING_GEMINI_KEY`
- `DRAFTING_GEMINI_MODEL`

Notes:

- `vite.config.js` exposes both `VITE_` and `DRAFTING_` prefixes to client code.
- `draftingAISettings.js` prefers `VITE_GEMINI_API_KEY` first, then `DRAFTING_GEMINI_KEY`.
- `ingestCases.js` still reads the `VITE_*` variables from Node `process.env`.
- Browser-exposed secrets are acceptable only for local demos or prototyping. Do not expand that pattern casually.

### Development Proxy

`vite.config.js` currently defines local proxy routes:

- `/api/nvidia` -> NVIDIA API
- `/api/gemini` -> Google Gemini OpenAI-compatible endpoint
- `/api/qdrant` -> a hardcoded Qdrant Cloud cluster

Implications:

- browser code uses proxy paths during development
- production browser code calls remote URLs directly
- the checked-in Qdrant proxy target is an infrastructure detail that should be verified before depending on it

### External Services

Gemini
- current browser-side model default: `gemini-2.5-flash`
- used for courtroom generation, courtroom scoring, tone analysis, drafting AI, and FIRM ranking

NVIDIA embeddings
- model: `nvidia/nv-embed-v1`
- expected vector size: `4096`

Qdrant Cloud
- expected collection name: `courtroom_cases`

Vapi
- used only for live voice mode

Indian Kanoon API
- used only by ingestion

## Commands

Primary npm scripts from `package.json`:

- `npm install`
- `npm run dev`
- `npm run build`
- `npm run preview`
- `npm run lint`
- `npm run test`
- `npm run test:watch`
- `npm run ingest`

## Known Caveats

### Large Orchestrator Files

These files carry disproportionate behavioral risk:

- `src/components/courtroom/CourtroomArena.jsx`
- `src/context/GameContext.jsx`
- `src/hooks/useVapi.js`
- `src/services/nimService.js`
- `src/services/draftingAIService.js`
- `src/services/qdrantService.js`
- `src/services/ingestCases.js`

Change them carefully and verify real flows, not just lint/build output.

### Mixed Styling Systems

The repo now uses both plain CSS and Tailwind/Radix-style UI primitives. Preserve the local style of the area you are editing instead of trying to normalize everything during a small change.

### Browser-Side Secrets

Multiple third-party API keys remain client-exposed through Vite env usage. Avoid broadening this architecture unless the task explicitly moves behavior behind a server boundary.

### Destructive Ingestion

`npm run ingest` can recreate the Qdrant collection. Never run it casually against a shared environment.

### Local Persistence

Courtroom archives and drafting documents both rely on `localStorage`. Schema changes in stored objects should be treated as migration-sensitive work.

## Change Guidance for Agents

### Safe Areas for Small Changes

- visual updates within isolated page/component CSS
- new static cases in `src/data/cases.js`
- verdict UI polish
- landing and archive presentation work
- drafting workspace UI changes that stay within local component state
- new drafting templates in `src/data/draftingTemplates.js`

### Areas Requiring Extra Care

- `GameContext.jsx`
- `CourtroomArena.jsx`
- `useVapi.js`
- `nimService.js`
- `tonalService.js`
- `draftingAIService.js`
- `qdrantService.js`
- `ingestCases.js`
- `vite.config.js`

### Before Editing AI or Infra Paths

Confirm:

- whether the code runs in the browser or in Node
- whether the behavior must continue working without external services
- whether the code expects dev-proxy URLs or production URLs
- whether the change affects courtroom AI, drafting AI, or both
- whether credentials are read from `VITE_*`, `DRAFTING_*`, or `process.env`

## Verification Expectations

For UI or reducer changes:

- run `npm run build`
- run `npm run lint` if touched files are lint-covered

For courtroom gameplay changes:

- verify `start -> landing -> chooseSide -> loading -> courtroom -> verdict`
- verify text-only behavior when voice is unavailable
- verify the app still behaves acceptably when Qdrant is unavailable

For drafting changes:

- verify create draft, reopen draft, autosave, and preview behavior
- verify AI chat failure states if the change touches drafting AI integration

For FIRM changes:

- verify loading, error, and reset states
- preserve normalized six-result rendering

For infra/service changes:

- validate environment variable assumptions explicitly
- do not assume Gemini, NVIDIA, Qdrant, or Vapi connectivity without checking

## Recommended Structural Improvements

These are sensible future directions, not current guarantees:

- move browser-exposed secret-bearing calls behind a backend or edge layer
- split `CourtroomArena.jsx` into smaller controllers/hooks
- split `DraftingPage.jsx` into smaller controller hooks and state slices
- add targeted reducer, service, and drafting parser tests
- formalize deployment once a hosting target is chosen

## Bottom Line

Treat this project as a frontend-first prototype with multiple AI-assisted legal workflows inside one app. Preserve graceful fallback behavior, be precise about which runtime path you are touching, and assume infrastructure is lightweight and manually configured unless the user asks to formalize it.
