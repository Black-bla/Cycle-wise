import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { DeterministicGraphEngine } from './src/engine/graphEngine';
import { SEEDED_SMES } from './src/engine/fixtures';
import { guardrailCheckInput } from './src/agent/guardrails';
import { validateExtractionSchema, validateBusinessRules } from './src/agent/schemas';
import { ProviderRegistry } from './src/integrations/providerAdapters';
import { CyclewiseAgent } from './src/agent/geminiAgent';
import { SMEProfile } from './src/agent/types';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

app.use(express.json());

const graphEngine = new DeterministicGraphEngine();
const agent = new CyclewiseAgent(graphEngine);

const smesMap = new Map<string, SMEProfile>();
SEEDED_SMES.forEach((s) => smesMap.set(s.id, s));

// -------------------------------------------------------------
// Versioned API Contracts (v1)
// -------------------------------------------------------------

// 1. Health & Integration Status
app.get('/api/v1/health', async (_req, res) => {
  const notifHealth = await ProviderRegistry.getNotification().healthCheck();
  const idHealth = await ProviderRegistry.getIdentity().healthCheck();
  const paymentProvider = ProviderRegistry.getPayment();
  const paymentHealth = await paymentProvider.healthCheck();

  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    model: 'gemini-3.8-flash',
    providers: {
      notification: notifHealth,
      identity: idHealth,
      logistics: { status: 'healthy', provider: 'MockSwiftCouriers' },
      payment: { ...paymentHealth, provider: paymentProvider.name, is_live: paymentProvider.isLive },
    },
    demo_mode: true,
  });
});

// 2. Network Overview
app.get('/api/v1/network', (_req, res) => {
  const allSmes = Array.from(smesMap.values());
  const totalValue = 18000 + 18500 + 17500 + 18000;
  res.json({
    smes: allSmes,
    active_exchanges_count: 1,
    completed_exchanges_count: 8,
    total_value_unlocked_kes: totalValue,
    node_count: allSmes.length,
  });
});

// 2b. SME Onboarding
app.post('/api/v1/sme/onboard', async (req, res) => {
  const { name, sector, location, description, offer_summary, need_summary, languages } = req.body;
  if (!name || !offer_summary || !need_summary) {
    res.status(400).json({ error: 'Missing required SME onboarding fields (name, offer_summary, need_summary)' });
    return;
  }

  const newId = `sme-${String(name).toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-4)}`;
  const newSme: SMEProfile = {
    id: newId,
    name: String(name).trim(),
    sector: sector || 'General Trade',
    description: description || 'Verified Nairobi SME node in multilateral exchange network',
    location: location || 'Nairobi County',
    languages: Array.isArray(languages) ? languages : ['en', 'sw'],
    identity_status: 'verified',
    offer_summary: String(offer_summary).trim(),
    need_summary: String(need_summary).trim(),
    trust_events: [
      {
        id: `te-${Date.now()}-1`,
        sme_id: newId,
        event_type: 'identity_confirmed',
        outcome: 'verified',
        evidence_text: `Onboarded into Nairobi SME Exchange Registry via physical node location at ${location || 'Nairobi'}.`,
        created_at: new Date().toISOString().split('T')[0],
      },
    ],
  };

  smesMap.set(newSme.id, newSme);
  const generatedEdges = graphEngine.addSME(newSme);
  const searchResult = await graphEngine.findCycles(4);

  res.json({
    success: true,
    sme: newSme,
    generated_edges: generatedEdges,
    cycles_found: searchResult.cycles.length,
    matching_cycles: searchResult.cycles.filter(c => c.sme_sequence.includes(newSme.id)),
  });
});

// 3. Deterministic Match Search
app.post('/api/v1/matches/search', async (req, res) => {
  const maxCycleLength = Number(req.body.max_cycle_length) || 4;
  const result = await graphEngine.findCycles(maxCycleLength);
  res.json(result);
});

// 4. Test Runner & Observability
app.post('/api/v1/engine/test', async (_req, res) => {
  const startTime = performance.now();
  const result = await graphEngine.findCycles(4);
  const elapsed_ms = Math.round(performance.now() - startTime);

  res.json({
    success: true,
    elapsed_ms,
    cycles_found: result.cycles.length,
    cycles: result.cycles,
    metadata: result.metadata,
  });
});

// 5. Toggle Edge (for broken-chain and failure testing)
app.post('/api/v1/engine/toggle-edge', (req, res) => {
  const { from_sme_id, to_sme_id, enabled } = req.body;
  if (!from_sme_id || !to_sme_id) {
    res.status(400).json({ error: 'Missing from_sme_id or to_sme_id' });
    return;
  }

  if (enabled) {
    graphEngine.enableEdge(from_sme_id, to_sme_id);
  } else {
    graphEngine.disableEdge(from_sme_id, to_sme_id);
  }

  res.json({
    success: true,
    edge: `${from_sme_id}->${to_sme_id}`,
    enabled: !!enabled,
  });
});

