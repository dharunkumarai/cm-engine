-- ============================================================
-- Valeon CM Engine — Core Schema (Phase 1, 8 tables)
-- Maps to subset of full 79-table production schema
-- ============================================================

SET client_encoding = 'UTF8';

-- --------------------------------------------------------
-- COMPANIES
-- Full system: ~12 additional columns (NAICS codes, CRM IDs, etc.)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS companies (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    sector          TEXT,                          -- e.g. 'Technology', 'Healthcare'
    subsector       TEXT,
    hq_country      TEXT DEFAULT 'US',
    hq_city         TEXT,
    aum_usd         NUMERIC(20,2),                 -- assets under management
    revenue_usd     NUMERIC(20,2),
    employee_count  INTEGER,
    website         TEXT,
    linkedin_url    TEXT,
    description     TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------
-- CONTACTS
-- Full system: contact_sources, relationship graph, etc.
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS contacts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id      UUID REFERENCES companies(id) ON DELETE SET NULL,
    first_name      TEXT NOT NULL,
    last_name       TEXT NOT NULL,
    email           TEXT,
    phone           TEXT,
    title           TEXT,
    linkedin_url    TEXT,
    is_primary      BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------
-- DEALS
-- Status machine: ingested → qualifying → qualified → reviewing → passed|rejected → synced
-- Full system: 30+ additional columns, deal_stages table, etc.
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS deals (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                    TEXT NOT NULL,
    company_id              UUID REFERENCES companies(id) ON DELETE SET NULL,
    primary_contact_id      UUID REFERENCES contacts(id) ON DELETE SET NULL,
    deal_type               TEXT,          -- 'M&A', 'PE', 'VC', 'Debt', 'IPO'
    sector                  TEXT,
    subsector               TEXT,
    deal_size_usd           NUMERIC(20,2),
    target_close_date       DATE,
    description             TEXT,
    status                  TEXT NOT NULL DEFAULT 'ingested'
                            CHECK (status IN ('ingested','qualifying','qualified','reviewing','passed','rejected','synced')),
    qualification_score     INTEGER CHECK (qualification_score BETWEEN 1 AND 10),
    tags                    TEXT[],        -- JSON array of string tags from Agent A
    rejection_reason        TEXT,          -- populated when status = 'rejected'
    source                  TEXT DEFAULT 'webhook',  -- 'webhook', 'csv', 'manual'
    external_crm_id         TEXT,          -- ID returned by mock MadeMarket on sync
    raw_payload             JSONB,         -- original ingestion payload preserved
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------
-- DOCUMENTS
-- Metadata only in Phase 1 — no file storage
-- Full system: S3 refs, OCR text, embedding vectors, etc.
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS documents (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id     UUID REFERENCES deals(id) ON DELETE CASCADE,
    doc_type    TEXT NOT NULL,    -- 'NDA', 'CIM', 'Financial Model', 'LOI', 'Term Sheet'
    file_name   TEXT,
    file_url    TEXT,             -- null in Phase 1
    status      TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','uploaded','missing','expired')),
    uploaded_at TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------
-- COMPLIANCE RULES
-- Seeded static ruleset — in production this is admin-managed
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS compliance_rules (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_code   TEXT NOT NULL UNIQUE,   -- e.g. 'MISSING_NDA', 'CONFLICT_OF_INTEREST'
    description TEXT NOT NULL,
    category    TEXT,                   -- 'documentation', 'conflict', 'jurisdiction', 'threshold'
    severity    TEXT NOT NULL DEFAULT 'critical'
                CHECK (severity IN ('critical','warning','info')),
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------
-- COMPLIANCE CHECKS
-- One record per agent review run
-- Full system: versioned checks, appeals, regulator export
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS compliance_checks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id         UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    agent_run_id    UUID,           -- set after agent_runs insert
    result          TEXT NOT NULL CHECK (result IN ('pass','fail','pending')),
    issues          JSONB NOT NULL DEFAULT '[]',  -- [{rule_code, description, severity}]
    reasoning       TEXT,           -- Claude full reasoning text
    checked_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------
-- AGENT RUNS  <- primary audit table
-- Every AI decision logged here with full input/output
-- Full system: 65 agent types, vector embeddings, feedback loop
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS agent_runs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id         UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    agent_name      TEXT NOT NULL,   -- 'deal_qualifier', 'compliance_reviewer'
    agent_version   TEXT DEFAULT 'v1',
    model           TEXT DEFAULT 'claude-sonnet-4-5',
    input_payload   JSONB,
    output_payload  JSONB,
    reasoning       TEXT,            -- the agent's full chain-of-thought / explanation
    input_tokens    INTEGER,
    output_tokens   INTEGER,
    duration_ms     INTEGER,
    status          TEXT NOT NULL DEFAULT 'success'
                    CHECK (status IN ('success','error','timeout')),
    error_message   TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------
-- SYNC LOG
-- Records every outbound CRM push attempt
-- Full system: retry queue, webhook receipts, MadeMarket activity log
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS sync_log (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id             UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    target_system       TEXT NOT NULL DEFAULT 'mademarket_mock',
    http_status         INTEGER,
    request_payload     JSONB,
    response_payload    JSONB,
    success             BOOLEAN,
    error_message       TEXT,
    attempt_number      INTEGER DEFAULT 1,
    synced_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_deals_status          ON deals(status);
CREATE INDEX IF NOT EXISTS idx_deals_company_id      ON deals(company_id);
CREATE INDEX IF NOT EXISTS idx_deals_created_at      ON deals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contacts_company_id   ON contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_documents_deal_id     ON documents(deal_id);
CREATE INDEX IF NOT EXISTS idx_agent_runs_deal_id    ON agent_runs(deal_id);
CREATE INDEX IF NOT EXISTS idx_agent_runs_created_at ON agent_runs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_compliance_deal_id    ON compliance_checks(deal_id);
CREATE INDEX IF NOT EXISTS idx_sync_log_deal_id      ON sync_log(deal_id);

-- ============================================================
-- UPDATED_AT TRIGGER (applies to all mutable tables)
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_companies_updated_at ON companies;
CREATE TRIGGER trg_companies_updated_at
    BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_contacts_updated_at ON contacts;
CREATE TRIGGER trg_contacts_updated_at
    BEFORE UPDATE ON contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_deals_updated_at ON deals;
CREATE TRIGGER trg_deals_updated_at
    BEFORE UPDATE ON deals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_documents_updated_at ON documents;
CREATE TRIGGER trg_documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
