# Valeon CM Engine — Phase 1 Proof-of-Architecture Prototype

Working prototype of the Capital Markets deal-flow automation engine built for **Valeon Partners**.

This Phase 1 build proves the core automated architectural loop:
```
Deal Ingestion ──> AI Sub-Agents (Qualify & Review) ──> Compliance Gate ──> CRM Sync (MadeMarket)
```

---

## 1. Architectural Mapping: Phase 1 Prototype vs Full Production

The production system at Valeon Partners operates on a 79-table PostgreSQL schema, 65+ specialized AI sub-agents, Azure-native cloud infrastructure, and live integrations with MadeMarket, Grata, Fireflies, and Finalis. 

This prototype is a scoped-down proof-of-concept demonstrating the exact same patterns, auditability, and data flow.

| Domain | Phase 1 Prototype | Full Production Architecture |
|---|---|---|
| **Data Model** | 8 core tables (`companies`, `contacts`, `deals`, `documents`, `compliance_rules`, `compliance_checks`, `agent_runs`, `sync_log`) | 79 tables including syndicate ledgers, deal stages history, LP capital calls, data-room permissions, broker splits, and SEC reporting archives |
| **Agent Fleet** | **2 sub-agents:**<br>• Agent A: Deal Qualifier<br>• Agent B: Compliance Reviewer | **65+ sub-agents:** CIM parsers, financial model auditors, sector comp analyzers, LP matchmakers, pitch deck generators, Fireflies meeting summarizers, Grata company enrichment |
| **Compliance Gate** | Deterministic + Claude evaluation against 10 statutory rules (NDA, CIM, Financials, AUM size, OFAC restricted jurisdictions, Conflicts) | Automated compliance matrix integrated with Finalis broker-dealer supervision, KYC/AML ID verification, and FinCEN checks |
| **CRM Integration** | Mock MadeMarket REST service (`http://mock-crm:3001/api/deals`) with full pipeline simulation | Live MadeMarket API integration with bidirectional sync, custom fields, pipeline stage webhooks, and retry dead-letter queues |
| **Orchestration** | n8n workflows + direct pipeline runner for instant demo interactions | Azure Logic Apps / Temporal / n8n Enterprise with event-driven message bus (Azure Service Bus) |
| **Auditability** | Complete JSON input/output, reasoning transcript, token counts, and execution timestamps logged to `agent_runs` | Full audit ledger with immutable append-only compliance logs for FINRA / SEC supervisory audits |

---

## 2. System Architecture

```
                  ┌────────────────────────────────────────┐
                  │          Deal Ingestion Webhook        │
                  │        (n8n or direct API call)        │
                  └──────────────────┬─────────────────────┘
                                     │
                                     ▼
                  ┌────────────────────────────────────────┐
                  │    PostgreSQL (Core Relational Schema)  │
                  │       deals / companies / contacts     │
                  └──────────────────┬─────────────────────┘
                                     │
                    ┌────────────────┴────────────────┐
                    │                                 │
                    ▼                                 ▼
      ┌───────────────────────────┐     ┌───────────────────────────┐
      │         AGENT A           │     │         AGENT B           │
      │     (Deal Qualifier)      │     │   (Compliance Reviewer)   │
      │  Scores 1-10 & adds tags  │     │ Checks NDA, CIM, Jurisd.  │
      └─────────────┬─────────────┘     └─────────────┬─────────────┘
                    │                                 │
                    └────────────────┬────────────────┘
                                     │
                                     ▼
                        ┌────────────────────────┐
                        │    COMPLIANCE GATE     │
                        │ (Zero critical issues) │
                        └───────┬────────┬───────┘
                                │        │
                       Passed   │        │ Failed
                      ┌─────────┘        └─────────┐
                      ▼                            ▼
        ┌─────────────────────────┐   ┌──────────────────────────┐
        │  MadeMarket CRM Sync    │   │  Blocked at Gate         │
        │  (POST /api/deals)      │   │  Status: 'rejected'      │
        │  Status: 'synced'       │   │  Clear rejection reason  │
        └─────────────────────────┘   └──────────────────────────┘
```

---

## 3. Directory Layout

