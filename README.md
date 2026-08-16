# Verdict AI

Verdict AI runs a council of AI models to help analyze questions that aren't obvious one-liners. Multiple LLMs answer in parallel, compare viewpoints, and optionally vote or debate to produce a synthesized verdict.

This repository contains the web frontend (Vite + React + TypeScript) and an optional Python backend (FastAPI) used for development and self-hosted analytics. The app is designed so you run it locally and keep your API keys and conversations on-device.

Key ideas

- Multiple deliberation modes: Parallel answers, Trial (peer voting + Judge), Consensus (multi-round debate with a Mediator).
- BYOK and local-first storage: your keys and conversations stay in your browser unless you export or run a sync service yourself.
- Mobile-first PWA UI, static-first deploys (GitHub Pages, any CDN), and provider adapters (OpenAI, Anthropic, Google, Groq, OpenRouter, optional Ollama).

Quick start (frontend)

Prereqs: Node 18+ (or as pinned in `.nvmrc`), npm

Install and run the dev server:

```bash
npm install
npm run dev-secure
```

Open https://localhost:5173 in your browser. Paste provider API keys in Settings → Keys (the app does not read keys from the repo or env files).

Optional backend (development only)

The `backend/` folder contains a small FastAPI app used for dev helpers and analytics when you want a self-hosted collector. It's optional; the client is fully functional without it.

Run the backend (Python 3.10+):

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r backend/requirements.txt
uvicorn backend.app.main:app --reload --port 8000
```

Providers & Ollama

- Cloud providers: OpenAI, Anthropic, Google, Groq, OpenRouter (one-key-many-vendors).
- `Ollama` is optional and runs locally; enable it in Settings → Keys only after installing Ollama locally.

Security & privacy

- Keys: stored in browser `localStorage` per-device. Only the provider you call sees them.
- Conversations and settings: stored in IndexedDB / `localStorage` on your device. Export/import is available for manual backups.
- The app ships with redaction and sanitization for error paths and model output; see `SECURITY.md` for the threat model and details.

Repository layout (top-level)

- `src/` — frontend source (React + TypeScript)
- `public/` — static assets and demo screenshots
- `backend/` — optional FastAPI demo/analytics server
- `scripts/` — dev tooling and helper scripts

Development notes

- The app is static-first; all API keys are supplied at runtime via the UI.
- For secure local dev with mobile testing, `npm run dev-secure` starts Vite with HTTPS.

Contributing

Contributions welcome. Please open issues or PRs. Work that changes the hosted instance should include security and privacy rationale.

License

This project is licensed under the GNU AGPL-3.0 — see `LICENSE` for details.

Thanks

Inspired by the council and deliberation patterns popularized by others in the LLM tooling ecosystem. If you run this locally, remember: model outputs can be confidently wrong — treat them as decision support, not authoritative advice.
