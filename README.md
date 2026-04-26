<div align="center">
  <h1>S U P R E M E</h1>
  <p><i>A voice-enabled, AI-powered legal debate simulator built on retrieval-augmented generation, real-time LLM inference, and landmark Indian Supreme Court jurisprudence.</i></p>

  ![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)
  ![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite)
  ![NVIDIA NIM](https://img.shields.io/badge/LLM-LLaMA%203.3%2070B-76B900?style=flat-square&logo=nvidia)
  ![Qdrant](https://img.shields.io/badge/Vector%20DB-Qdrant-FF6B6B?style=flat-square)
  ![Vapi](https://img.shields.io/badge/Voice-Vapi%20AI-8B5CF6?style=flat-square)
</div>

---

**Supreme** is a full-stack courtroom simulator that drops the user into landmark Indian Supreme Court proceedings. Arguments are adjudicated round-by-round by an AI bench, scored across four legal dimensions, and concluded with a structured verdict. The system supports both text-based and live voice interaction and is backed by a retrieval-augmented generation pipeline trained on real judgment texts from the Indian Kanoon corpus.

---

## Table of Contents

1. [Core Features](#-core-features)
2. [System Architecture](#-system-architecture)
3. [AI & LLM Pipeline](#-ai--llm-pipeline)
4. [FIRM — AI Lawyer Finder](#-firm--ai-lawyer-finder)
5. [Custom Case Builder](#-custom-case-builder)
6. [RAG & Data Ingestion](#-rag--data-ingestion-pipeline)
7. [Tech Stack](#-tech-stack)
8. [Project Structure](#-project-structure)
9. [Development Setup](#-development-setup)
10. [Operational Fallbacks](#-operational-fallbacks)
11. [Roadmap](#-roadmap)

---

## 🎯 Core Features

### Courtroom Simulator
The primary mode. The user selects a landmark case, chooses a side (Petitioner or Respondent), and engages in a structured multi-round oral argument against an AI opposing counsel. Each round is scored independently, conversation history is maintained for continuity, and the session concludes with an AI-authored verdict and detailed scorecard.

**User flow:**
```
Start → Select Case → Choose Side → Loading → Courtroom Arena (5 Rounds) → Verdict Screen
```

All page transitions are managed by a single `GameContext` reducer (`src/context/GameContext.jsx`) dispatching named actions (`SELECT_CASE`, `SELECT_SIDE`, `START_GAME`, `END_GAME`, etc.).

### Dual Input Modes
- **Text Mode** — Standard textarea input with keyboard submission
- **Voice Mode** — Live, real-time voice session via Vapi AI. Managed by `useVapi.js`, which handles the full lifecycle: call start/stop, transcript streaming, speaking detection, mute toggle, and error recovery

### Judicial Scoring Engine
Every user argument is evaluated by the LLM on four weighted dimensions:

| Dimension | What It Measures |
|:---|:---|
| `legalReasoning` | Logical structure, precision of legal argument |
| `useOfPrecedent` | Citation of case law, judgments, legal authorities |
| `persuasiveness` | Rhetorical effectiveness and advocacy clarity |
| `constitutionalValidity` | Correct invocation of constitutional articles |

Scores are returned as structured JSON from NVIDIA NIM. A local heuristic fallback activates if the API is unreachable.

### Tonal Analysis
Each argument is analysed for rhetorical tone (`tonalService.js`), producing dominant tone, formality rating, emotionality index, and actionable improvement tips. Results are surfaced in the courtroom sidebar as `ToneChip` components.

### Verdict Screen
On round completion, the system aggregates all `roundScores` and issues a final verdict: party ruling, margin of victory, and a per-dimension breakdown. Rendered by `VerdictScreen.jsx` with animated scales (`ScalesTipping.jsx`) and a formal `Scorecard.jsx`.

---

## 🏛️ System Architecture

```
┌──────────────────────────────────────────────────────────┐
│                        Browser (React 19)                │
│                                                          │
│  ┌─────────────┐   ┌──────────────┐   ┌──────────────┐  │
│  │  LandingPage│   │CourtroomArena│   │ VerdictScreen│  │
│  │  HeroSection│   │  (core loop) │   │   Scorecard  │  │
│  │  CaseGrid   │   │  ToneChip    │   │ ScalesTipping│  │
│  │  FirmPage   │   │  JudgeBench  │   └──────────────┘  │
│  │  CustomCase │   │  ArgumentInput│                     │
│  └──────┬──────┘   └──────┬───────┘                     │
│         │                 │                              │
│  ┌──────▼─────────────────▼──────────────────────────┐  │
│  │              GameContext (useReducer)              │  │
│  │  currentPage · selectedCase · arguments · scores  │  │
│  └──────┬─────────────────┬──────────────────────────┘  │
│         │                 │                              │
│  ┌──────▼──────┐  ┌───────▼──────┐  ┌───────────────┐  │
│  │ nimService  │  │qdrantService │  │  useVapi.js   │  │
│  │(LLM calls)  │  │(RAG search)  │  │(voice session)│  │
│  └──────┬──────┘  └───────┬──────┘  └──────┬────────┘  │
└─────────┼─────────────────┼────────────────┼────────────┘
          │                 │                │
   ┌──────▼──────┐  ┌───────▼──────┐  ┌─────▼──────┐
   │ NVIDIA NIM  │  │  Qdrant Cloud│  │   Vapi AI  │
   │llama-3.3-70b│  │   (4096-dim) │  │  (WebRTC)  │
   └─────────────┘  └──────────────┘  └────────────┘
```

**Routing** is state-driven, not URL-driven. `App.jsx` renders exactly one page component based on `state.currentPage`. Valid pages: `start` → `landing` → `firm` | `customCase` | `chooseSide` → `loading` → `courtroom` → `verdict`.

---

## 🤖 AI & LLM Pipeline

### Argument Generation (`nimService.generateAIArgument`)
Constructs a multi-turn prompt using:
- Case metadata (name, year, court, articles)
- Party identity (name, position, key arguments)
- Retrieval-augmented context from Qdrant (real judgment excerpts)
- Last 4 rounds of conversation history
- Difficulty-adaptive token budget (`easy`: 60 / `medium`: 100 / `hard`: 180 tokens)

The AI is system-prompted to respond in character as a senior Indian advocate — formal, precise, citing constitutional articles, never breaking character.

### Argument Scoring (`nimService.scoreArgumentWithAI`)
A separate LLM call with a judge-persona system prompt. Responds with a strict JSON object:
```json
{ "legalReasoning": 72, "useOfPrecedent": 45, "persuasiveness": 81, "constitutionalValidity": 68 }
```
A regex extractor handles model preamble. Falls back to `null` on parse failure, triggering local heuristic scoring.

### Model Config
```js
model:       'meta/llama-3.3-70b-instruct'
endpoint:    'https://integrate.api.nvidia.com/v1/chat/completions'
dev proxy:   '/api/nvidia/v1'  (Vite proxy → CORS-free in development)
temperature: 0.7 (generation) / 0.3 (scoring)
timeout:     30s (arguments) / 40s (lawyer ranking)
```

---

## ⚖️ FIRM — AI Lawyer Finder

A standalone feature accessible from the landing hero. Users describe their legal situation in natural language and receive a ranked list of the **6 best-suited Indian advocates**, AI-generated using the case context.

**Technical flow:**
1. User submits a free-text case description
2. `nimService.rankLawyersForCase(summary)` sends a structured prompt to LLaMA-3.3-70b
3. The model is instructed to respond with a strict JSON array of 6 objects
4. A regex extractor isolates the JSON array from any model preamble/suffix
5. Results render as animated advocate cards with specialty chips and case-specific rationale

**Response schema:**
```json
[
  {
    "rank": 1,
    "name": "Harish Salve",
    "designation": "Senior Advocate, Supreme Court of India",
    "specialties": ["Constitutional Law", "Arbitration", "International Law"],
    "court": "Supreme Court of India",
    "rationale": "..."
  }
]
```

**UX:** Input collapses after submission; results animate in staggered (80ms delay per card). Error states and a "New Query" reset are handled inline without navigation.

---

## 🔨 Custom Case Builder

Allows users to define and argue a fully custom legal scenario, bypassing the curated case library entirely. Accessible via the hero CTA — renders as a dedicated `customCase` page.

**Fields collected:**
- Case title, court/tribunal, year
- Case summary (injected into AI system prompt)
- Tags / legal areas (chip input)
- Constitutional articles cited
- Petitioner: name, legal position, key arguments (chip array)
- Respondent: name, legal position, key arguments (chip array)
- Optional: key evidence items, witness list (used to enrich AI context)

**On launch,** the collector builds a case object identical in schema to `src/data/cases.js` entries. `onSelectCase()` is dispatched, routing the user through the standard `chooseSide → loading → courtroom` flow. The AI system prompts adapt automatically to the custom case data.

---

## 📚 RAG & Data Ingestion Pipeline

### Runtime RAG (`qdrantService.js`)
At game start, the `caseId` is used to query Qdrant for relevant judgment chunks. The query is:
1. Embedded using `nvidia/nv-embed-v1` (4096-dimensional vectors)
2. Searched against the `courtroom_cases` Qdrant collection with a `must` filter on `case_id`
3. Top-k results (filtered by `section_type`: petitioner/respondent/precedent/reasoning) are concatenated into a `caseContext` string
4. Injected into the NIM system prompt for the current round

### Ingestion Pipeline (`services/ingestCases.js`)
A standalone Node script that builds the RAG corpus from scratch.

```
Indian Kanoon API → Raw HTML → Plain text → Semantic chunks
→ NVIDIA nv-embed-v1 → 4096-dim vectors → Qdrant upsert
```

**Chunking strategy:** Fixed-size windows with token overlap. Each chunk is classified by `section_type` (`petitioner_argument`, `respondent_argument`, `precedent_citation`, `constitutional_reasoning`, `final_order`) using rule-based heuristics.

```bash
npm run ingest   # ⚠ Recreates the courtroom_cases collection
```

**Qdrant collection spec:**
```
Collection: courtroom_cases
Vector size: 4096
Distance: Cosine
Payload fields: case_id, section_type, chunk_index, source_doc_id
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|:---|:---|
| **Frontend** | React 19 + Vite 5 |
| **State** | `useReducer` + React Context (`GameContext`) |
| **Styling** | Vanilla CSS with design tokens (no CSS framework) |
| **Voice** | `@vapi-ai/web` — WebRTC-based real-time voice |
| **LLM Inference** | NVIDIA NIM — `meta/llama-3.3-70b-instruct` |
| **Embeddings** | NVIDIA `nv-embed-v1` (4096-dim) |
| **Vector Search** | Qdrant Cloud |
| **Legal Corpus** | Indian Kanoon API |
| **Dev Proxy** | Vite `server.proxy` (NIM + Qdrant — CORS bypass) |
| **Testing** | Vitest + jsdom |

---

## 🗂️ Project Structure

<details>
<summary>Expand file tree</summary>

```
src/
├── App.jsx                        # State-driven page router
├── App.css
├── main.jsx
│
├── context/
│   └── GameContext.jsx            # Global reducer: pages, rounds, scores, tones
│
├── pages/
│   ├── StartPage.jsx              # Cinematic entry screen
│   ├── LandingPage.jsx            # Hero + case grid + archive
│   └── FirmPage.jsx               # FIRM — AI lawyer finder
│   └── FirmPage.css
│
├── components/
│   ├── landing/
│   │   ├── HeroSection.jsx        # CTAs: Select Case / FIRM / My Sessions / Build Case
│   │   ├── CaseGrid.jsx           # Curated case cards
│   │   ├── CaseCard.jsx
│   │   ├── CustomCaseBuilder.jsx  # Multi-field form → custom case object
│   │   ├── ChooseSide.jsx         # Petitioner / Respondent selection
│   │   └── ArchiveSection.jsx     # Past sessions
│   │
│   ├── courtroom/
│   │   ├── CourtroomArena.jsx     # Core: round loop, timers, scoring, voice toggle
│   │   ├── ArgumentInput.jsx      # Text + voice input
│   │   ├── ArgumentBubble.jsx     # Rendered argument in chat panel
│   │   ├── ChatArea.jsx           # Split-panel argument transcript
│   │   ├── JudgeBench.jsx         # AI judge presence + objection handling
│   │   ├── TopBar.jsx             # Round counter, timer, mode toggle
│   │   ├── TurnBanner.jsx         # Whose turn indicator
│   │   ├── ToneChip.jsx           # Rhetorical tone tag
│   │   └── VoiceWaveform.jsx      # Animated voice activity indicator
│   │
│   ├── verdict/
│   │   ├── VerdictScreen.jsx      # Final ruling display
│   │   ├── ScalesTipping.jsx      # Animated verdict scales
│   │   ├── Scorecard.jsx          # Per-round score breakdown
│   │   └── CaseSummary.jsx        # AI-generated case narrative
│   │
│   └── common/
│       ├── GavelLoader.jsx        # Loading screen between pages
│       └── ErrorBoundary.jsx
│
├── data/
│   ├── cases.js                   # Curated landmark case definitions
│   └── mockAI.js                  # Deterministic fallback responses
│
├── hooks/
│   └── useVapi.js                 # Vapi session lifecycle (start/stop/transcript/mute)
│
└── services/
    ├── nimService.js              # generateAIArgument · scoreArgumentWithAI · rankLawyersForCase
    ├── qdrantService.js           # RAG: embed query → vector search → context assembly
    ├── tonalService.js            # Tone analysis on user arguments
    ├── sessionStorage.js          # LocalStorage-based session persistence
    └── ingestCases.js             # Offline corpus ingestion pipeline
```
</details>

---

## 💻 Development Setup

### Environment Variables

```env
# Voice (Vapi)
VITE_VAPI_PUBLIC_KEY=your-vapi-public-key
VITE_VAPI_ASSISTANT_ID=your-vapi-assistant-id

# LLM & Embeddings (NVIDIA NIM)
VITE_NVIDIA_API_KEY=your-nvidia-api-key

# Vector DB (Qdrant)
VITE_QDRANT_URL=https://your-cluster.qdrant.io
VITE_QDRANT_API_KEY=your-qdrant-api-key

# Legal Corpus (Indian Kanoon)
VITE_INDIANKANOON_API_KEY=your-indiankanoon-api-key
```

> **Security:** `VITE_` prefixed variables are bundled into the browser runtime. Never commit real keys. If exposed, rotate immediately.

### Dev Proxy

Both external APIs are routed via Vite's `server.proxy` during development to avoid CORS:

```
/api/nvidia/*  →  https://integrate.api.nvidia.com/*
/api/qdrant/*  →  https://your-cluster.qdrant.io/*
```

Production deployments require a backend proxy or serverless functions to keep API keys out of the client bundle.

### Scripts

```bash
npm install     # Install dependencies
npm run dev     # Start Vite dev server (http://localhost:5173)
npm run build   # Production bundle
npm run preview # Serve production build locally
npm run lint    # ESLint
npm run ingest  # ⚠ Rebuild Qdrant corpus (destructive)
```

---

## 🛡️ Operational Fallbacks

| Failure Mode | Fallback Behaviour |
|:---|:---|
| Vapi keys missing / WebRTC blocked | Voice UI hidden; text mode fully functional |
| NVIDIA NIM unreachable | `mockAI.js` deterministic responses; local heuristic scoring |
| Qdrant empty or unreachable | Courtroom continues without RAG; prompts use static case metadata only |
| LLM returns malformed JSON | Regex extraction attempted; `null` triggers heuristic score |
| FIRM API failure | Inline error message; retry available without page reload |

---

## 🗺️ Roadmap

- [ ] Migrate API calls to a thin serverless backend to eliminate browser API key exposure
- [ ] Replace `mockAI.js` with a rules-based offline inference engine
- [ ] Add multilingual argument support (Hindi, Tamil, Telugu court proceedings)
- [ ] Expand case library to include High Court, NCLAT, and constitutional bench cases
- [ ] Integrate real lawyer directory data for FIRM instead of LLM-generated profiles
- [ ] Implement automated Vitest coverage for reducer transitions, debate round logic, and scoring pipelines
- [ ] Add telemetry: LLM latency, argument quality distribution, win-rate parity across sides
