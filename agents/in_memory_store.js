/**
 * In-Memory Database Store for Valeon CM Engine Prototype
 *
 * Provides a zero-dependency fallback when PostgreSQL is not running locally.
 * Pre-seeded with the exact same 10 companies, 10 contacts, 10 deals,
 * documents, and statutory compliance rules as 002_seed_data.sql.
 */

const { v4: uuidv4 } = require('uuid');

function getSeedData() {
  const complianceRules = [
    { id: '1', rule_code: 'MISSING_NDA', description: 'Non-disclosure agreement not on file', category: 'documentation', severity: 'critical', is_active: true },
    { id: '2', rule_code: 'MISSING_CIM', description: 'Confidential Information Memorandum not provided', category: 'documentation', severity: 'critical', is_active: true },
    { id: '3', rule_code: 'MISSING_FINANCIALS', description: 'Audited financial statements missing (last 2 years)', category: 'documentation', severity: 'critical', is_active: true },
    { id: '4', rule_code: 'CONFLICT_INTEREST', description: 'Potential conflict of interest detected with existing portfolio company', category: 'conflict', severity: 'critical', is_active: true },
    { id: '5', rule_code: 'JURISDICTION_FLAG', description: 'Entity registered in restricted or high-risk jurisdiction', category: 'jurisdiction', severity: 'critical', is_active: true },
    { id: '6', rule_code: 'BELOW_AUM_THRESHOLD', description: 'Deal size below minimum AUM threshold (< $10M)', category: 'threshold', severity: 'critical', is_active: true },
    { id: '7', rule_code: 'SANCTIONS_MATCH', description: 'Entity name or beneficial owner matches OFAC/EU sanctions list', category: 'compliance', severity: 'critical', is_active: true },
    { id: '8', rule_code: 'MISSING_LOI', description: 'Letter of Intent not executed', category: 'documentation', severity: 'warning', is_active: true },
    { id: '9', rule_code: 'STALE_DATA', description: 'Deal data not updated in over 90 days', category: 'documentation', severity: 'warning', is_active: true },
    { id: '10', rule_code: 'INCOMPLETE_CONTACT', description: 'Primary contact missing email or phone', category: 'documentation', severity: 'info', is_active: true }
  ];

  const companies = [
    { id: 'c1', name: 'Nexus Software Inc.', sector: 'Technology', subsector: 'Enterprise SaaS', hq_country: 'US', hq_city: 'Austin, TX', aum_usd: 500000000, revenue_usd: 85000000, employee_count: 420, website: 'https://nexussoftware.com', description: 'Mid-market B2B SaaS platform for supply chain management' },
    { id: 'c2', name: 'HealthFirst Partners', sector: 'Healthcare', subsector: 'Healthcare IT', hq_country: 'US', hq_city: 'Boston, MA', aum_usd: 220000000, revenue_usd: 40000000, employee_count: 180, website: 'https://healthfirstp.com', description: 'Digital health platform focused on chronic care management' },
    { id: 'c3', name: 'Verdant Energy Solutions', sector: 'Energy', subsector: 'Renewable Energy', hq_country: 'US', hq_city: 'Denver, CO', aum_usd: 120000000, revenue_usd: 28000000, employee_count: 95, website: 'https://verdantenergy.com', description: 'Utility-scale solar development and asset management' },
    { id: 'c4', name: 'Pinnacle Financial Group', sector: 'Financial Services', subsector: 'Wealth Management', hq_country: 'US', hq_city: 'New York, NY', aum_usd: 800000000, revenue_usd: 110000000, employee_count: 540, website: 'https://pinnaclefg.com', description: 'Independent RIA with focus on UHNW clients' },
    { id: 'c5', name: 'Meridian Retail Holdings', sector: 'Retail', subsector: 'Specialty Retail', hq_country: 'US', hq_city: 'Chicago, IL', aum_usd: 180000000, revenue_usd: 320000000, employee_count: 1800, website: 'https://meridianretail.com', description: 'Regional specialty retailer with 140 locations across the Midwest' },
    { id: 'c6', name: 'CryptoNova Exchange', sector: 'FinTech', subsector: 'Digital Assets', hq_country: 'VG', hq_city: 'Road Town, BVI', aum_usd: 15000000, revenue_usd: 9000000, employee_count: 42, website: 'https://cryptonova.io', description: 'Retail crypto exchange operating from British Virgin Islands' },
    { id: 'c7', name: 'Offshore Alpha Fund LP', sector: 'Private Equity', subsector: 'Multi-Strategy', hq_country: 'KY', hq_city: 'George Town, CI', aum_usd: 950000000, revenue_usd: null, employee_count: 8, website: null, description: 'Cayman-domiciled PE fund — portfolio overlaps with existing Valeon client' },
    { id: 'c8', name: 'Spark Micro Ventures', sector: 'Technology', subsector: 'Early Stage VC', hq_country: 'US', hq_city: 'San Francisco, CA', aum_usd: 8000000, revenue_usd: 1200000, employee_count: 12, website: 'https://sparkmicro.vc', description: 'Pre-revenue SaaS startup seeking seed-stage venture financing' },
    { id: 'c9', name: 'Meridian Manufacturing Co.', sector: 'Industrials', subsector: 'Heavy Manufacturing', hq_country: 'IR', hq_city: 'Tehran, Iran', aum_usd: 75000000, revenue_usd: 95000000, employee_count: 620, website: 'https://meridianmfg.ir', description: 'Steel fabrication company, Iranian-registered entity' },
    { id: 'c10', name: 'QuickFlip Properties LLC', sector: 'Real Estate', subsector: 'Commercial Real Estate', hq_country: 'US', hq_city: 'Miami, FL', aum_usd: 95000000, revenue_usd: 1800000, employee_count: 28, website: 'https://quickflipre.com', description: 'Opportunistic CRE fund — no executed LOI, incomplete documentation' }
  ];

  const contacts = [
    { id: 'ct1', company_id: 'c1', first_name: 'Marcus', last_name: 'Chen', email: 'marcus.chen@nexussoftware.com', phone: '+1-512-555-0141', title: 'CEO', is_primary: true },
    { id: 'ct2', company_id: 'c2', first_name: 'Sarah', last_name: 'Okafor', email: 'sarah.okafor@healthfirstp.com', phone: '+1-617-555-0182', title: 'CFO', is_primary: true },
    { id: 'ct3', company_id: 'c3', first_name: 'James', last_name: 'Whitfield', email: 'james.w@verdantenergy.com', phone: '+1-303-555-0095', title: 'Managing Director', is_primary: true },
    { id: 'ct4', company_id: 'c4', first_name: 'Priya', last_name: 'Desai', email: 'priya.desai@pinnaclefg.com', phone: '+1-212-555-0540', title: 'Head of M&A', is_primary: true },
    { id: 'ct5', company_id: 'c5', first_name: 'Robert', last_name: 'Larsson', email: 'robert.l@meridianretail.com', phone: '+1-312-555-1800', title: 'VP Corporate Development', is_primary: true },
    { id: 'ct6', company_id: 'c6', first_name: 'Alex', last_name: 'Novak', email: null, phone: null, title: 'Founder', is_primary: true },
    { id: 'ct7', company_id: 'c7', first_name: 'Victoria', last_name: 'Hargrove', email: 'v.hargrove@offshorealpha.ky', phone: '+1-345-555-0008', title: 'General Partner', is_primary: true },
    { id: 'ct8', company_id: 'c8', first_name: 'Dylan', last_name: 'Park', email: 'dylan@sparkmicro.vc', phone: '+1-415-555-0012', title: 'Founder & CEO', is_primary: true },
    { id: 'ct9', company_id: 'c9', first_name: 'Reza', last_name: 'Ahmadi', email: 'r.ahmadi@meridianmfg.ir', phone: '+98-21-5550-0620', title: 'Managing Director', is_primary: true },
    { id: 'ct10', company_id: 'c10', first_name: 'Chad', last_name: 'Wellington', email: 'chad@quickflipre.com', phone: '+1-305-555-0028', title: 'Founder', is_primary: true }
  ];

  const deals = [
    // 5 Pass
    { id: 'd1', name: 'Nexus Software Series C Recap', company_id: 'c1', primary_contact_id: 'ct1', deal_type: 'PE', sector: 'Technology', subsector: 'Enterprise SaaS', deal_size_usd: 150000000, description: 'Recapitalization of Nexus Software Series C preferred. Strong unit economics, clean cap table, full diligence package on file.', status: 'ingested', qualification_score: null, tags: [], rejection_reason: null, external_crm_id: null, created_at: new Date(Date.now() - 100000).toISOString(), updated_at: new Date().toISOString() },
    { id: 'd2', name: 'HealthFirst Growth Equity Round', company_id: 'c2', primary_contact_id: 'ct2', deal_type: 'VC', sector: 'Healthcare', subsector: 'Healthcare IT', deal_size_usd: 85000000, description: 'Growth equity raise for digital health platform. HIPAA-compliant, CMS contract secured, 3-year audited financials available.', status: 'ingested', qualification_score: null, tags: [], rejection_reason: null, external_crm_id: null, created_at: new Date(Date.now() - 90000).toISOString(), updated_at: new Date().toISOString() },
    { id: 'd3', name: 'Verdant Energy Project Finance', company_id: 'c3', primary_contact_id: 'ct3', deal_type: 'Debt', sector: 'Energy', subsector: 'Renewable Energy', deal_size_usd: 40000000, description: 'Project finance for 80MW solar facility in Colorado. PPA signed, EPC contractor selected, environmental permits cleared.', status: 'ingested', qualification_score: null, tags: [], rejection_reason: null, external_crm_id: null, created_at: new Date(Date.now() - 80000).toISOString(), updated_at: new Date().toISOString() },
    { id: 'd4', name: 'Pinnacle Financial Acquisition', company_id: 'c4', primary_contact_id: 'ct4', deal_type: 'M&A', sector: 'Financial Services', subsector: 'Wealth Management', deal_size_usd: 220000000, description: 'Strategic acquisition of Pinnacle Financial by regional bank. Fully documented, no conflicts identified, regulatory pre-clearance in progress.', status: 'ingested', qualification_score: null, tags: [], rejection_reason: null, external_crm_id: null, created_at: new Date(Date.now() - 70000).toISOString(), updated_at: new Date().toISOString() },
    { id: 'd5', name: 'Meridian Retail Leveraged Buyout', company_id: 'c5', primary_contact_id: 'ct5', deal_type: 'PE', sector: 'Retail', subsector: 'Specialty Retail', deal_size_usd: 95000000, description: 'Sponsor-led LBO of Meridian Retail. Management rollover confirmed, debt commitment letters received, full data room populated.', status: 'ingested', qualification_score: null, tags: [], rejection_reason: null, external_crm_id: null, created_at: new Date(Date.now() - 60000).toISOString(), updated_at: new Date().toISOString() },
    // 5 Fail
    { id: 'd6', name: 'CryptoNova Series A', company_id: 'c6', primary_contact_id: 'ct6', deal_type: 'VC', sector: 'FinTech', subsector: 'Digital Assets', deal_size_usd: 30000000, description: 'Series A raise for BVI-based crypto exchange. No NDA executed, no CIM provided, primary contact has no email or phone on file.', status: 'ingested', qualification_score: null, tags: [], rejection_reason: null, external_crm_id: null, created_at: new Date(Date.now() - 50000).toISOString(), updated_at: new Date().toISOString() },
    { id: 'd7', name: 'Offshore Alpha Co-Investment', company_id: 'c7', primary_contact_id: 'ct7', deal_type: 'PE', sector: 'Private Equity', subsector: 'Multi-Strategy', deal_size_usd: 500000000, description: 'Co-investment opportunity in Cayman PE fund. Portfolio company TechWave Corp already represented by Valeon — direct conflict of interest.', status: 'ingested', qualification_score: null, tags: [], rejection_reason: null, external_crm_id: null, created_at: new Date(Date.now() - 40000).toISOString(), updated_at: new Date().toISOString() },
    { id: 'd8', name: 'Spark Micro Seed Round', company_id: 'c8', primary_contact_id: 'ct8', deal_type: 'VC', sector: 'Technology', subsector: 'Early Stage VC', deal_size_usd: 5000000, description: 'Seed round for pre-revenue SaaS startup. Deal size ($5M) is below the firm minimum AUM threshold of $10M for Phase 1 mandates.', status: 'ingested', qualification_score: null, tags: [], rejection_reason: null, external_crm_id: null, created_at: new Date(Date.now() - 30000).toISOString(), updated_at: new Date().toISOString() },
    { id: 'd9', name: 'Meridian Manufacturing Debt', company_id: 'c9', primary_contact_id: 'ct9', deal_type: 'Debt', sector: 'Industrials', subsector: 'Heavy Manufacturing', deal_size_usd: 75000000, description: 'Senior secured debt facility for Tehran-registered manufacturing entity. Entity registered in Iran — OFAC-sanctioned jurisdiction.', status: 'ingested', qualification_score: null, tags: [], rejection_reason: null, external_crm_id: null, created_at: new Date(Date.now() - 20000).toISOString(), updated_at: new Date().toISOString() },
    { id: 'd10', name: 'QuickFlip CRE Opportunity Fund', company_id: 'c10', primary_contact_id: 'ct10', deal_type: 'PE', sector: 'Real Estate', subsector: 'Commercial RE', deal_size_usd: 120000000, description: 'Opportunistic CRE fund. No executed LOI, audited financials missing, data room incomplete. Submitted without standard diligence package.', status: 'ingested', qualification_score: null, tags: [], rejection_reason: null, external_crm_id: null, created_at: new Date(Date.now() - 10000).toISOString(), updated_at: new Date().toISOString() }
  ];

  const documents = [
    // d1
    { id: 'doc1', deal_id: 'd1', doc_type: 'NDA', file_name: 'Nexus_NDA_Executed.pdf', status: 'uploaded' },
    { id: 'doc2', deal_id: 'd1', doc_type: 'CIM', file_name: 'Nexus_CIM_v3.pdf', status: 'uploaded' },
    { id: 'doc3', deal_id: 'd1', doc_type: 'Financial Model', file_name: 'Nexus_FinModel_Q3_2026.xlsx', status: 'uploaded' },
    { id: 'doc4', deal_id: 'd1', doc_type: 'LOI', file_name: 'Nexus_LOI_Signed.pdf', status: 'uploaded' },
    // d2
    { id: 'doc5', deal_id: 'd2', doc_type: 'NDA', file_name: 'HealthFirst_NDA.pdf', status: 'uploaded' },
    { id: 'doc6', deal_id: 'd2', doc_type: 'CIM', file_name: 'HealthFirst_CIM_Final.pdf', status: 'uploaded' },
    { id: 'doc7', deal_id: 'd2', doc_type: 'Financial Model', file_name: 'HealthFirst_3YR_Model.xlsx', status: 'uploaded' },
    // d3
    { id: 'doc8', deal_id: 'd3', doc_type: 'NDA', file_name: 'Verdant_NDA_Executed.pdf', status: 'uploaded' },
    { id: 'doc9', deal_id: 'd3', doc_type: 'CIM', file_name: 'Verdant_ProjectCIM.pdf', status: 'uploaded' },
    { id: 'doc10', deal_id: 'd3', doc_type: 'Financial Model', file_name: 'Verdant_ProjectFinance.xlsx', status: 'uploaded' },
    // d4
    { id: 'doc11', deal_id: 'd4', doc_type: 'NDA', file_name: 'Pinnacle_NDA.pdf', status: 'uploaded' },
    { id: 'doc12', deal_id: 'd4', doc_type: 'CIM', file_name: 'Pinnacle_InformationMemo.pdf', status: 'uploaded' },
    { id: 'doc13', deal_id: 'd4', doc_type: 'Financial Model', file_name: 'Pinnacle_AuditedFS_2024.pdf', status: 'uploaded' },
    { id: 'doc14', deal_id: 'd4', doc_type: 'LOI', file_name: 'Pinnacle_LOI_Executed.pdf', status: 'uploaded' },
    // d5
    { id: 'doc15', deal_id: 'd5', doc_type: 'NDA', file_name: 'Meridian_NDA.pdf', status: 'uploaded' },
    { id: 'doc16', deal_id: 'd5', doc_type: 'CIM', file_name: 'Meridian_CIM.pdf', status: 'uploaded' },
    { id: 'doc17', deal_id: 'd5', doc_type: 'Financial Model', file_name: 'Meridian_LBOModel.xlsx', status: 'uploaded' },
    { id: 'doc18', deal_id: 'd5', doc_type: 'LOI', file_name: 'Meridian_LOI_Signed.pdf', status: 'uploaded' },
    // d6 (fail: missing NDA & CIM)
    { id: 'doc19', deal_id: 'd6', doc_type: 'NDA', file_name: null, status: 'missing' },
    { id: 'doc20', deal_id: 'd6', doc_type: 'CIM', file_name: null, status: 'missing' },
    // d10 (fail: missing LOI & FinModel)
    { id: 'doc21', deal_id: 'd10', doc_type: 'NDA', file_name: 'QuickFlip_NDA_Draft.pdf', status: 'uploaded' },
    { id: 'doc22', deal_id: 'd10', doc_type: 'LOI', file_name: null, status: 'missing' },
    { id: 'doc23', deal_id: 'd10', doc_type: 'Financial Model', file_name: null, status: 'missing' }
  ];

  return {
    complianceRules,
    companies,
    contacts,
    deals,
    documents,
    agentRuns: [],
    complianceChecks: [],
    syncLogs: []
  };
}

