/**
 * Valeon CM Engine — AI Agents Service
 *
 * Exposes two AI sub-agents via HTTP:
 *   POST /qualify              — Agent A: Deal Qualifier
 *   POST /compliance-review    — Agent B: Compliance Reviewer
 *   POST /api/pipeline/:id     — Complete pipeline runner (Agent A -> Agent B -> CRM sync)
 *
 * Read API for demo dashboard:
 *   GET  /api/deals            — all deals with latest agent run + compliance check
 *   GET  /api/deals/:id        — single deal with full detail
 *   POST /api/deals/seed       — re-seed sample deals
 *   GET  /health               — health check
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { Pool } = require('pg');
const http = require('http');
const DealQualifier = require('./deal_qualifier');
const ComplianceReviewer = require('./compliance_reviewer');

const app = express();
const PORT = process.env.PORT || 3002;
const CRM_URL = process.env.CRM_URL || 'http://localhost:3001';

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '4mb' }));
app.use(morgan('combined'));

const InMemoryStore = require('./in_memory_store');

// ── Database Layer (Postgres with automatic In-Memory Fallback) ─────────────
let activeDb = new InMemoryStore();
let isUsingPostgres = false;

const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:valeon_dev@localhost:5432/valeon',
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pgPool.query('SELECT 1')
  .then(() => {
    console.log('✅ [DB] Connected to PostgreSQL successfully.');
    activeDb = pgPool;
    isUsingPostgres = true;
  })
  .catch((err) => {
    console.log('ℹ️  [DB] PostgreSQL not reachable (' + err.message + ').');
    console.log('🚀 [DB] Running in Standalone Mode (In-Memory store with 10 seed deals active).');
  });

const db = {
  query: (...args) => activeDb.query(...args),
  on: (...args) => {
    try { pgPool.on(...args); } catch {}
  }
};

// ── Agent instances ─────────────────────────────────────────────────────────
const qualifier = new DealQualifier({
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  mockMode: process.env.MOCK_CLAUDE === 'true' || !process.env.ANTHROPIC_API_KEY,
});

const complianceReviewer = new ComplianceReviewer({
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  mockMode: process.env.MOCK_CLAUDE === 'true' || !process.env.ANTHROPIC_API_KEY,
  db,
});

// Helper for CRM HTTP POST
function postToCrm(url, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const parsed = new URL(url);
    const req = http.request(
      {
        hostname: parsed.hostname,
        port: parsed.port,
        path: parsed.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
        timeout: 5000,
      },
      (res) => {
        let resBody = '';
        res.on('data', (chunk) => { resBody += chunk; });
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(resBody) });
          } catch {
            resolve({ status: res.statusCode, data: resBody });
          }
        });
      }
    );
    req.on('error', (e) => reject(e));
    req.write(data);
    req.end();
  });
}

// ── Agent Routes ────────────────────────────────────────────────────────────

/**
 * POST /qualify
 * Body: { deal: <deal object> }
 */
app.post('/qualify', async (req, res) => {
  try {
    const { deal } = req.body;
    if (!deal || !deal.id) {
      return res.status(400).json({ error: 'deal object with id is required' });
    }

    console.log(`[Agent A] Qualifying deal: ${deal.id} — ${deal.name}`);
    const startTime = Date.now();

    const result = await qualifier.qualify(deal);
    const durationMs = Date.now() - startTime;

    // Log to agent_runs
    const runInsert = await db.query(
      `INSERT INTO agent_runs
         (deal_id, agent_name, model, input_payload, output_payload, reasoning,
          input_tokens, output_tokens, duration_ms, status)
       VALUES ($1, 'deal_qualifier', $2, $3, $4, $5, $6, $7, $8, 'success')
       RETURNING id`,
      [
        deal.id,
        result.model,
        JSON.stringify(deal),
        JSON.stringify({ score: result.score, tags: result.tags }),
        result.reasoning,
        result.inputTokens,
        result.outputTokens,
        durationMs,
      ]
    );
    const agentRunId = runInsert.rows[0].id;

    // Update deal
    await db.query(
      `UPDATE deals
       SET qualification_score = $1, tags = $2, status = 'qualified', updated_at = NOW()
       WHERE id = $3`,
      [result.score, result.tags, deal.id]
    );

    return res.json({
      deal_id: deal.id,
      agent_run_id: agentRunId,
      score: result.score,
      tags: result.tags,
      reasoning: result.reasoning,
      model: result.model,
      duration_ms: durationMs,
    });
  } catch (err) {
    console.error('[Agent A] Error:', err);
    if (req.body?.deal?.id) {
      await db.query(
        `INSERT INTO agent_runs (deal_id, agent_name, status, error_message)
         VALUES ($1, 'deal_qualifier', 'error', $2)`,
        [req.body.deal.id, err.message]
      ).catch(() => {});
    }
    return res.status(500).json({ error: 'Agent A failed', message: err.message });
  }
});

