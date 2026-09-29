-- ============================================================
-- Valeon CM Engine — Seed Data (Phase 1 Demo)
-- 10 deals: 5 designed to PASS compliance, 5 to FAIL
-- ============================================================

-- --------------------------------------------------------
-- Compliance Rules (seeded static ruleset)
-- --------------------------------------------------------
INSERT INTO compliance_rules (rule_code, description, category, severity) VALUES
  ('MISSING_NDA',       'Non-disclosure agreement not on file',                  'documentation', 'critical'),
  ('MISSING_CIM',       'Confidential Information Memorandum not provided',      'documentation', 'critical'),
  ('MISSING_FINANCIALS','Audited financial statements missing (last 2 years)',    'documentation', 'critical'),
  ('CONFLICT_INTEREST', 'Potential conflict of interest detected with existing portfolio company', 'conflict', 'critical'),
  ('JURISDICTION_FLAG', 'Entity registered in restricted or high-risk jurisdiction', 'jurisdiction', 'critical'),
  ('BELOW_AUM_THRESHOLD','Deal size below minimum AUM threshold (< $10M)',       'threshold',     'critical'),
  ('SANCTIONS_MATCH',   'Entity name or beneficial owner matches OFAC/EU sanctions list', 'compliance', 'critical'),
  ('MISSING_LOI',       'Letter of Intent not executed',                         'documentation', 'warning'),
  ('STALE_DATA',        'Deal data not updated in over 90 days',                 'documentation', 'warning'),
  ('INCOMPLETE_CONTACT','Primary contact missing email or phone',                'documentation', 'info')
ON CONFLICT (rule_code) DO NOTHING;

-- --------------------------------------------------------
-- Companies
-- --------------------------------------------------------
INSERT INTO companies (id, name, sector, subsector, hq_country, hq_city, aum_usd, revenue_usd, employee_count, website, description) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'Nexus Software Inc.',       'Technology',          'Enterprise SaaS',        'US', 'Austin, TX',        500000000,  85000000,  420, 'https://nexussoftware.com',   'Mid-market B2B SaaS platform for supply chain management'),
  ('c1000000-0000-0000-0000-000000000002', 'HealthFirst Partners',      'Healthcare',          'Healthcare IT',          'US', 'Boston, MA',        220000000,  40000000,  180, 'https://healthfirstp.com',    'Digital health platform focused on chronic care management'),
  ('c1000000-0000-0000-0000-000000000003', 'Verdant Energy Solutions',  'Energy',              'Renewable Energy',       'US', 'Denver, CO',        120000000,  28000000,  95,  'https://verdantenergy.com',   'Utility-scale solar development and asset management'),
  ('c1000000-0000-0000-0000-000000000004', 'Pinnacle Financial Group',  'Financial Services',  'Wealth Management',      'US', 'New York, NY',      800000000, 110000000,  540, 'https://pinnaclefg.com',     'Independent RIA with focus on UHNW clients'),
  ('c1000000-0000-0000-0000-000000000005', 'Meridian Retail Holdings',  'Retail',              'Specialty Retail',       'US', 'Chicago, IL',       180000000,  320000000, 1800,'https://meridianretail.com',  'Regional specialty retailer with 140 locations across the Midwest'),
  ('c1000000-0000-0000-0000-000000000006', 'CryptoNova Exchange',       'FinTech',             'Digital Assets',         'VG', 'Road Town, BVI',    15000000,   9000000,   42,  'https://cryptonova.io',      'Retail crypto exchange operating from British Virgin Islands'),
  ('c1000000-0000-0000-0000-000000000007', 'Offshore Alpha Fund LP',    'Private Equity',      'Multi-Strategy',         'KY', 'George Town, CI',   950000000, NULL,        8,   NULL,                         'Cayman-domiciled PE fund — portfolio overlaps with existing Valeon client'),
  ('c1000000-0000-0000-0000-000000000008', 'Spark Micro Ventures',      'Technology',          'Early Stage VC',         'US', 'San Francisco, CA', 8000000,    1200000,   12,  'https://sparkmicro.vc',      'Pre-revenue SaaS startup seeking seed-stage venture financing'),
  ('c1000000-0000-0000-0000-000000000009', 'Meridian Manufacturing Co.',  'Industrials',       'Heavy Manufacturing',    'IR', 'Tehran, Iran',       75000000,  95000000,  620, 'https://meridianmfg.ir',    'Steel fabrication company, Iranian-registered entity'),
  ('c1000000-0000-0000-0000-000000000010', 'QuickFlip Properties LLC',  'Real Estate',         'Commercial Real Estate', 'US', 'Miami, FL',         95000000,  18000000,  28,  'https://quickflipre.com',    'Opportunistic CRE fund — no executed LOI, incomplete documentation');

