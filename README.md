# CourtRoom AI (Supreme)

CourtRoom AI is an interactive, voice-enabled legal debate simulator focused on landmark Indian Supreme Court cases.

You pick a case, choose a side (petitioner/respondent), argue across multiple rounds, and receive scored judicial feedback with a final verdict.

The app combines:
- a cinematic React frontend,
- live voice interaction through Vapi,
- AI argument generation/scoring through NVIDIA NIM,
- and retrieval-augmented context from Qdrant (ingested from Indian Kanoon judgments).

## What this project does

At a high level, the product simulates a courtroom battle:

1. You enter the experience and browse landmark cases.
2. You choose which side to represent.
3. The opposing side is played by AI (text and/or voice).
4. Each round is scored on legal dimensions.
5. After all rounds, a verdict and score breakdown are shown.

Core goals:
- Make legal learning interactive and strategic.
- Ground AI responses in real legal context when available.
- Support both voice-first and text fallback gameplay.

## Tech stack

- Frontend: React 19 + Vite
- State management: React Context + Reducer (`GameContext`)
- Voice runtime: `@vapi-ai/web`
- LLM generation/scoring: NVIDIA NIM (OpenAI-compatible API)
- Vector search: Qdrant Cloud
- Embeddings: NVIDIA `nv-embed-v1`
- Corpus source: Indian Kanoon API (via ingestion script)

## Product flow (screen-by-screen)

Main page states are managed in `src/context/GameContext.jsx`:

- `start` -> Branded entry screen
- `landing` -> Case browsing and selection
- `chooseSide` -> Pick petitioner/respondent + difficulty
- `loading` -> Short transition before courtroom
- `courtroom` -> Main debate arena (voice/text rounds)
- `verdict` -> Final result, scorecard, case summary

Primary orchestration:
- `src/App.jsx` handles page routing based on global game state.
- `src/components/courtroom/CourtroomArena.jsx` runs round logic, AI responses, scoring, timers, and voice controls.

## How AI works in this app

### 1) Text mode argument generation

In text mode, `src/services/nimService.js` calls NVIDIA NIM to generate opposing counsel responses.

- Model: `meta/llama-3.3-70b-instruct`
- Prompt includes:
  - selected case metadata,
  - selected side and opposing party,
  - current round,
  - optional retrieved legal context from Qdrant,
  - recent conversation history.

If NIM fails or is unavailable, it falls back to curated mock responses in `src/data/mockAI.js`.

### 2) Argument scoring

User arguments are scored on four dimensions:
- `legalReasoning`
- `useOfPrecedent`
- `persuasiveness`
- `constitutionalValidity`

Scoring first attempts NIM-based structured JSON scoring, then falls back to local heuristic scoring in `src/data/mockAI.js`.

### 3) Voice mode

`src/hooks/useVapi.js` manages Vapi session lifecycle and events:
- call start/stop,
- user and assistant transcripts,
- speaking detection,
- mute behavior,
- connection/error state.

Voice is integrated into courtroom flow from `CourtroomArena` and can be toggled off to use text mode.

### 4) Retrieval-Augmented Generation (RAG)

`src/services/qdrantService.js`:
- creates embeddings for queries via NVIDIA embeddings API,
- searches Qdrant collection `courtroom_cases`,
- filters by case and legal section type,
- formats results into prompt-ready context.

This improves relevance by injecting case-grounded legal excerpts into prompts.

## Legal data ingestion pipeline

`src/services/ingestCases.js` is a standalone Node script that builds the Qdrant corpus.

Pipeline:
1. Fetch judgment text from Indian Kanoon by known doc IDs.
2. Clean HTML -> plain text.
3. Chunk text into semantic windows (target token sizes + overlap).
4. Classify chunks (petitioner/respondent arguments, precedent, constitutional article, court reasoning, final order).
5. Generate embeddings using NVIDIA `nv-embed-v1`.
6. Upsert vectors + metadata into Qdrant.

Run it with:

```bash
npm run ingest
```

Important: the ingestion script recreates the target collection before re-populating it.

## Project structure

```text
src/
  App.jsx
  main.jsx
  context/
    GameContext.jsx
  pages/
    StartPage.jsx
    LandingPage.jsx
  components/
    landing/
    courtroom/
    verdict/
    common/
  data/
    cases.js
    mockAI.js
  hooks/
    useVapi.js
  services/
    nimService.js
    qdrantService.js
    ingestCases.js
```

## Environment variables

Create `.env` in the project root.

Use this template:

```bash
VITE_VAPI_PUBLIC_KEY=your-vapi-public-key
VITE_VAPI_ASSISTANT_ID=your-vapi-assistant-id

VITE_NVIDIA_API_KEY=your-nvidia-api-key

VITE_QDRANT_URL=https://your-qdrant-cluster-url
VITE_QDRANT_API_KEY=your-qdrant-api-key

VITE_INDIANKANOON_API_KEY=your-indiankanoon-api-key
```

Notes:
- `VITE_` prefixes are intentionally used because values are read in browser/runtime code.
- Do not commit real API keys.
- If Qdrant/NVIDIA keys are missing, the app still runs with partial fallback behavior (limited/no RAG, mock fallback for generation).

## Development setup

Install dependencies:

```bash
npm install
```

Start dev server:

```bash
npm run dev
```

Build production bundle:

```bash
npm run build
```

Preview production build locally:

```bash
npm run preview
```

Lint:

```bash
npm run lint
```

## Scripts

From `package.json`:

- `npm run dev` - Start Vite dev server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run ingest` - Ingest judgment corpus into Qdrant

## Runtime behavior and fallbacks

- If Vapi credentials are missing, voice UI is unavailable but text mode remains usable.
- If NVIDIA NIM is unavailable, AI text generation/scoring falls back to mock logic.
- If Qdrant is unavailable or empty, gameplay continues without retrieved context.

This layered fallback design keeps the core experience functional during partial outages or local setup gaps.

## Known operational requirements

- Qdrant collection name expected by runtime: `courtroom_cases`
- Embedding model expected: `nvidia/nv-embed-v1` (vector size 4096)
- NIM chat endpoint expected to be reachable via Vite proxy in dev (`/api/nvidia/*`)
- Qdrant expected to be reachable via Vite proxy in dev (`/api/qdrant/*`)

Proxy config is defined in `vite.config.js`.

## Security note

If credentials were ever committed accidentally, rotate all exposed keys immediately (Vapi, NVIDIA, Qdrant, Indian Kanoon) and replace them with new values in local `.env`.

## Roadmap ideas (optional)

- Replace mock fallback with a local deterministic rules engine for offline mode.
- Add automated tests for reducer transitions and courtroom round logic.
- Add telemetry dashboards for response quality, latency, and win-rate balance.
- Support additional case families and multilingual arguments.

## License

No license file is currently defined in this repository.
