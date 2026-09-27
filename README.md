# Cyclewise | AI-Powered Trusted SME Exchange Coordinator

> **Turn what your business has into what another business needs.**  
> Cyclewise coordinates non-monetary multi-business exchanges of stock, services, and capacity across Kenyan SMEs, reducing operational downtime and eliminating the need for predatory emergency cash loans.

---

## Architecture Overview

```
                      +---------------------------------------+
                      |   Kenyan SME User (Mobile 360x800)    |
                      |  English, Kiswahili, mixed Swahili    |
                      +-------------------+-------------------+
                                          |
                                          v
                      +---------------------------------------+
                      |   AI Studio Server-Side Gateway       |
                      |   Express + Vite Middlewares (Port 3000)
                      +-------------------+-------------------+
                                          |
               +--------------------------+--------------------------+
               |                                                     |
               v                                                     v
+-----------------------------+                       +-----------------------------+
|   Server-Side AI Agent      |                       | Deterministic Graph Engine  |
|  - Google Gemini API        |                       |  - Directed Edge Builder    |
|  - Language Detection       |                       |  - Bounded DFS (2-4 Nodes)  |
|  - Structured Extraction    |                       |  - Rotation Deduplication   |
|  - Grounded Explanations    |                       |  - Multi-Factor Scoring     |
|  - Prompt Injection Defense |                       |  - Latency & Status Metrics |
+--------------+--------------+                       +--------------+--------------+
               |                                                     |
               +--------------------------+--------------------------+
                                          |
                                          v
                      +---------------------------------------+
                      |   Human-in-the-Loop Approval Gate     |
                      |   - Unanimous participant commitment  |
                      |   - Verifiable trust evidence         |
                      |   - No automatic lending or contracts |
                      +-------------------+-------------------+
                                          |
                                          v
                      +---------------------------------------+
                      |   Provider-Agnostic Adapters          |
                      |   - SMS / Notifications (Mock Adapter)|
                      |   - Identity Verification (Mock)      |
                      |   - Logistics Dispatch (Mock)         |
                      +---------------------------------------+
```

---

## Hackathon Compliance

| Rubric Criterion | Weight | Working Feature & Proof in Cyclewise | Test & Validation Command |
| :--- | :--- | :--- | :--- |
| **Problem & Practical User Value** | **20 pts** | Solves liquidity blockages without cash loans. Seeded Amina Foods 4-business rescue cycle unlocks **KES 72,000** in idle stock and delivery capacity. Concrete before/after scenario: Amina gets packaging from GreenPack without a cash overdraft. Includes interactive `ValueUnlockedSummaryCard` with dynamic loan interest savings simulation (KES 10,800–21,600 saved) and contribution bar chart. | Live in UI: `Matches` tab + `ValueUnlockedSummaryCard` + `Network Overview` |
| **Functional Execution** | **20 pts** | Complete live flow: Natural-language request &rarr; Guardrail verification &rarr; Structured extraction &rarr; Deterministic DFS cycle search &rarr; Evidence inspection &rarr; Human commit &rarr; Lifecycle tracking. | Endpoint: `POST /api/v1/matches/search`<br>Endpoint: `POST /api/v1/requests/validate` |
| **Quality of AI Use** | **20 pts** | Gemini processes English, Kiswahili, and Sheng intent. Clear domain boundary: language model interprets and explains; deterministic engine validates quantities, finds closed cycles, and tracks state. Prompt injection defense blocks adversarial directives. | `prompts/exchange_coordinator.md`<br>`src/agent/guardrails.ts` |
| **Testing & Reliability** | **15 pts** | 10 automated unit tests verifying 4-way cycles, 2-way cycles, rotation deduplication, broken-chain detection, schema validation, and <50ms execution latency. Seeded deterministic fallback ensures 100% demo availability. | Run: `npm test`<br>(or `npx tsx src/tests/m0-tests.ts`) |
| **Experience & 90-Second Demo** | **15 pts** | Designed mobile-first at 360x800 with bottom navigation. Real-time DFS telemetry (elapsed ms, node count, edge count, cycles examined). Interactive scenario buttons for 4-way rescue vs broken chain. | Runbook included below; accessible in UI via `Matches` tab |
| **Responsible AI & Data** | **10 pts** | Synthetic Nairobi SME dataset; transparent evidence ledger (completed exchanges, late deliveries, confirmations); **zero black-box credit scores**; no automatic contract generation; human consent strictly required. | `src/components/EvidencePanel.tsx`<br>`src/engine/fixtures.ts` |

