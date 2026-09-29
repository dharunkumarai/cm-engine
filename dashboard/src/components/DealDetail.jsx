import React, { useState, useEffect } from 'react'
import { X, Play, RefreshCw, Tag } from 'lucide-react'
import { fetchDeal, runPipeline } from '../lib/api.js'
import AgentReasoning from './AgentReasoning.jsx'
import ComplianceStatus from './ComplianceStatus.jsx'
import SyncStatus from './SyncStatus.jsx'

function formatUSD(n) {
  if (!n) return '—'
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`
  return `$${n.toLocaleString()}`
}

function InfoRow({ label, value }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-2 text-sm">
      <span className="text-valeon-muted w-32 shrink-0 pt-0.5">{label}</span>
      <span className="text-gray-200 break-words">{value}</span>
    </div>
  )
}

const STATUS_COLORS = {
  ingested:   'text-gray-400',
  qualifying: 'text-yellow-400',
  qualified:  'text-blue-400',
  reviewing:  'text-purple-400',
  passed:     'text-emerald-400',
  rejected:   'text-red-400',
  synced:     'text-cyan-400',
}

export default function DealDetail({ dealId, onClose, onDealUpdated }) {
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState(null)

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchDeal(dealId)
      setDetail(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [dealId])

  const handleRunPipeline = async () => {
    try {
      setRunning(true)
      await runPipeline(dealId)
      await loadData()
      if (onDealUpdated) onDealUpdated()
    } catch (err) {
      alert(`Error running pipeline: ${err.message}`)
    } finally {
      setRunning(false)
    }
  }

  if (loading && !detail) {
    return (
      <div className="flex items-center justify-center h-40 text-valeon-muted text-sm">
        <RefreshCw size={16} className="animate-spin mr-2" /> Loading deal...
      </div>
    )
  }

  if (error && !detail) {
    return (
      <div className="p-6 text-red-400 text-sm">Error: {error}</div>
    )
  }

  if (!detail) return null

  const { deal, agent_runs, compliance, sync_log, documents } = detail
  const statusColor = STATUS_COLORS[deal.status] || 'text-gray-400'

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-valeon-border flex items-start justify-between gap-4 bg-valeon-surface">
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-semibold text-white truncate">{deal.name}</h2>
          <div className="flex items-center gap-2 mt-1 text-xs text-valeon-muted">
            <span className={`font-medium ${statusColor} uppercase font-mono`}>{deal.status}</span>
            <span>·</span>
            <span>{deal.deal_type}</span>
            <span>·</span>
            <span>{formatUSD(deal.deal_size_usd)}</span>
            {deal.qualification_score && (
              <>
                <span>·</span>
                <span>Score {deal.qualification_score}/10</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleRunPipeline}
            disabled={running}
            className="btn bg-valeon-accent hover:bg-blue-600 text-white text-xs py-1 px-3"
            title="Trigger Agent A (Qualify) -> Agent B (Compliance Gate) -> CRM Sync"
          >
            {running ? <RefreshCw size={12} className="animate-spin" /> : <Play size={12} />}
            {running ? 'Processing...' : 'Run Pipeline'}
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-valeon-border text-valeon-muted transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* Rejection alert */}
        {deal.rejection_reason && (
          <div className="p-3 bg-red-900/40 border border-red-700 rounded-lg">
            <p className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-1">
              Rejected — Compliance Gate Blocked This Deal
            </p>
            <p className="text-sm text-red-300">{deal.rejection_reason}</p>
          </div>
        )}

        {/* Tags */}
        {deal.tags && deal.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {deal.tags.map(tag => (
              <span key={tag} className="badge bg-valeon-blue text-blue-300">
                <Tag size={10} />{tag}
              </span>
            ))}
          </div>
        )}

        {/* Deal info */}
        <div className="panel space-y-2">
          <h3 className="text-xs font-semibold text-valeon-muted uppercase tracking-wider mb-3">Deal Information</h3>
          <InfoRow label="Company"      value={deal.company_name} />
          <InfoRow label="Sector"       value={`${deal.sector || '—'}${deal.subsector ? ` / ${deal.subsector}` : ''}`} />
          <InfoRow label="Deal Type"    value={deal.deal_type} />
          <InfoRow label="Deal Size"    value={formatUSD(deal.deal_size_usd)} />
          <InfoRow label="HQ Country"   value={deal.hq_country} />
          {deal.description && (
            <div className="pt-2 border-t border-valeon-border">
              <p className="text-xs text-valeon-muted mb-1">Description</p>
              <p className="text-sm text-gray-300 leading-relaxed">{deal.description}</p>
            </div>
          )}
        </div>

        {/* Contact */}
        {(deal.first_name || deal.email) && (
          <div className="panel space-y-2">
            <h3 className="text-xs font-semibold text-valeon-muted uppercase tracking-wider mb-3">Primary Contact</h3>
            <InfoRow label="Name"  value={`${deal.first_name || ''} ${deal.last_name || ''}`.trim() || null} />
            <InfoRow label="Title" value={deal.title} />
            <InfoRow label="Email" value={deal.email} />
            <InfoRow label="Phone" value={deal.phone} />
          </div>
        )}

        {/* Documents */}
        {documents && documents.length > 0 && (
          <div className="panel">
            <h3 className="text-xs font-semibold text-valeon-muted uppercase tracking-wider mb-3">Documents</h3>
            <div className="space-y-1.5">
              {documents.map(doc => (
                <div key={doc.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">{doc.doc_type}</span>
                  <span className={`text-xs font-medium ${
                    doc.status === 'uploaded' ? 'text-emerald-400' :
                    doc.status === 'missing'  ? 'text-red-400' : 'text-yellow-400'
                  }`}>
                    {doc.status === 'uploaded' ? '✓ Uploaded' :
                     doc.status === 'missing'  ? '✗ Missing'  : '○ Pending'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Agent Reasoning */}
        <AgentReasoning agentRuns={agent_runs} />

        {/* Compliance Status */}
        <ComplianceStatus compliance={compliance} />

        {/* Sync Status */}
        <SyncStatus syncLog={sync_log} />

      </div>
    </div>
  )
}