// 6. Reset Fixture
app.post('/api/v1/engine/reset', (_req, res) => {
  graphEngine.resetFixture();
  res.json({
    success: true,
    message: 'Seeded graph fixture reset to initial state',
  });
});

// 7. Request Validation & Guardrail Check
app.post('/api/v1/requests/validate', (req, res) => {
  const { raw_text, extraction } = req.body;

  if (raw_text) {
    const guardrail = guardrailCheckInput(raw_text);
    if (!guardrail.allowed) {
      res.status(400).json({
        valid: false,
        error: 'Guardrail rejected input',
        details: guardrail,
      });
      return;
    }
  }

  if (extraction) {
    const schemaCheck = validateExtractionSchema(extraction);
    if (!schemaCheck.valid) {
      res.status(400).json({
        valid: false,
        errors: schemaCheck.errors,
      });
      return;
    }
    const businessCheck = validateBusinessRules(schemaCheck.parsed!);
    res.json({
      valid: businessCheck.valid,
      errors: businessCheck.errors,
      warnings: businessCheck.warnings,
      required_clarifications: businessCheck.required_clarifications,
    });
    return;
  }

  res.json({ valid: true, message: 'Input passed initial checks' });
});

// 7b. AI Models & Multi-Provider Health Status
app.get('/api/v1/agent/models', (_req, res) => {
  res.json({
    providers: agent.getModelProviders(),
    default_cascade: [
      'NVIDIA Nemotron 3 Ultra (nvidia/nemotron-3-super-120b)',
      'Google Gemini 3.8 Flash (gemini-3.8-flash)',
      'Anthropic Claude Sonnet 5 (claude-sonnet-5)',
      'Google Gemini 3.1 Flash Lite [Failsafe] (gemini-3.1-flash-lite)',
      'Google Gemini 3.1 Pro [Failsafe] (gemini-3.1-pro-preview)',
      'Deterministic Grounded Engine (cyclewise-dfs-v1)',
    ],
  });
});

// 8. Agent: Natural-Language Intent Extraction with Multi-Model Support (extract_need_offer)
app.post('/api/v1/requests/parse', async (req, res) => {
  const { message, language, model_preference } = req.body;
  if (!message || typeof message !== 'string') {
    res.status(400).json({ error: 'Missing or invalid "message" string' });
    return;
  }

  try {
    const result = await agent.extractNeedOffer(message, language, model_preference);
    res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Extraction error';
    res.status(400).json({ error: message });
  }
});

// 9. Agent: Full Multi-Step Human-in-the-Loop Orchestration
app.post('/api/v1/agent/orchestrate', async (req, res) => {
  const { message, language, model_preference } = req.body;
  if (!message || typeof message !== 'string') {
    res.status(400).json({ error: 'Missing or invalid "message" string' });
    return;
  }

  try {
    const result = await agent.orchestrate(message, smesMap, language, model_preference);
    res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Agent orchestration error';
    res.status(500).json({ error: message });
  }
});

// 10. Agent: Grounded Cycle Explanation
app.post('/api/v1/agent/explain', async (req, res) => {
  const { cycle, language, model_preference } = req.body;
  if (!cycle || !cycle.edges) {
    res.status(400).json({ error: 'Missing or invalid "cycle" object' });
    return;
  }

  try {
    const explanation = await agent.explainMatch(cycle, smesMap, language, model_preference);
    res.json({ explanation });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Explanation error';
    res.status(500).json({ error: message });
  }
});

// 11. Agent: Grounded Inquiry Q&A
app.post('/api/v1/agent/inquiry', async (req, res) => {
  const { question, cycle, language, model_preference } = req.body;
  if (!question || typeof question !== 'string') {
    res.status(400).json({ error: 'Missing or invalid "question" string' });
    return;
  }

  try {
    const result = await agent.answerInquiry(question, cycle, smesMap, language, model_preference);
    res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Inquiry error';
    res.status(500).json({ error: message });
  }
});

// 12. Agent: Autonomous Substitute Match Coordination
app.post('/api/v1/agent/substitute', async (req, res) => {
  const { declined_sme_id, cycle } = req.body;
  if (!declined_sme_id || !cycle) {
    res.status(400).json({ error: 'Missing declined_sme_id or cycle' });
    return;
  }

  try {
    const result = await agent.substituteMatch(declined_sme_id, cycle, smesMap);
    res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Substitute match error';
    res.status(500).json({ error: message });
  }
});

// 13. Agent: Evaluation Trajectory Logs
app.get('/api/v1/agent/trajectories', (_req, res) => {
  res.json({
    trajectories: agent.getTrajectories(),
    count: agent.getTrajectories().length,
  });
});

// -------------------------------------------------------------
// M-Pesa Daraja: Optional Same-Day Balance Top-Up
// (never a loan — settles the residual, non-barterable sliver of an
// otherwise-reciprocal exchange cycle; KES amounts are always small)
// -------------------------------------------------------------

interface MpesaTransactionRecord {
  checkout_request_id: string;
  merchant_request_id?: string;
  cycle_id?: string;
  sme_id?: string;
  phone_number: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  mpesa_receipt_number?: string;
  result_desc?: string;
  created_at: string;
  updated_at: string;
}

