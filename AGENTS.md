# AGENTS.md

## Purpose

This repository is a single-page React application for `SUPREME`, an interactive legal debate simulator centered on landmark Indian Supreme Court cases. This file is the working guide for coding agents and contributors who need to understand the architecture, runtime boundaries, and infrastructure expectations before making changes.

## Project Shape

- App type: single-package Vite frontend
- Framework: React 19
- Build tool: Vite 8
- Language: JavaScript with JSX
- State model: React Context + reducer
- AI integrations:
  - NVIDIA NIM for text generation and scoring
  - NVIDIA embeddings for retrieval
  - Qdrant Cloud for vector search
  - Vapi Web SDK for live voice sessions
- Persistence: browser `localStorage` for archived sessions
- Data ingestion: standalone Node script in `src/services/ingestCases.js`

This is not a monorepo and there is no dedicated backend service in the repo today.

## High-Level Architecture

The app is a client-rendered courtroom simulation with five major runtime layers:

1. UI shell and page orchestration
2. Global game state
3. Courtroom round engine
4. AI and retrieval services
5. Optional ingestion pipeline for the RAG corpus

### Runtime Flow

`src/main.jsx`
- Bootstraps React
- Wraps the app in `GameProvider`
- Wraps rendering in `ErrorBoundary`

`src/App.jsx`
- Acts as the page/state router
- Switches between:
  - `start`
  - `landing`
  - `chooseSide`
  - `loading`
  - `courtroom`
  - `verdict`

`src/context/GameContext.jsx`
- Holds the authoritative app state
- Manages reducer actions for:
  - case selection
  - side selection
  - round progression
  - argument history
  - scoring
  - timer updates
  - verdict generation
  - RAG context loading

`src/components/courtroom/CourtroomArena.jsx`
- This is the core gameplay orchestrator
- Coordinates:
  - text submissions
  - voice mode
  - timer expiry
  - round scoring
  - AI replies
  - Qdrant retrieval
  - end-of-game verdict calculation

## Important Directories

`src/pages/`
- Top-level experience pages
- `StartPage.jsx` and `LandingPage.jsx` are presentation entry points

`src/components/landing/`
- Case discovery and side-selection related UI

`src/components/courtroom/`
- Main debate experience
- `CourtroomArena.jsx` contains most interaction logic

`src/components/verdict/`
- End-of-case scoring and verdict UI

`src/components/common/`
- Shared UI and error boundary

`src/context/`
- Global reducer/state provider

`src/data/`
- Static case catalog in `cases.js`
- Mock AI fallbacks in `mockAI.js`

`src/hooks/`
- `useVapi.js` owns Vapi voice session lifecycle

`src/services/`
- `nimService.js`: NVIDIA NIM generation + scoring
- `qdrantService.js`: embeddings + Qdrant search + prompt formatting
- `ingestCases.js`: corpus ingestion pipeline
- `sessionStorage.js`: local archive persistence

`docs/`
- Contains planning and design notes, not runtime code

## Functional Architecture

### 1. Navigation and Experience States

The application uses reducer-driven page switching instead of URL routing. Do not assume `react-router` exists. If introducing routes, treat that as a structural change rather than a small refactor.

### 2. Case Model

`src/data/cases.js` is the primary catalog of playable cases. Each case contains:

- metadata
- difficulty
- constitutional articles
- petitioner profile and key arguments
- respondent profile and key arguments

This data powers both UI rendering and prompt construction.

### 3. Debate Engine

`CourtroomArena.jsx` drives each round:

- user submits argument by text or voice
- optional retrieval context is fetched from Qdrant
- NVIDIA NIM generates the AI opponent reply
- user argument is scored, preferably by NIM
- fallback heuristics are used if scoring/generation fails
- reducer stores round transcripts and scores
- verdict is computed from aggregated round scores

The current implementation is intentionally frontend-heavy. Much of the orchestration lives in a single component, so changes here should be made carefully.

### 4. Voice Mode

`src/hooks/useVapi.js` encapsulates:

- lazy Vapi client creation
- call start/stop
- transcript handling
- speaking state
- mute/unmute behavior
- inline assistant config if no assistant ID is provided

Voice mode is optional. The app should still work fully in text mode when Vapi is unavailable.

### 5. Retrieval-Augmented Generation

`src/services/qdrantService.js` handles:

- environment detection
- NVIDIA embedding calls
- Qdrant collection health checks
- filtered vector search by `case_id` and `section_type`
- prompt-friendly formatting of retrieved context

RAG is an enhancement, not a hard dependency. The app is expected to degrade gracefully if retrieval is unavailable.

### 6. Ingestion Pipeline

`src/services/ingestCases.js` is a standalone Node script that:

- fetches case documents from Indian Kanoon
- strips HTML
- chunks legal text
- classifies chunk types
- generates embeddings
- creates/recreates the Qdrant collection
- upserts vectors and metadata