```
cm-engine/
├── db/
│   └── migrations/
│       ├── 001_core_schema.sql         # 8 core relational tables + triggers
│       └── 002_seed_data.sql           # 10 realistic deals (5 pass, 5 fail)
├── agents/                             # AI Agent service (Claude 3.5 Sonnet / Mock)
│   ├── server.js                       # Express runner & pipeline controller
│   ├── deal_qualifier.js               # Agent A logic
│   ├── compliance_reviewer.js          # Agent B logic
│   ├── prompts/                        # System prompts for agents
│   └── Dockerfile
├── mock-crm/                           # Simulated MadeMarket REST API
│   ├── server.js                       # Endpoints: POST /api/deals, GET /api/deals
│   └── Dockerfile
├── n8n/
│   ├── workflows/
│   │   ├── 01_deal_ingestion.json      # Ingestion & normalization workflow
│   │   ├── 02_agent_orchestration.json # Agent A + B + Compliance Gate
│   │   └── 03_crm_sync.json            # CRM push & audit logging
│   └── README.md
├── dashboard/                          # Demo UI (React + Tailwind CSS)
│   ├── src/                            # Realtime pipeline inspector & reasoning viewer
│   └── Dockerfile
├── docker-compose.yml                  # One-command orchestration
├── .env.example
└── README.md
```

---

## 4. Quick Start (Running the Prototype)

### Option A: Complete Docker Compose Stack

Run everything (PostgreSQL, Mock CRM, Agent Service, n8n, and Dashboard) in a single command:

```bash
docker compose up -d
```

Service endpoints:
- **Demo Dashboard:** `http://localhost:5173`
- **Mock MadeMarket CRM:** `http://localhost:3001/api/deals`
- **Agents Service & Read API:** `http://localhost:3002/api/deals`
- **n8n Orchestration Studio:** `http://localhost:5678`
- **PostgreSQL Database:** `localhost:5432` (`postgres` / `valeon_dev`)

---

### Option B: Local Node.js Development

If running outside Docker:

1. **Start PostgreSQL** and load migrations:
   ```bash
   psql -U postgres -d valeon -f db/migrations/001_core_schema.sql
   psql -U postgres -d valeon -f db/migrations/002_seed_data.sql
   ```

2. **Start the Mock CRM** (`port 3001`):
   ```bash
   cd mock-crm
   npm install
   npm start
   ```

3. **Start the Agents Service** (`port 3002`):
   ```bash
   cd agents
   npm install
   npm start
   ```

4. **Start the Demo Dashboard** (`port 5173`):
   ```bash
   cd dashboard
   npm install
   npm run dev
   ```

---

## 5. Seed Data & Demo Scenarios

The seed dataset contains **10 realistic deals** specifically structured to demonstrate both the pass and reject compliance paths:

### Clean Deals (Pass Compliance Gate -> Synced to MadeMarket)
1. **Nexus Software Series C Recap** ($150M) — SaaS recapitalization, full diligence package on file (NDA, CIM, Financials, LOI).
2. **HealthFirst Growth Equity Round** ($85M) — Digital health, HIPAA compliant, 3-year audited financials.
3. **Verdant Energy Project Finance** ($40M) — Utility-scale solar project finance, PPA signed.
4. **Pinnacle Financial Acquisition** ($220M) — Wealth management M&A, regulatory pre-clearance underway.
5. **Meridian Retail Leveraged Buyout** ($95M) — Sponsor-led LBO with committed debt package.

### Flagged Deals (Blocked at Compliance Gate with Audit Reason)
6. **CryptoNova Series A** ($30M) — Missing NDA, missing CIM, primary contact lacks contact details.
7. **Offshore Alpha Co-Investment** ($500M) — **Conflict of interest:** direct advisory overlap with existing Valeon client (TechWave Corp).
8. **Spark Micro Seed Round** ($5M) — **Sizing failure:** $5M transaction falls below Valeon's minimum $10M AUM threshold.
9. **Meridian Manufacturing Debt** ($75M) — **Restricted jurisdiction:** Target entity registered in Tehran, Iran (OFAC restriction).
10. **QuickFlip CRE Opportunity Fund** ($120M) — Missing LOI and missing audited financial statements.

---

## 6. How to Demo (Screen-Share Flow)

1. Open the dashboard at `http://localhost:5173`.
2. Select a deal (e.g. **Nexus Software**):
   - Click **Run Pipeline** in the top right.
   - Watch the deal advance from `ingested` → `qualifying` (Agent A score: 8/10) → `reviewing` → `passed` → `synced`.
   - Inspect the **Agent Runs** tab to see Agent A's score breakdown and Agent B's compliance analysis.
   - Inspect the **CRM Sync** tab to view the live MadeMarket ID assigned (`MM-...`) and payload.
3. Select a failing deal (e.g. **CryptoNova Series A** or **Meridian Manufacturing**):
   - Click **Run Pipeline**.
   - Watch the Compliance Gate evaluate the findings.
   - See the deal blocked with status `rejected`.
   - Review the red banner displaying the exact statutory rule violations and reason.
   - Confirm that **no CRM push occurred** for the rejected deal.