const mpesaTransactions = new Map<string, MpesaTransactionRecord>();

// 14. M-Pesa: Initiate STK Push (balance top-up)
app.post('/api/v1/mpesa/stkpush', async (req, res) => {
  const { phone_number, amount, cycle_id, sme_id, account_reference, transaction_desc } = req.body;

  if (!phone_number || typeof phone_number !== 'string') {
    res.status(400).json({ error: 'Missing or invalid "phone_number" string' });
    return;
  }
  const numericAmount = Number(amount);
  if (!numericAmount || numericAmount <= 0) {
    res.status(400).json({ error: 'Missing or invalid "amount" — must be a positive number' });
    return;
  }

  try {
    const provider = ProviderRegistry.getPayment();
    const result = await provider.initiateStkPush({
      phoneNumber: phone_number,
      amount: numericAmount,
      accountReference: account_reference || cycle_id || 'CYCLEWISE',
      transactionDesc: transaction_desc || 'Cyclewise balance top-up',
    });

    if (result.success && result.checkoutRequestId) {
      mpesaTransactions.set(result.checkoutRequestId, {
        checkout_request_id: result.checkoutRequestId,
        merchant_request_id: result.merchantRequestId,
        cycle_id,
        sme_id,
        phone_number,
        amount: numericAmount,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    res.json({
      success: result.success,
      provider: result.provider,
      is_live: provider.isLive,
      checkout_request_id: result.checkoutRequestId,
      merchant_request_id: result.merchantRequestId,
      customer_message: result.customerMessage,
      error: result.error,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'M-Pesa STK Push error';
    res.status(500).json({ error: message });
  }
});

// 15. M-Pesa: Safaricom Daraja Callback Receiver (public webhook — no auth)
app.post('/api/v1/mpesa/callback', (req, res) => {
  // Acknowledge immediately; Safaricom retries aggressively on non-200 responses.
  res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });

  try {
    const stkCallback = req.body?.Body?.stkCallback;
    if (!stkCallback?.CheckoutRequestID) return;

    const existing = mpesaTransactions.get(stkCallback.CheckoutRequestID);
    const items: Array<{ Name: string; Value: string | number }> = stkCallback.CallbackMetadata?.Item || [];
    const findItem = (name: string) => items.find((i) => i.Name === name)?.Value;

    mpesaTransactions.set(stkCallback.CheckoutRequestID, {
      checkout_request_id: stkCallback.CheckoutRequestID,
      merchant_request_id: stkCallback.MerchantRequestID,
      cycle_id: existing?.cycle_id,
      sme_id: existing?.sme_id,
      phone_number: String(findItem('PhoneNumber') || existing?.phone_number || ''),
      amount: Number(findItem('Amount') || existing?.amount || 0),
      status: stkCallback.ResultCode === 0 ? 'completed' : 'failed',
      mpesa_receipt_number: findItem('MpesaReceiptNumber') as string | undefined,
      result_desc: stkCallback.ResultDesc,
      created_at: existing?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[M-Pesa Callback] Failed to process callback payload:', err);
  }
});

// 16. M-Pesa: Poll Transaction Status
app.get('/api/v1/mpesa/status/:checkoutRequestId', async (req, res) => {
  const { checkoutRequestId } = req.params;
  const cached = mpesaTransactions.get(checkoutRequestId);

  // If the callback already resolved it (or updated it beyond 'pending'), trust the cache.
  if (cached && cached.status !== 'pending') {
    res.json({ source: 'callback', ...cached });
    return;
  }

  // Otherwise actively poll Daraja — useful in local dev where the callback
  // URL usually isn't publicly reachable without a tunnel (e.g. ngrok).
  try {
    const provider = ProviderRegistry.getPayment();
    const live = await provider.queryStkPushStatus(checkoutRequestId);

    if (live.state === 'completed' || live.state === 'failed') {
      const updated: MpesaTransactionRecord = {
        checkout_request_id: checkoutRequestId,
        cycle_id: cached?.cycle_id,
        sme_id: cached?.sme_id,
        phone_number: live.phoneNumber || cached?.phone_number || '',
        amount: live.amount || cached?.amount || 0,
        status: live.state,
        mpesa_receipt_number: live.mpesaReceiptNumber,
        result_desc: live.resultDesc,
        created_at: cached?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      mpesaTransactions.set(checkoutRequestId, updated);
      res.json({ source: 'query', ...updated });
      return;
    }

    res.json(
      cached || {
        checkout_request_id: checkoutRequestId,
        status: 'pending',
        phone_number: '',
        amount: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    );
  } catch {
    res.json(cached || { checkout_request_id: checkoutRequestId, status: 'pending' });
  }
});

// -------------------------------------------------------------
// Vite Middlewares for React Frontend
// -------------------------------------------------------------
async function setupVite() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`[Cyclewise Server] Running on http://0.0.0.0:${port}`);
  });
}

setupVite().catch((err) => {
  console.error('[Cyclewise Server] Startup error:', err);
});
