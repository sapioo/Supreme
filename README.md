<div align="center">
  <h1>S U P R E M E</h1>
  <p><i>An interactive, voice-enabled legal debate simulator focused on landmark Indian Supreme Court cases.</i></p>
</div>

---

**CourtRoom AI (Supreme)** drops you into the highest court of the land. Pick a landmark case, choose your side (petitioner or respondent), argue your stance across multiple rounds, and receive scored judicial feedback and a final verdict from an AI bench. 

Designed for both text and live voice interaction, Supreme combines a cinematic React frontend with state-of-the-art LLMs and real-time retrieval-augmented context.

**CourtRoom AI (Supreme)** drops you into the highest court of the land. Pick a landmark case, choose your side (petitioner or respondent), argue your stance across multiple rounds, and receive scored judicial feedback and a final verdict from an AI bench.

Designed for both text and live voice interaction, Supreme combines a cinematic React frontend with state-of-the-art LLMs and real-time retrieval-augmented context.

## 🚀 The Experience

1.  **Enter the Court:** Browse a curated list of landmark legal cases.
2.  **Take a Stand:** Choose to represent the Petitioner or Respondent.
3.  **The Debate:** Face off against an opposing side powered by AI (via text or live voice).
4.  **Judicial Scrutiny:** Each argument is rigorously scored on precise legal dimensions.
5.  **The Verdict:** Conclude the trial to receive a final verdict, scorecard, and case breakdown.

## 🛠️ Tech Stack

| Component | Technology / Service |
| :--- | :--- |
| **Frontend UI** | React 19 + Vite |
| **State Management** | React Context + Reducer (`GameContext`) |
| **Voice Runtime** | `@vapi-ai/web` (Vapi) |
| **LLM Generation** | NVIDIA NIM (`meta/llama-3.3-70b-instruct`) |
| **Vector Search** | Qdrant Cloud |
| **Embeddings** | NVIDIA `nv-embed-v1` |
| **Corpus Source** | Indian Kanoon API (via custom ingest pipeline) |

## 🧠 AI Architecture

Supreme operates on a layered, fallback-resilient architecture to ensure uninterrupted courtroom battles.

### 1\. Argument Generation (Text & Voice)

Powered by **NVIDIA NIM** (`meta/llama-3.3-70b-instruct`). The prompt is dynamically constructed using selected case metadata, the opposing party's stance, current round context, recent conversation history, and RAG context.

  * *Fallback:* Curated mock responses located in `src/data/mockAI.js`.

### 2\. Live Voice Mode

Managed via `src/hooks/useVapi.js`. It handles the full Vapi session lifecycle: call start/stop, user/assistant transcripts, speaking detection, and mute behaviors. Voice can be toggled seamlessly to text mode inside the `CourtroomArena`.

### 3\. Judicial Scoring

User arguments are evaluated on four distinct dimensions:

  * `legalReasoning`
  * `useOfPrecedent`
  * `persuasiveness`
  * `constitutionalValidity`

*Scoring defaults to structured JSON output from NVIDIA NIM, falling back to local heuristic scoring if the API is unreachable.*

### 4\. Retrieval-Augmented Generation (RAG)

Managed via `src/services/qdrantService.js`. Real judgment texts are injected into prompts to ground the AI in actual jurisprudence. Queries are embedded via NVIDIA API, searched against the Qdrant `courtroom_cases` collection, and filtered by case/section type.

## ⚖️ Legal Data Ingestion Pipeline

A standalone Node script builds the RAG corpus by extracting and processing data from Indian Kanoon.

**The Pipeline:**

1.  Fetch judgment text from Indian Kanoon via known doc IDs.
2.  Sanitize HTML into plain text.
3.  Chunk text into semantic windows (target token sizes + overlap).
4.  Classify chunks (petitioner/respondent arguments, precedent, articles, reasoning, final order).
5.  Generate embeddings using NVIDIA `nv-embed-v1`.
6.  Upsert vectors and metadata into Qdrant.

To run the pipeline (Warning: recreates the target collection):

```bash
npm run ingest
```

## 💻 Development Setup

### Environment Variables

Create a `.env` file in the project root:

```env
# Voice (Vapi)
VITE_VAPI_PUBLIC_KEY=your-vapi-public-key
VITE_VAPI_ASSISTANT_ID=your-vapi-assistant-id

# LLM & Embeddings (NVIDIA)
VITE_NVIDIA_API_KEY=your-nvidia-api-key

# Vector DB (Qdrant)
VITE_QDRANT_URL=https://your-qdrant-cluster-url
VITE_QDRANT_API_KEY=your-qdrant-api-key

# Data Source (Indian Kanoon)
VITE_INDIANKANOON_API_KEY=your-indiankanoon-api-key
```

> **Security Note:** `VITE_` prefixes are exposed to the browser runtime. Never commit real API keys to version control. If exposed, rotate them immediately.

### Installation & Scripts

```bash
npm install     # Install dependencies
npm run dev     # Start Vite dev server
npm run build   # Build for production
npm run preview # Preview production build locally
npm run lint    # Run ESLint
npm run ingest  # Ingest judgment corpus into Qdrant
```

## 🏗️ Project Structure

\<details\>
\<summary\>Click to expand file tree\</summary\>

```text
src/
 ├── App.jsx                 # Global routing based on game state
 ├── main.jsx
 ├── context/
 │   └── GameContext.jsx     # State orchestration (start, landing, chooseSide, courtroom, verdict)
 ├── pages/
 │   ├── StartPage.jsx
 │   └── LandingPage.jsx
 ├── components/
 │   ├── landing/
 │   ├── courtroom/          # Contains CourtroomArena.jsx (core round/timer/voice logic)
 │   ├── verdict/
 │   └── common/
 ├── data/
 │   ├── cases.js
 │   └── mockAI.js           # Fallback local deterministic AI
 ├── hooks/
 │   └── useVapi.js          # Voice lifecycle management
 └── services/
     ├── nimService.js       # NVIDIA NIM LLM logic
     ├── qdrantService.js    # RAG search logic
     └── ingestCases.js      # Data pipeline script
```

\</details\>

## 🛡️ Operational Requirements & Fallbacks

  * **Graceful Degradation:** \* Missing Vapi keys? The app gracefully disables voice UI; text mode remains 100% functional.
      * NVIDIA NIM down? Falls back to local deterministic mock logic.
      * Qdrant empty/unreachable? Gameplay continues without RAG context.
  * **Vector Specs:** Requires `nvidia/nv-embed-v1` (vector size 4096).
  * **Collection Name:** Qdrant collection must be named `courtroom_cases`.
  * **Proxies:** Both NIM (`/api/nvidia/*`) and Qdrant (`/api/qdrant/*`) expect to be reachable via the Vite proxy defined in `vite.config.js` during development.

## 🗺️ Roadmap

  - [ ] Replace mock fallback with a local, offline deterministic rules engine.
  - [ ] Implement automated testing for reducer transitions and debate round logic.
  - [ ] Integrate telemetry dashboards for response quality, latency, and user win-rate balance.
  - [ ] Expand case library to include international case families and multilingual argument support.