This script is destructive with respect to the target Qdrant collection. Treat it as an operator workflow, not as part of the normal frontend runtime.

## Infrastructure and External Dependencies

### Required Environment Variables

The project expects a root `.env` file for local work.

Frontend/runtime variables:

- `VITE_VAPI_PUBLIC_KEY`
- `VITE_VAPI_ASSISTANT_ID`
- `VITE_NVIDIA_API_KEY`
- `VITE_QDRANT_URL`
- `VITE_QDRANT_API_KEY`
- `VITE_INDIANKANOON_API_KEY`

Notes:

- `VITE_` variables are exposed to browser code by Vite.
- This means the current architecture puts several third-party API credentials in the client runtime.
- That is acceptable only for local prototyping or tightly controlled demos.
- A production-grade deployment should move NIM, Qdrant, and ingestion-facing credentials behind a server boundary.

### Development Proxy

`vite.config.js` defines local proxy routes:

- `/api/nvidia` -> NVIDIA API
- `/api/qdrant` -> a hardcoded Qdrant Cloud cluster

Implications:

- browser code uses the proxy in development
- production code calls the configured remote URLs directly
- the checked-in dev proxy currently embeds a concrete Qdrant host, which is an infra detail contributors should verify before relying on it

### External Services

NVIDIA NIM
- model used: `meta/llama-3.3-70b-instruct`
- used for response generation and structured scoring

NVIDIA Embeddings
- model used: `nvidia/nv-embed-v1`
- expected vector size: `4096`

Qdrant Cloud
- expected collection name: `courtroom_cases`
- stores chunked legal text plus metadata

Vapi
- used only for live voice mode
- the app falls back to text mode if unavailable

Indian Kanoon API
- used only by ingestion
- not required for normal gameplay

## Deployment Reality

There is no deployment manifest in the repo right now:

- no Dockerfile
- no Docker Compose
- no Vercel config
- no Netlify config
- no GitHub Actions workflows

Assume local development unless the user explicitly wants deployment work.

If productionizing this app, the likely minimum infra shape would be:

- static frontend hosting for the Vite app
- a small backend or edge layer for secret-bearing API calls
- managed Qdrant instance
- secret management for NVIDIA, Qdrant, Vapi, and Indian Kanoon
- ingestion execution environment separate from the browser app

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

## Known Issues and Current Caveats

### Test Configuration Gap

`vite.config.js` points Vitest to `./src/test/setup.js`, but `src/test/setup.js` does not exist in the repository. Expect test runs to fail until that setup file is added or the config is corrected.

### Client-Side Secret Exposure

The app currently relies on browser-exposed `VITE_*` keys for services that would normally be server-side. Avoid expanding this pattern further.

### Frontend Concentration

`src/components/courtroom/CourtroomArena.jsx` contains a large amount of orchestration logic. When making changes:

- preserve reducer action semantics
- avoid breaking text-mode fallback behavior
- verify round transitions carefully

### Graceful Degradation Is Intentional

The codebase is built with multiple fallbacks:

- NIM unavailable -> mock AI response/scoring paths
- Qdrant unavailable -> no retrieval context
- Vapi unavailable -> text mode only

Do not remove these fallbacks casually.

## Change Guidance for Agents

### Safe Areas for Small Changes

- visual updates inside component-local JSX/CSS
- new static cases in `src/data/cases.js`
- verdict and landing-page UI polish
- reducer-safe additions to notifications or presentation behavior

### Areas Requiring Extra Care

- `GameContext.jsx`
- `CourtroomArena.jsx`
- `useVapi.js`
- `nimService.js`
- `qdrantService.js`
- `ingestCases.js`
- `vite.config.js`

### Before Editing AI/Infra Paths

Confirm:

- whether the change affects browser-only runtime or Node-only ingestion
- whether credentials are expected at build time or runtime
- whether the behavior must continue working without external services

### Verification Expectations

For UI/state changes:

- run `npm run build`
- run `npm run lint` if the touched area is lint-covered

For gameplay changes:

- verify start -> landing -> choose side -> loading -> courtroom -> verdict flow
- verify both text mode and voice-disabled behavior

For infra/service changes:

- validate environment variable assumptions explicitly
- do not assume Qdrant or NVIDIA connectivity without checking

## Recommended Next Structural Improvements

These are reasonable future steps, not current guarantees:

- move secret-bearing API calls behind a backend
- split `CourtroomArena.jsx` into smaller controller/hooks
- add real Vitest setup and reducer tests
- introduce typed contracts for scores, rounds, and case data
- add deployment manifests once hosting is chosen

## Bottom Line

Treat this project as a frontend-first prototype with real AI integrations, optional voice, optional RAG, and a separate ingestion script. Preserve graceful fallback behavior, be careful around the courtroom orchestration path, and assume infra is lightweight and mostly manual unless the user asks to formalize it.
