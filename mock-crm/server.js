/**
 * Valeon CM Engine — Mock MadeMarket CRM Endpoint
 *
 * Simulates the MadeMarket REST API contract used in production.
 * In production this would be replaced with real MadeMarket API calls.
 *
 * Endpoints:
 *   POST /api/deals         — receive a deal from n8n sync workflow
 *   GET  /api/deals         — list all received deals (for inspection)
 *   GET  /api/deals/:id     — get a specific deal by CRM ID
 *   GET  /health            — health check
 *   DELETE /api/deals       — clear all deals (testing helper)
 */

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

// ── In-memory store (simulates MadeMarket deal pipeline) ───────────────────
// In production: replaced by real MadeMarket REST calls
const crmStore = {
  deals: new Map(),    // crm_id → deal record
  syncLog: [],         // ordered list of sync events
};

// ── Routes ─────────────────────────────────────────────────────────────────

/**
 * POST /api/deals
 * Simulates MadeMarket deal creation.
 * Expected payload shape matches what n8n sync workflow sends.
 */
app.post('/api/deals', (req, res) => {
  const payload = req.body;

  if (!payload || !payload.deal_id) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'deal_id is required in payload',
    });
  }

  const crmId = `MM-${Date.now()}-${uuidv4().substring(0, 8).toUpperCase()}`;
  const now = new Date().toISOString();

  const crmRecord = {
    id: crmId,                          // MadeMarket internal ID
    valeon_deal_id: payload.deal_id,    // back-reference
    status: 'active',
    pipeline_stage: 'New Deal',
    received_at: now,
    data: payload,
  };

  crmStore.deals.set(crmId, crmRecord);
  crmStore.syncLog.push({
    event: 'deal_created',
    crm_id: crmId,
    valeon_deal_id: payload.deal_id,
    timestamp: now,
  });

  console.log(`[CRM] Deal received: ${crmId} (Valeon ID: ${payload.deal_id})`);

  return res.status(201).json({
    id: crmId,
    status: 'received',
    pipeline_stage: 'New Deal',
    message: 'Deal successfully created in MadeMarket pipeline',
    timestamp: now,
  });
});

/**
 * GET /api/deals
 * List all received deals.
 */
app.get('/api/deals', (req, res) => {
  const deals = Array.from(crmStore.deals.values()).sort(
    (a, b) => new Date(b.received_at) - new Date(a.received_at)
  );

  return res.json({
    count: deals.length,
    deals,
  });
});

/**
 * GET /api/deals/:id
 * Get a specific deal by CRM ID.
 */
app.get('/api/deals/:id', (req, res) => {
  const deal = crmStore.deals.get(req.params.id);
  if (!deal) {
    return res.status(404).json({ error: 'Deal not found', id: req.params.id });
  }
  return res.json(deal);
});

/**
 * GET /api/sync-log
 * Ordered list of sync events (useful for demo inspection).
 */
app.get('/api/sync-log', (req, res) => {
  return res.json({
    count: crmStore.syncLog.length,
    events: crmStore.syncLog.slice().reverse(),
  });
});

/**
 * DELETE /api/deals
 * Reset the in-memory store (testing helper).
 */
app.delete('/api/deals', (req, res) => {
  const count = crmStore.deals.size;
  crmStore.deals.clear();
  crmStore.syncLog.length = 0;
  console.log(`[CRM] Store cleared (${count} deals removed)`);
  return res.json({ message: `Cleared ${count} deals`, timestamp: new Date().toISOString() });
});

/**
 * GET /health
 */
app.get('/health', (req, res) => {
  return res.json({
    service: 'valeon-mock-crm',
    status: 'ok',
    deals_in_store: crmStore.deals.size,
    uptime_seconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.path });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('[CRM] Error:', err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

// ── Start ───────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🏢 Mock MadeMarket CRM running on http://localhost:${PORT}`);
  console.log(`   POST /api/deals       — receive a synced deal`);
  console.log(`   GET  /api/deals       — list all received deals`);
  console.log(`   GET  /api/sync-log    — view sync event log`);
  console.log(`   GET  /health          — health check\n`);
});

module.exports = app;