---

## 90-Second Demo Runbook

1. **00:00 - 00:15 (The SME Bottleneck):**  
   Open the mobile view (360x800). Notice Amina Foods is blocked because they need packaging for wholesale cooking oil, but lack immediate cash liquidity.
2. **00:15 - 00:35 (Natural Language Request):**  
   Tap **Tell Cyclewise**. Click the mixed Swahili-English prompt chip:  
   `"Nahitaji cartons 20 za cooking oil by Friday Nairobi Eastleigh. Naweza kusaidia na quarterly bookkeeping wiki ijayo value about 18k."`  
   Click **Extract Intent**. Review the structured JSON extraction with detected language and confidence.
3. **00:35 - 00:55 (Real-Time Graph Search):**  
   Tap **Find Exchange Matches**. Click **Run Real-Time Matching**.  
   Observe the live progress phases (`preparing` &rarr; `building_graph` &rarr; `searching_cycles` &rarr; `ranking` &rarr; `complete`) and measured latency (<20ms).
4. **00:55 - 01:15 (The 4-Way Rescue Cycle):**  
   Inspect the closed loop:  
   **Amina Foods** (Cooking Oil) &rarr; **LedgerPro** (Bookkeeping) &rarr; **SwiftMove** (Logistics) &rarr; **GreenPack** (Packaging) &rarr; **Amina Foods**.  
   Review the multi-factor score breakdown (Compatibility, Quantity, Deadline, Location, Trust, Balance).
5. **01:15 - 01:25 (Failure & Broken Chain Awareness):**  
   Click **2. Broken Chain** in the test panel. SwiftMove's courier edge is disabled. Observe how the 4-way cycle immediately disappears, proving the engine executes deterministic graph search and never hallucinates completion.
6. **01:25 - 01:30 (Commit & Value Statement):**  
   Click **Reset Fixture**, review the proposal, and simulate participant commitment. KES 72,000 in trade value unlocked without emergency debt!

---

## Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Run automated test suite (10 unit tests)
npm test

# 3. Start full-stack development server (Express API + Vite React UI on port 3000)
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## API Endpoints (Version 1)

- `GET /api/v1/health`: Provider integration health and model configuration.
- `GET /api/v1/network`: Seeded Kenyan SME network and unlocked value.
- `POST /api/v1/matches/search`: Deterministic DFS graph search returning cycles and metadata.
- `POST /api/v1/engine/test`: Runs test fixture with live millisecond timing.
- `POST /api/v1/engine/toggle-edge`: Enables/disables edges for broken-chain testing.
- `POST /api/v1/engine/reset`: Resets fixture to initial state.
- `POST /api/v1/requests/validate`: Guardrails & schema validation for SME requests.

---

## Transparent AI & Ethical Disclosure

- **Model:** Google Gemini (`gemini-3.8-flash`) accessed via `@google/genai` server-side SDK.
- **AI Task:** Multilingual intent extraction, semantic trade term normalization, and grounded explanations.
- **Deterministic Work:** Edge generation, bounded cycle DFS, constraints validation, multi-factor scoring, and state machine transitions.
- **Data:** 100% synthetic Kenyan SME business profiles. No real financial documents or private data used.
- **Human Oversight:** Zero automated loan decisions or legally binding contracts. Every exchange requires explicit human consent from all participants.