/**
 * POST /compliance-review
 * Body: { deal: <deal object> }
 */
app.post('/compliance-review', async (req, res) => {
  try {
    const { deal } = req.body;
    if (!deal || !deal.id) {
      return res.status(400).json({ error: 'deal object with id is required' });
    }

    console.log(`[Agent B] Compliance review: ${deal.id} — ${deal.name}`);
    const startTime = Date.now();

    const [rulesRes, docsRes] = await Promise.all([
      db.query('SELECT * FROM compliance_rules WHERE is_active = TRUE ORDER BY severity, rule_code'),
      db.query('SELECT doc_type, file_name, status FROM documents WHERE deal_id = $1', [deal.id]),
    ]);

    const rules = rulesRes.rows;
    const documents = docsRes.rows;

    const result = await complianceReviewer.review(deal, rules, documents);
    const durationMs = Date.now() - startTime;

    // Log to agent_runs
    const runInsert = await db.query(
      `INSERT INTO agent_runs
         (deal_id, agent_name, model, input_payload, output_payload, reasoning,
          input_tokens, output_tokens, duration_ms, status)
       VALUES ($1, 'compliance_reviewer', $2, $3, $4, $5, $6, $7, $8, 'success')
       RETURNING id`,
      [
        deal.id,
        result.model,
        JSON.stringify({ deal_id: deal.id, name: deal.name, doc_count: documents.length }),
        JSON.stringify({ result: result.result, issues: result.issues }),
        result.reasoning,
        result.inputTokens,
        result.outputTokens,
        durationMs,
      ]
    );
    const agentRunId = runInsert.rows[0].id;

    // Insert into compliance_checks
    const checkInsert = await db.query(
      `INSERT INTO compliance_checks (deal_id, agent_run_id, result, issues, reasoning)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [deal.id, agentRunId, result.result, JSON.stringify(result.issues), result.reasoning]
    );

    // Update deal status based on compliance outcome
    if (result.result === 'pass') {
      await db.query(
        `UPDATE deals SET status = 'passed', rejection_reason = NULL, updated_at = NOW() WHERE id = $1`,
        [deal.id]
      );
    } else {
      const rejectionReason = result.issues
        .filter((i) => i.severity === 'critical')
        .map((i) => `[${i.rule_code}] ${i.description}`)
        .join('; ') || 'Failed statutory compliance checks';

      await db.query(
        `UPDATE deals SET status = 'rejected', rejection_reason = $1, updated_at = NOW() WHERE id = $2`,
        [rejectionReason, deal.id]
      );
    }

    return res.json({
      deal_id: deal.id,
      agent_run_id: agentRunId,
      compliance_check_id: checkInsert.rows[0].id,
      result: result.result,
      issues: result.issues,
      reasoning: result.reasoning,
      model: result.model,
      duration_ms: durationMs,
    });
  } catch (err) {
    console.error('[Agent B] Error:', err);
    if (req.body?.deal?.id) {
      await db.query(
        `INSERT INTO agent_runs (deal_id, agent_name, status, error_message)
         VALUES ($1, 'compliance_reviewer', 'error', $2)`,
        [req.body.deal.id, err.message]
      ).catch(() => {});
    }
    return res.status(500).json({ error: 'Agent B failed', message: err.message });
  }
});

/**
 * POST /api/pipeline/:id
 * Runs the complete automated lifecycle for a deal:
 * Ingested -> Agent A (Qualify) -> Agent B (Compliance Gate) -> CRM Sync (if pass)
 */
app.post('/api/pipeline/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // 1. Fetch deal with related data
    const dealQuery = await db.query(
      `SELECT d.*, co.name AS company_name, co.sector AS company_sector, co.hq_country,
              ct.first_name, ct.last_name, ct.email, ct.phone, ct.title
       FROM deals d
       LEFT JOIN companies co ON co.id = d.company_id
       LEFT JOIN contacts  ct ON ct.id = d.primary_contact_id
       WHERE d.id = $1`,
      [id]
    );

    if (dealQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Deal not found' });
    }
    const deal = dealQuery.rows[0];

    // 2. Step A: Agent A Qualification
    await db.query(`UPDATE deals SET status = 'qualifying', updated_at = NOW() WHERE id = $1`, [id]);
    const qualResult = await qualifier.qualify(deal);

    await db.query(
      `INSERT INTO agent_runs
         (deal_id, agent_name, model, input_payload, output_payload, reasoning, input_tokens, output_tokens, status)
       VALUES ($1, 'deal_qualifier', $2, $3, $4, $5, $6, $7, 'success')`,
      [id, qualResult.model, JSON.stringify(deal), JSON.stringify({ score: qualResult.score, tags: qualResult.tags }), qualResult.reasoning, qualResult.inputTokens, qualResult.outputTokens]
    );
    await db.query(
      `UPDATE deals SET qualification_score = $1, tags = $2, status = 'qualified', updated_at = NOW() WHERE id = $3`,
      [qualResult.score, qualResult.tags, id]
    );

    // 3. Step B: Agent B Compliance Review
    await db.query(`UPDATE deals SET status = 'reviewing', updated_at = NOW() WHERE id = $1`, [id]);
    const [rulesRes, docsRes] = await Promise.all([
      db.query('SELECT * FROM compliance_rules WHERE is_active = TRUE ORDER BY severity, rule_code'),
      db.query('SELECT doc_type, file_name, status FROM documents WHERE deal_id = $1', [id]),
    ]);

    const compResult = await complianceReviewer.review(deal, rulesRes.rows, docsRes.rows);

    const compRun = await db.query(
      `INSERT INTO agent_runs
         (deal_id, agent_name, model, input_payload, output_payload, reasoning, input_tokens, output_tokens, status)
       VALUES ($1, 'compliance_reviewer', $2, $3, $4, $5, $6, $7, 'success')
       RETURNING id`,
      [id, compResult.model, JSON.stringify({ deal_id: id }), JSON.stringify({ result: compResult.result, issues: compResult.issues }), compResult.reasoning, compResult.inputTokens, compResult.outputTokens]
    );

    await db.query(
      `INSERT INTO compliance_checks (deal_id, agent_run_id, result, issues, reasoning)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, compRun.rows[0].id, compResult.result, JSON.stringify(compResult.issues), compResult.reasoning]
    );

    // 4. Compliance Gate Decision
    if (compResult.result !== 'pass') {
      const rejectionReason = compResult.issues
        .filter((i) => i.severity === 'critical')
        .map((i) => `[${i.rule_code}] ${i.description}`)
        .join('; ') || 'Compliance checks failed';

      await db.query(
        `UPDATE deals SET status = 'rejected', rejection_reason = $1, updated_at = NOW() WHERE id = $2`,
        [rejectionReason, id]
      );

      return res.json({
        deal_id: id,
        status: 'rejected',
        qualification_score: qualResult.score,
        compliance_result: 'fail',
        rejection_reason: rejectionReason,
        issues: compResult.issues,
      });
    }

    // Pass: mark passed
    await db.query(
      `UPDATE deals SET status = 'passed', rejection_reason = NULL, updated_at = NOW() WHERE id = $1`,
      [id]
    );

    // 5. Step C: Push to Mock MadeMarket CRM
    const crmPayload = {
      deal_id: id,
      name: deal.name,
      company: deal.company_name,
      deal_size_usd: deal.deal_size_usd,
      sector: deal.sector,
      deal_type: deal.deal_type,
      qualification_score: qualResult.score,
      compliance_status: 'passed',
      contact: {
        name: `${deal.first_name || ''} ${deal.last_name || ''}`.trim(),
        email: deal.email,
        phone: deal.phone,
      },
    };

    let syncSuccess = false;
    let syncHttpStatus = 0;
    let syncResponse = null;
    let syncError = null;

    try {
      const crmRes = await postToCrm(`${CRM_URL}/api/deals`, crmPayload);
      syncHttpStatus = crmRes.status;
      syncResponse = crmRes.data;
      syncSuccess = syncHttpStatus >= 200 && syncHttpStatus < 300;
    } catch (crmErr) {
      syncError = crmErr.message;
      syncHttpStatus = 500;
    }

    // Log to sync_log
    await db.query(
      `INSERT INTO sync_log (deal_id, target_system, http_status, request_payload, response_payload, success, error_message)
       VALUES ($1, 'mademarket_mock', $2, $3, $4, $5, $6)`,
      [id, syncHttpStatus, JSON.stringify(crmPayload), JSON.stringify(syncResponse), syncSuccess, syncError]
    );

    if (syncSuccess) {
      await db.query(
        `UPDATE deals SET status = 'synced', external_crm_id = $1, updated_at = NOW() WHERE id = $2`,
        [syncResponse?.id || 'MM-UNKNOWN', id]
      );
    }

    return res.json({
      deal_id: id,
      status: syncSuccess ? 'synced' : 'passed',
      qualification_score: qualResult.score,
      compliance_result: 'pass',
      crm_sync: {
        success: syncSuccess,
        crm_id: syncResponse?.id,
        http_status: syncHttpStatus,
      },
    });
  } catch (err) {
    console.error(`[Pipeline] Error for deal ${id}:`, err);
    return res.status(500).json({ error: 'Pipeline execution failed', message: err.message });
  }
});

