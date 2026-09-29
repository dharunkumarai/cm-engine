# Valeon CM Engine — n8n Workflows Guide

This directory contains the production-style n8n workflow definitions for the Phase 1 proof-of-architecture.

## Workflows Included

1. **`01_deal_ingestion.json`** (`POST /webhook/ingest-deal`)
   - Normalizes incoming payload (supports webhooks, CSV parsers, or form submissions).
   - Upserts counterparty records into `companies` and `contacts`.
   - Creates the core `deals` record in status `'ingested'`.
   - Hands off execution to the AI Agent Orchestration pipeline.

2. **`02_agent_orchestration.json`** (`POST /webhook/orchestrate-deal`)
   - Executes **Agent A (Deal Qualifier)**: computes 1-10 qualification score, attaches tags (`mid-market`, `high-priority-sector`, etc.), and records full reasoning in `agent_runs`.
   - Executes **Agent B (Compliance Reviewer)**: runs rules against deal metadata and required document statuses (NDA, CIM, Financials, Conflicts, Restricted Jurisdictions).
   - **Compliance Gate**: Evaluates verdict.
     - If **PASS**: Proceeds to CRM Sync.
     - If **REJECT**: Halts pipeline, logs critical rejection reasons to `deals.rejection_reason`, and preserves audit trail without calling CRM.

3. **`03_crm_sync.json`** (`POST /webhook/sync-deal`)
   - Verifies deal is in `passed` status.
   - Dispatches MadeMarket-formatted REST payload to `http://mock-crm:3001/api/deals`.
   - Records outbound sync attempt and HTTP response in `sync_log`.
   - Updates deal status to `synced` and binds `external_crm_id`.

## How to Import in n8n

1. Start the stack:
   ```bash
   docker compose up -d
   ```
2. Navigate to the n8n interface at `http://localhost:5678`.
3. Go to **Workflows** → **Import from File...** and select the JSON files from `n8n/workflows/`.
4. Configure the PostgreSQL credential in n8n:
   - **Host:** `postgres`
   - **Database:** `valeon`
   - **User:** `postgres`
   - **Password:** `valeon_dev`
   - **Port:** `5432`
5. Activate the workflows.