class InMemoryStore {
  constructor() {
    this.data = getSeedData();
  }

  reset() {
    this.data = getSeedData();
  }

  async query(sql, params = []) {
    const s = sql.trim();

    // 1. SELECT * FROM compliance_rules
    if (s.includes('FROM compliance_rules')) {
      return { rows: this.data.complianceRules.filter(r => r.is_active) };
    }

    // 2. SELECT * FROM documents WHERE deal_id = $1
    if (s.includes('FROM documents WHERE deal_id = $1')) {
      const dealId = params[0];
      return { rows: this.data.documents.filter(d => d.deal_id === dealId) };
    }

    // 3. INSERT INTO agent_runs
    if (s.includes('INSERT INTO agent_runs')) {
      const id = uuidv4();
      const run = {
        id,
        deal_id: params[0],
        agent_name: params[1],
        model: params[2],
        input_payload: typeof params[3] === 'string' ? JSON.parse(params[3]) : params[3],
        output_payload: typeof params[4] === 'string' ? JSON.parse(params[4]) : params[4],
        reasoning: params[5],
        input_tokens: params[6] || 0,
        output_tokens: params[7] || 0,
        duration_ms: params[8] || 120,
        status: params[9] || 'success',
        created_at: new Date().toISOString()
      };
      this.data.agentRuns.push(run);
      return { rows: [{ id }] };
    }

    // 4. INSERT INTO compliance_checks
    if (s.includes('INSERT INTO compliance_checks')) {
      const id = uuidv4();
      const check = {
        id,
        deal_id: params[0],
        agent_run_id: params[1],
        result: params[2],
        issues: typeof params[3] === 'string' ? JSON.parse(params[3]) : params[3],
        reasoning: params[4],
        checked_at: new Date().toISOString()
      };
      this.data.complianceChecks.push(check);
      return { rows: [{ id }] };
    }

    // 5. INSERT INTO sync_log
    if (s.includes('INSERT INTO sync_log')) {
      const id = uuidv4();
      const log = {
        id,
        deal_id: params[0],
        target_system: params[1] || 'mademarket_mock',
        http_status: params[2],
        request_payload: typeof params[3] === 'string' ? JSON.parse(params[3]) : params[3],
        response_payload: typeof params[4] === 'string' ? JSON.parse(params[4]) : params[4],
        success: params[5],
        error_message: params[6] || null,
        synced_at: new Date().toISOString()
      };
      this.data.syncLogs.push(log);
      return { rows: [{ id }] };
    }

    // 6. UPDATE deals
    if (s.includes('UPDATE deals SET status = $1, rejection_reason = $2')) {
      const deal = this.data.deals.find(d => d.id === params[2]);
      if (deal) {
        deal.status = params[0];
        deal.rejection_reason = params[1];
        deal.updated_at = new Date().toISOString();
      }
      return { rows: [] };
    }

    if (s.includes('UPDATE deals SET status = $1, rejection_reason = NULL') || s.includes("UPDATE deals SET status = 'passed'")) {
      const dealId = params[0];
      const deal = this.data.deals.find(d => d.id === dealId);
      if (deal) {
        deal.status = 'passed';
        deal.rejection_reason = null;
        deal.updated_at = new Date().toISOString();
      }
      return { rows: [] };
    }

    if (s.includes("UPDATE deals SET status = 'rejected'")) {
      const deal = this.data.deals.find(d => d.id === params[1]);
      if (deal) {
        deal.status = 'rejected';
        deal.rejection_reason = params[0];
        deal.updated_at = new Date().toISOString();
      }
      return { rows: [] };
    }

    if (s.includes("UPDATE deals SET status = 'qualifying'")) {
      const deal = this.data.deals.find(d => d.id === params[0]);
      if (deal) deal.status = 'qualifying';
      return { rows: [] };
    }

    if (s.includes("UPDATE deals SET status = 'reviewing'")) {
      const deal = this.data.deals.find(d => d.id === params[0]);
      if (deal) deal.status = 'reviewing';
      return { rows: [] };
    }

    if (s.includes('qualification_score = $1, tags = $2, status =')) {
      const deal = this.data.deals.find(d => d.id === params[2]);
      if (deal) {
        deal.qualification_score = params[0];
        deal.tags = params[1];
        deal.status = 'qualified';
        deal.updated_at = new Date().toISOString();
      }
      return { rows: [] };
    }

    if (s.includes("status = 'synced', external_crm_id = $1")) {
      const deal = this.data.deals.find(d => d.id === params[1]);
      if (deal) {
        deal.status = 'synced';
        deal.external_crm_id = params[0];
        deal.updated_at = new Date().toISOString();
      }
      return { rows: [] };
    }

    // 7. GET /api/deals (all deals join query)
    if (s.includes('FROM deals d') && !s.includes('WHERE d.id = $1')) {
      const rows = this.data.deals.map(d => {
        const co = this.data.companies.find(c => c.id === d.company_id) || {};
        const ct = this.data.contacts.find(c => c.id === d.primary_contact_id) || {};
        const cc = this.data.complianceChecks.filter(c => c.deal_id === d.id).slice(-1)[0] || {};
        const sl = this.data.syncLogs.filter(s => s.deal_id === d.id).slice(-1)[0] || {};

        return {
          id: d.id,
          name: d.name,
          deal_type: d.deal_type,
          sector: d.sector,
          subsector: d.subsector,
          deal_size_usd: d.deal_size_usd,
          status: d.status,
          qualification_score: d.qualification_score,
          tags: d.tags,
          rejection_reason: d.rejection_reason,
          external_crm_id: d.external_crm_id,
          created_at: d.created_at,
          updated_at: d.updated_at,
          company_name: co.name,
          company_country: co.hq_country,
          contact_first: ct.first_name,
          contact_last: ct.last_name,
          contact_email: ct.email,
          contact_title: ct.title,
          compliance_result: cc.result || null,
          compliance_issues: cc.issues || null,
          compliance_checked_at: cc.checked_at || null,
          sync_http_status: sl.http_status || null,
          sync_success: sl.success || null,
          synced_at: sl.synced_at || null,
          sync_response: sl.response_payload || null
        };
      });
      return { rows };
    }

    // 8. Single deal query (WHERE d.id = $1)
    if (s.includes('FROM deals d') && s.includes('WHERE d.id = $1')) {
      const dealId = params[0];
      const d = this.data.deals.find(deal => deal.id === dealId);
      if (!d) return { rows: [] };

      const co = this.data.companies.find(c => c.id === d.company_id) || {};
      const ct = this.data.contacts.find(c => c.id === d.primary_contact_id) || {};

      return {
        rows: [{
          ...d,
          company_name: co.name,
          company_sector: co.sector,
          hq_country: co.hq_country,
          website: co.website,
          company_description: co.description,
          aum_usd: co.aum_usd,
          revenue_usd: co.revenue_usd,
          employee_count: co.employee_count,
          first_name: ct.first_name,
          last_name: ct.last_name,
          email: ct.email,
          phone: ct.phone,
          title: ct.title
        }]
      };
    }

    // 9. Agent runs for deal
    if (s.includes('FROM agent_runs WHERE deal_id = $1')) {
      const dealId = params[0];
      return { rows: this.data.agentRuns.filter(r => r.deal_id === dealId) };
    }

    // 10. Compliance check for deal
    if (s.includes('FROM compliance_checks WHERE deal_id = $1')) {
      const dealId = params[0];
      const checks = this.data.complianceChecks.filter(r => r.deal_id === dealId);
      return { rows: checks.length ? [checks[checks.length - 1]] : [] };
    }

    // 11. Sync log for deal
    if (s.includes('FROM sync_log WHERE deal_id = $1')) {
      const dealId = params[0];
      return { rows: this.data.syncLogs.filter(s => s.deal_id === dealId).reverse() };
    }

    // 12. Health query SELECT 1
    if (s.includes('SELECT 1')) {
      return { rows: [{ '?column?': 1 }] };
    }

    return { rows: [] };
  }
}

module.exports = InMemoryStore;
