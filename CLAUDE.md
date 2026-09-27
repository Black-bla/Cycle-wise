# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Cyclewise is a hackathon project: an AI-coordinated non-monetary exchange platform for Kenyan SMEs. It converts natural-language (English/Kiswahili/Sheng) need-and-offer messages into structured data, then uses a deterministic graph engine to find closed multi-business barter cycles (e.g. a 4-way loop where A gives to B gives to C gives to D gives back to A), so businesses can trade surplus stock/services/capacity instead of taking predatory cash loans.

## Commands

```bash
npm run dev       # Start full-stack dev server (Express + Vite middleware) on http://localhost:3000
npm run build      # vite build -> dist/
npm run preview    # Preview production build
npm test           # Runs src/tests/m0-tests.ts via tsx (assertion-based console test suite, not a test runner/framework)
npm run lint        # tsc --noEmit
npm run clean       # rm -rf dist server.js
```

To run a single test, there is no test filtering — `src/tests/m0-tests.ts` is a flat script of sequential `assert()` calls run top-to-bottom against a fresh `DeterministicGraphEngine` instance. To isolate one check, comment out or temporarily edit the script (or run `npx tsx` against a scratch file that imports the same engine/guardrail/schema modules).

There is no separate lint config beyond `tsc --noEmit`; there is no ESLint/Prettier setup in this repo.

## Environment

Copy `.env.example` and set any of `GEMINI_API_KEY`, `NVIDIA_API_KEY`, `ANTHROPIC_API_KEY` (all optional — see fallback cascade below). `dotenv.config()` is called at the top of `server.ts`.

## Architecture

Single Express server (`server.ts`, port 3000) that both serves the Vite/React SPA (dev: Vite middleware in middleware mode; prod: static `dist/`) and exposes a versioned JSON API under `/api/v1/*`. There is no separate backend process/port.

### Two-track "AI explains, deterministic engine decides" design

This split is the core architectural invariant of the codebase — don't blur it:

- **`src/engine/graphEngine.ts`** (`DeterministicGraphEngine`) — pure deterministic logic, no LLM calls. Builds directed compatibility edges between SMEs (`buildEdges()`, plus `inferEdgesForNewSme()` for dynamically onboarded SMEs using keyword matching against need/offer text), then runs a bounded DFS (`findCycles`, cycle length 2–4) to find closed exchange loops, deduplicates rotations of the same cycle (`canonicalizeCycles`, via lexicographically-smallest-start-node normalization), and ranks results via `src/engine/scoring.ts`'s weighted multi-factor score (compatibility 30%, quantity_fit 20%, deadline_fit 15%, location_fit 15%, trust_evidence 10%, value_balance 10%). Edges can be toggled on/off (`disableEdge`/`enableEdge`) to simulate broken supply chains for demo/testing. This engine never hallucinates — it only returns cycles that are actually closed given the current edge set.
- **`src/agent/geminiAgent.ts`** (`CyclewiseAgent`) — orchestrates the LLM-backed steps and always operates *on top of* graph-engine output, never in place of it. Its `orchestrate()` method runs a fixed 6-step pipeline: (1) `extractNeedOffer` — NL → structured JSON via the model router, (2) deterministic schema/business-rule validation (`src/agent/schemas.ts`), (3) `graphEngine.findCycles()`, (4) trust-evidence lookup against seeded `trust_events`, (5) `explainMatch` — grounded natural-language explanation of the *already-found* cycle (the prompt strictly forbids inventing businesses/loans/values not in the cycle data), (6) a no-op "Human Approval Gate" step — the pipeline always stops at `Proposed` status; nothing auto-commits. `answerInquiry` and `substituteMatch` are separate grounded Q&A / re-matching tools called from the UI, not part of `orchestrate()`.
- **`src/agent/multiModelRouter.ts`** (`MultiModelRouter`) — model-agnostic structured-generation cascade: tries NVIDIA NIM (Nemotron) first if `NVIDIA_API_KEY` is set, then Google Gemini (`gemini-3.8-flash` → `gemini-3.1-flash-lite` → `gemini-3.1-pro-preview` → `gemini-flash-latest`) via `@google/genai`, then Anthropic Claude (`claude-sonnet-5` by default, override with `ANTHROPIC_MODEL`) via a raw `fetch` against the Messages API (no SDK dependency, same pattern as the NVIDIA call), and if every provider fails/is unconfigured, falls back to a local deterministic heuristic extractor (`CyclewiseAgent.deterministicFallbackExtract`) so the app still functions with zero API keys configured. All three provider keys are read from `process.env` at request time only — none are required to install dependencies or run `npm run build`. Every call records a `cascade_trail` describing which providers were attempted and why they failed.
- **`src/agent/guardrails.ts`** — regex-based prompt-injection and prohibited-financial-claim detection, applied to user input before it reaches the model (`guardrailCheckInput`) and can be applied to model output (`guardrailCheckOutput`). Also defines a least-privilege per-stage tool allowlist (`STAGE_TOOL_ALLOWLIST`) as a design intent, not currently enforced by middleware.
- **`src/integrations/providerAdapters.ts`** — provider-agnostic interfaces (`NotificationProvider`, `IdentityProvider`, `LogisticsProvider`) with mock implementations wired through `ProviderRegistry`; real SMS/identity/logistics integrations would implement these interfaces and swap into the registry.

### Data flow for a request

`SME message` → guardrail check → `MultiModelRouter.generateStructuredContent` (cascade) → `StructuredExtraction` (`src/agent/types.ts`) → schema/business validation → `DeterministicGraphEngine.findCycles` → ranked `ExchangeCycle[]` → grounded `explainMatch` → returned to frontend as `OrchestrationResult`, always ending at proposal status `Proposed` / `Clarification_Required` / `No_Match_Found` pending human commitment.

### Seeded fixture

`src/engine/fixtures.ts` holds the demo dataset: `SEEDED_SMES` (Amina Foods, LedgerPro, SwiftMove, GreenPack, PrintLab, Jirani Studio) whose need/offer/location/trust_events are specifically crafted to close a 4-way rescue cycle (Amina → LedgerPro → SwiftMove → GreenPack → Amina) and a direct 2-way cycle (PrintLab ↔ Jirani Studio). `DeterministicGraphEngine.buildEdges()`'s hardcoded `candidates` array encodes these exact relationships; `resetFixture()` restores this baseline. When changing SME data or edges, keep these two demo cycles intact unless intentionally reworking the demo script in `README.md`.

### Frontend

`src/App.tsx` is the single-page React app entry (mobile-first, 360×800 target) composed of feature components in `src/components/` (e.g. `TellCyclewiseSection` for NL input, `GraphTestPanel` for live DFS telemetry/edge toggling, `AgentCommandCenterModal`/`AgentInquiryModal` for orchestration/Q&A, `ExchangesTracker`, `EvidencePanel`, `ValueUnlockedSummaryCard`). No client-side routing library or state management library — state lives in component state, and the frontend talks to the `/api/v1/*` endpoints directly via `fetch`.

### Path alias

`@/*` maps to the repo root (see `tsconfig.json` and `vite.config.ts`), not `src/`.

## Package manager

Both `package-lock.json` and `pnpm-lock.yaml`/`pnpm-workspace.yaml` are present. Confirm with the user which one is authoritative before running installs — don't assume.
