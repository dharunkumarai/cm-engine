import React from 'react'
import { clsx } from 'clsx'
import { DollarSign, Calendar, Building2, TrendingUp } from 'lucide-react'

const STATUS_CONFIG = {
  ingested:   { label: 'Ingested',   color: 'bg-gray-700 text-gray-200',        dot: 'bg-gray-400'    },
  qualifying: { label: 'Qualifying', color: 'bg-yellow-900 text-yellow-300',     dot: 'bg-yellow-400'  },
  qualified:  { label: 'Qualified',  color: 'bg-blue-900 text-blue-300',         dot: 'bg-blue-400'    },
  reviewing:  { label: 'Reviewing',  color: 'bg-purple-900 text-purple-300',     dot: 'bg-purple-400'  },
  passed:     { label: 'Passed ✓',  color: 'bg-emerald-900 text-emerald-300',   dot: 'bg-emerald-400' },
  rejected:   { label: 'Rejected ✗', color: 'bg-red-900 text-red-300',          dot: 'bg-red-400'     },
  synced:     { label: 'Synced ↑',  color: 'bg-cyan-900 text-cyan-300',         dot: 'bg-cyan-400'    },
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.ingested
  return (
    <span className={`badge ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

function ComplianceDot({ result }) {
  if (!result) return <span className="text-xs text-valeon-muted">—</span>
  return result === 'pass'
    ? <span className="text-xs font-medium text-emerald-400">✓ Pass</span>
    : <span className="text-xs font-medium text-red-400">✗ Fail</span>
}

function formatUSD(n) {
  if (!n) return '—'
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`
  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`
  return `$${n.toLocaleString()}`
}

export default function DealsList({ deals, selectedId, onSelect }) {
  return (
    <div className="divide-y divide-valeon-border">
      {deals.map(deal => {
        const isSelected = deal.id === selectedId
        return (
          <button
            key={deal.id}
            onClick={() => onSelect(deal.id)}
            className={clsx(
              'w-full text-left px-4 py-3 transition-colors hover:bg-valeon-panel',
              isSelected && 'bg-valeon-panel border-l-2 border-valeon-accent'
            )}
          >
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{deal.name}</p>
                <p className="text-xs text-valeon-muted truncate flex items-center gap-1 mt-0.5">
                  <Building2 size={10} />
                  {deal.company_name || '—'} · {deal.deal_type || '—'}
                </p>
              </div>
              <StatusBadge status={deal.status} />
            </div>

            <div className="flex items-center gap-3 text-xs text-valeon-muted">
              <span className="flex items-center gap-1">
                <DollarSign size={10} />
                {formatUSD(deal.deal_size_usd)}
              </span>
              <span className="text-valeon-border">·</span>
              <span>{deal.sector || '—'}</span>
              <span className="text-valeon-border">·</span>
              <ComplianceDot result={deal.compliance_result} />
              {deal.qualification_score && (
                <>
                  <span className="text-valeon-border">·</span>
                  <span className="flex items-center gap-1">
                    <TrendingUp size={10} />
                    Score {deal.qualification_score}/10
                  </span>
                </>
              )}
            </div>

            {deal.rejection_reason && (
              <p className="mt-1.5 text-xs text-red-400 truncate">
                ✗ {deal.rejection_reason}
              </p>
            )}
          </button>
        )
      })}
    </div>
  )
}