-- --------------------------------------------------------
-- Contacts
-- --------------------------------------------------------
INSERT INTO contacts (id, company_id, first_name, last_name, email, phone, title, is_primary) VALUES
  ('ct100000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'Marcus',   'Chen',       'marcus.chen@nexussoftware.com',   '+1-512-555-0141', 'CEO',                     TRUE),
  ('ct100000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000002', 'Sarah',    'Okafor',     'sarah.okafor@healthfirstp.com',   '+1-617-555-0182', 'CFO',                     TRUE),
  ('ct100000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000003', 'James',    'Whitfield',  'james.w@verdantenergy.com',       '+1-303-555-0095', 'Managing Director',       TRUE),
  ('ct100000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000004', 'Priya',    'Desai',      'priya.desai@pinnaclefg.com',      '+1-212-555-0540', 'Head of M&A',             TRUE),
  ('ct100000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000005', 'Robert',   'Larsson',    'robert.l@meridianretail.com',     '+1-312-555-1800', 'VP Corporate Development', TRUE),
  ('ct100000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000006', 'Alex',     'Novak',      NULL,                              NULL,              'Founder',                 TRUE),
  ('ct100000-0000-0000-0000-000000000007', 'c1000000-0000-0000-0000-000000000007', 'Victoria', 'Hargrove',   'v.hargrove@offshorealpha.ky',     '+1-345-555-0008', 'General Partner',         TRUE),
  ('ct100000-0000-0000-0000-000000000008', 'c1000000-0000-0000-0000-000000000008', 'Dylan',    'Park',       'dylan@sparkmicro.vc',             '+1-415-555-0012', 'Founder & CEO',           TRUE),
  ('ct100000-0000-0000-0000-000000000009', 'c1000000-0000-0000-0000-000000000009', 'Reza',     'Ahmadi',     'r.ahmadi@meridianmfg.ir',         '+98-21-5550-0620','Managing Director',       TRUE),
  ('ct100000-0000-0000-0000-000000000010', 'c1000000-0000-0000-0000-000000000010', 'Chad',     'Wellington', 'chad@quickflipre.com',            '+1-305-555-0028', 'Founder',                 TRUE);

-- --------------------------------------------------------
-- Deals  (5 clean, 5 flagged)
-- --------------------------------------------------------
INSERT INTO deals (id, name, company_id, primary_contact_id, deal_type, sector, subsector, deal_size_usd, description, status, source, raw_payload) VALUES
  -- PASS deals (5)
  ('d1000000-0000-0000-0000-000000000001', 'Nexus Software Series C Recap',   'c1000000-0000-0000-0000-000000000001', 'ct100000-0000-0000-0000-000000000001', 'PE',   'Technology',         'Enterprise SaaS',   150000000, 'Recapitalization of Nexus Software Series C preferred. Strong unit economics, clean cap table, full diligence package on file.',                    'ingested', 'webhook', '{"source": "webhook", "submitter": "seed"}'::jsonb),
  ('d1000000-0000-0000-0000-000000000002', 'HealthFirst Growth Equity Round',  'c1000000-0000-0000-0000-000000000002', 'ct100000-0000-0000-0000-000000000002', 'VC',   'Healthcare',         'Healthcare IT',      85000000,  'Growth equity raise for digital health platform. HIPAA-compliant, CMS contract secured, 3-year audited financials available.',                     'ingested', 'webhook', '{"source": "webhook", "submitter": "seed"}'::jsonb),
  ('d1000000-0000-0000-0000-000000000003', 'Verdant Energy Project Finance',   'c1000000-0000-0000-0000-000000000003', 'ct100000-0000-0000-0000-000000000003', 'Debt', 'Energy',             'Renewable Energy',   40000000,  'Project finance for 80MW solar facility in Colorado. PPA signed, EPC contractor selected, environmental permits cleared.',                         'ingested', 'webhook', '{"source": "webhook", "submitter": "seed"}'::jsonb),
  ('d1000000-0000-0000-0000-000000000004', 'Pinnacle Financial Acquisition',   'c1000000-0000-0000-0000-000000000004', 'ct100000-0000-0000-0000-000000000004', 'M&A',  'Financial Services', 'Wealth Management',  220000000, 'Strategic acquisition of Pinnacle Financial by regional bank. Fully documented, no conflicts identified, regulatory pre-clearance in progress.', 'ingested', 'webhook', '{"source": "webhook", "submitter": "seed"}'::jsonb),
  ('d1000000-0000-0000-0000-000000000005', 'Meridian Retail Leveraged Buyout', 'c1000000-0000-0000-0000-000000000005', 'ct100000-0000-0000-0000-000000000005', 'PE',   'Retail',             'Specialty Retail',   95000000,  'Sponsor-led LBO of Meridian Retail. Management rollover confirmed, debt commitment letters received, full data room populated.',                  'ingested', 'webhook', '{"source": "webhook", "submitter": "seed"}'::jsonb),
  -- FAIL deals (5)
  ('d1000000-0000-0000-0000-000000000006', 'CryptoNova Series A',             'c1000000-0000-0000-0000-000000000006', 'ct100000-0000-0000-0000-000000000006', 'VC',   'FinTech',            'Digital Assets',     30000000,  'Series A raise for BVI-based crypto exchange. No NDA executed, no CIM provided, primary contact has no email or phone on file.',                  'ingested', 'webhook', '{"source": "webhook", "submitter": "seed"}'::jsonb),
  ('d1000000-0000-0000-0000-000000000007', 'Offshore Alpha Co-Investment',     'c1000000-0000-0000-0000-000000000007', 'ct100000-0000-0000-0000-000000000007', 'PE',   'Private Equity',     'Multi-Strategy',     500000000, 'Co-investment opportunity in Cayman PE fund. Portfolio company TechWave Corp already represented by Valeon — direct conflict of interest.',        'ingested', 'webhook', '{"source": "webhook", "submitter": "seed"}'::jsonb),
  ('d1000000-0000-0000-0000-000000000008', 'Spark Micro Seed Round',           'c1000000-0000-0000-0000-000000000008', 'ct100000-0000-0000-0000-000000000008', 'VC',   'Technology',         'Early Stage VC',     5000000,   'Seed round for pre-revenue SaaS startup. Deal size ($5M) is below the firm minimum AUM threshold of $10M for Phase 1 mandates.',                  'ingested', 'webhook', '{"source": "webhook", "submitter": "seed"}'::jsonb),
  ('d1000000-0000-0000-0000-000000000009', 'Meridian Manufacturing Debt',      'c1000000-0000-0000-0000-000000000009', 'ct100000-0000-0000-0000-000000000009', 'Debt', 'Industrials',        'Heavy Manufacturing', 75000000,  'Senior secured debt facility for Tehran-registered manufacturing entity. Entity registered in Iran — OFAC-sanctioned jurisdiction.',               'ingested', 'webhook', '{"source": "webhook", "submitter": "seed"}'::jsonb),
  ('d1000000-0000-0000-0000-000000000010', 'QuickFlip CRE Opportunity Fund',   'c1000000-0000-0000-0000-000000000010', 'ct100000-0000-0000-0000-000000000010', 'PE',   'Real Estate',        'Commercial RE',      120000000, 'Opportunistic CRE fund. No executed LOI, audited financials missing, data room incomplete. Submitted without standard diligence package.',         'ingested', 'webhook', '{"source": "webhook", "submitter": "seed"}'::jsonb);

-- --------------------------------------------------------
-- Documents (metadata only — realistic mix of present/absent)
-- --------------------------------------------------------
INSERT INTO documents (deal_id, doc_type, file_name, status) VALUES
  -- Nexus Software (full docs) PASS
  ('d1000000-0000-0000-0000-000000000001', 'NDA',             'Nexus_NDA_Executed.pdf',          'uploaded'),
  ('d1000000-0000-0000-0000-000000000001', 'CIM',             'Nexus_CIM_v3.pdf',                'uploaded'),
  ('d1000000-0000-0000-0000-000000000001', 'Financial Model', 'Nexus_FinModel_Q3_2026.xlsx',     'uploaded'),
  ('d1000000-0000-0000-0000-000000000001', 'LOI',             'Nexus_LOI_Signed.pdf',            'uploaded'),
  -- HealthFirst (full docs) PASS
  ('d1000000-0000-0000-0000-000000000002', 'NDA',             'HealthFirst_NDA.pdf',             'uploaded'),
  ('d1000000-0000-0000-0000-000000000002', 'CIM',             'HealthFirst_CIM_Final.pdf',       'uploaded'),
  ('d1000000-0000-0000-0000-000000000002', 'Financial Model', 'HealthFirst_3YR_Model.xlsx',      'uploaded'),
  -- Verdant (full docs) PASS
  ('d1000000-0000-0000-0000-000000000003', 'NDA',             'Verdant_NDA_Executed.pdf',        'uploaded'),
  ('d1000000-0000-0000-0000-000000000003', 'CIM',             'Verdant_ProjectCIM.pdf',          'uploaded'),
  ('d1000000-0000-0000-0000-000000000003', 'Financial Model', 'Verdant_ProjectFinance.xlsx',     'uploaded'),
  -- Pinnacle (full docs) PASS
  ('d1000000-0000-0000-0000-000000000004', 'NDA',             'Pinnacle_NDA.pdf',                'uploaded'),
  ('d1000000-0000-0000-0000-000000000004', 'CIM',             'Pinnacle_InformationMemo.pdf',    'uploaded'),
  ('d1000000-0000-0000-0000-000000000004', 'Financial Model', 'Pinnacle_AuditedFS_2024.pdf',     'uploaded'),
  ('d1000000-0000-0000-0000-000000000004', 'LOI',             'Pinnacle_LOI_Executed.pdf',       'uploaded'),
  -- Meridian Retail (full docs) PASS
  ('d1000000-0000-0000-0000-000000000005', 'NDA',             'Meridian_NDA.pdf',                'uploaded'),
  ('d1000000-0000-0000-0000-000000000005', 'CIM',             'Meridian_CIM.pdf',                'uploaded'),
  ('d1000000-0000-0000-0000-000000000005', 'Financial Model', 'Meridian_LBOModel.xlsx',          'uploaded'),
  ('d1000000-0000-0000-0000-000000000005', 'LOI',             'Meridian_LOI_Signed.pdf',         'uploaded'),
  -- CryptoNova (missing NDA, CIM, contact info) FAIL
  ('d1000000-0000-0000-0000-000000000006', 'NDA',             NULL,                              'missing'),
  ('d1000000-0000-0000-0000-000000000006', 'CIM',             NULL,                              'missing'),
  -- QuickFlip (missing LOI, financials) FAIL
  ('d1000000-0000-0000-0000-000000000010', 'NDA',             'QuickFlip_NDA_Draft.pdf',         'uploaded'),
  ('d1000000-0000-0000-0000-000000000010', 'LOI',             NULL,                              'missing'),
  ('d1000000-0000-0000-0000-000000000010', 'Financial Model', NULL,                              'missing');
