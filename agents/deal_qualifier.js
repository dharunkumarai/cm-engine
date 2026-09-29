/**
 * Agent A — Deal Qualifier
 *
 * Reads a deal record and scores/tags it against qualification criteria.
 * In MOCK mode, returns deterministic responses based on deal properties
 * so the system runs without an Anthropic API key.
 */

const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');

const SYSTEM_PROMPT = fs.readFileSync(
  path.join(__dirname, 'prompts', 'deal_qualifier.md'),
  'utf8'
);

class DealQualifier {
  constructor({ anthropicApiKey, mockMode = false }) {
    this.mockMode = mockMode || !anthropicApiKey;
    if (!this.mockMode) {
      this.client = new Anthropic({ apiKey: anthropicApiKey });
    }
  }

  /**
   * Qualify a deal record.
   * @param {Object} deal  Full deal row with company and contact fields
   * @returns {Object}     { score, tags, reasoning, model, inputTokens, outputTokens }
   */
  async qualify(deal) {
    if (this.mockMode) {
      return this._mockQualify(deal);
    }
    return this._claudeQualify(deal);
  }

  async _claudeQualify(deal) {
    const userMessage = `Please qualify the following deal record:\n\n${JSON.stringify(deal, null, 2)}`;

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    });

    const content = response.content[0].text;
    let parsed;
    try {
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) ||
                        content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      parsed = JSON.parse(jsonStr);
    } catch (e) {
      parsed = {
        score: 5,
        tags: ['parse-error'],
        reasoning: content,
      };
    }

    return {
      score: Math.min(10, Math.max(1, parseInt(parsed.score, 10) || 5)),
      tags: Array.isArray(parsed.tags) ? parsed.tags : [],
      reasoning: parsed.reasoning || content,
      model: 'claude-sonnet-4-5',
      inputTokens: response.usage?.input_tokens || 0,
      outputTokens: response.usage?.output_tokens || 0,
    };
  }

  _mockQualify(deal) {
    const size = Number(deal.deal_size_usd) || 0;
    const sector = (deal.sector || '').toLowerCase();

    let score;
    const tags = [];

    if (size >= 100000000) { score = 8 + (size >= 200000000 ? 1 : 0); tags.push('large-cap'); }
    else if (size >= 40000000) { score = 7; tags.push('mid-market'); }
    else if (size >= 10000000) { score = 5; tags.push('small-cap'); }
    else { score = 2; tags.push('sub-threshold'); }

    if (['technology', 'healthcare', 'financial services'].includes(sector)) tags.push('high-priority-sector');
    if (['energy', 'retail'].includes(sector)) tags.push('cyclical-sector');
    if (['crypto', 'fintech'].includes(sector)) tags.push('high-risk-sector');

    if (deal.deal_type === 'M&A') tags.push('m-and-a');
    if (deal.deal_type === 'PE') tags.push('private-equity');
    if (deal.deal_type === 'VC') tags.push('venture');
    if (deal.deal_type === 'Debt') tags.push('debt-finance');

    score = Math.min(10, Math.max(1, score));

    const reasoning = `[AUTOMATED QUALIFICATION ANALYSIS] Deal: "${deal.name}":

• Deal Size: $${(size / 1000000).toFixed(1)}M → ${size >= 10000000 ? 'Meets Valeon mandate size requirements' : 'BELOW minimum threshold ($10M)'}
• Sector: ${deal.sector || 'Unassigned'} → ${tags.includes('high-priority-sector') ? 'High-priority target sector' : 'Secondary sector'}
• Deal Structure: ${deal.deal_type || 'Unspecified'}
• Target Counterparty: ${deal.company_name || 'N/A'} (${deal.hq_country || 'US'})

Assigned Score: ${score}/10
Sector & Structuring Tags: [${tags.join(', ')}]

Strategic Assessment: ${
  score >= 7
    ? 'Solid capital markets fit. Revenue model and capital requirements align with primary syndicate investor mandates. Recommending immediate progression to compliance gate.'
    : score >= 5
    ? 'Borderline qualification profile. Core transaction viable but pricing and debt-service dynamics require partner review.'
    : 'Sub-threshold sizing and heightened asset class risk profile. Fails primary qualification criteria for Tier-1 advisory engagement.'
}`;

    return {
      score,
      tags,
      reasoning,
      model: 'qualifier-engine-v1',
      inputTokens: 320,
      outputTokens: 145,
    };
  }
}

module.exports = DealQualifier;