// ── Dashboard Read API ──────────────────────────────────────────────────────

/**
 * GET /api/deals
 * Returns all deals with joined metadata, compliance, and CRM sync status.
 */
app.get('/api/deals', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        d.id,
        d.name,
        d.deal_type,
        d.sector,
        d.subsector,
        d.deal_size_usd,
        d.status,
        d.qualification_score,
        d.tags,
        d.rejection_reason,
        d.external_crm_id,
        d.created_at,
        d.updated_at,
        co.name        AS company_name,
        co.hq_country  AS company_country,
        ct.first_name  AS contact_first,
        ct.last_name   AS contact_last,
        ct.email       AS contact_email,
        ct.title       AS contact_title,
        cc.result      AS compliance_result,
        cc.issues      AS compliance_issues,
        cc.checked_at  AS compliance_checked_at,
        sl.http_status AS sync_http_status,
        sl.success     AS sync_success,
        sl.synced_at,
        sl.response_payload AS sync_response
      FROM deals d
      LEFT JOIN companies co  ON co.id = d.company_id
      LEFT JOIN contacts  ct  ON ct.id = d.primary_contact_id
      LEFT JOIN LATERAL (
        SELECT result, issues, checked_at
        FROM compliance_checks
        WHERE deal_id = d.id
        ORDER BY checked_at DESC
        LIMIT 1
      ) cc ON TRUE
      LEFT JOIN LATERAL (
        SELECT http_status, success, synced_at, response_payload
        FROM sync_log
        WHERE deal_id = d.id
        ORDER BY synced_at DESC
        LIMIT 1
      ) sl ON TRUE
      ORDER BY d.created_at DESC
    `);

    return res.json({ deals: result.rows });
  } catch (err) {
    console.error('[API] GET /api/deals error:', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/deals/:id
 */
app.get('/api/deals/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [dealRes, agentRunsRes, complianceRes, syncRes, docsRes] = await Promise.all([
      db.query(
        `SELECT d.*, co.name AS company_name, co.sector AS company_sector,
                co.hq_country, co.website, co.description AS company_description,
                co.aum_usd, co.revenue_usd, co.employee_count,
                ct.first_name, ct.last_name, ct.email, ct.phone, ct.title
         FROM deals d
         LEFT JOIN companies co ON co.id = d.company_id
         LEFT JOIN contacts  ct ON ct.id = d.primary_contact_id
         WHERE d.id = $1`,
        [id]
      ),
      db.query('SELECT * FROM agent_runs WHERE deal_id = $1 ORDER BY created_at ASC', [id]),
      db.query('SELECT * FROM compliance_checks WHERE deal_id = $1 ORDER BY checked_at DESC LIMIT 1', [id]),
      db.query('SELECT * FROM sync_log WHERE deal_id = $1 ORDER BY synced_at DESC', [id]),
      db.query('SELECT * FROM documents WHERE deal_id = $1 ORDER BY doc_type', [id]),
    ]);

    if (dealRes.rows.length === 0) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    return res.json({
      deal: dealRes.rows[0],
      agent_runs: agentRunsRes.rows,
      compliance: complianceRes.rows[0] || null,
      sync_log: syncRes.rows,
      documents: docsRes.rows,
    });
  } catch (err) {
    console.error('[API] GET /api/deals/:id error:', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /health
 */
app.get('/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    return res.json({
      service: 'valeon-agents',
      status: 'ok',
      mock_claude: process.env.MOCK_CLAUDE === 'true' || !process.env.ANTHROPIC_API_KEY,
      database: 'connected',
      crm_target: CRM_URL,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return res.status(503).json({
      service: 'valeon-agents',
      status: 'degraded',
      error: err.message,
    });
  }
});

// 404 / 500
app.use((req, res) => res.status(404).json({ error: 'Not Found', path: req.path }));
app.use((err, req, res, next) => {
  console.error('[Agents Server Error]', err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

// ── Start ───────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🤖 Valeon Agents Service running on http://localhost:${PORT}`);
  console.log(`   Mode: ${process.env.MOCK_CLAUDE === 'true' || !process.env.ANTHROPIC_API_KEY ? '🎭 DETERMINISTIC MOCK (Audit trail active)' : '🧠 LIVE CLAUDE (Anthropic API)'}`);
  console.log(`   POST /qualify             — Agent A: Deal Qualifier`);
  console.log(`   POST /compliance-review   — Agent B: Compliance Reviewer`);
  console.log(`   POST /api/pipeline/:id    — Complete pipeline runner`);
  console.log(`   GET  /api/deals           — Dashboard read API`);
  console.log(`   GET  /health              — Health check\n`);
});

module.exports = app;
