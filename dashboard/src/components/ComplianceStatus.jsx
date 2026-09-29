import React from 'react'
import { ShieldCheck, ShieldX, AlertTriangle, Info } from 'lucide-react'

const SEVERITY_CONFIG = {
  critical: { icon: ShieldX,       color: 'text-red-400',    bg: 'bg-red-900/30 border-red-800',      label: 'Critical' },
  warning:  { icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-900/30 border-yellow-800', label: 'Warning'  },
  info:     { icon: Info,          color: 'text-blue-400',   bg: 'bg-blue-900/20 border-blue-900',     label: 'Info'     },
}

function IssueRow({ issue }) {
  const cfg = SEVERITY_CONFIG[issue.severity] || SEVERITY_CONFIG.warning
  const Icon = cfg.icon
  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border ${cfg.bg}`}>
      <Icon size={14} className={`${cfg.color} mt-0.5 shrink-0`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={`text-xs font-semibold font-mono ${cfg.color}`}>{issue.rule_code}</span>
          <span className={`badge text-xs ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
        </div>
        <p className="text-sm text-gray-300">{issue.description}</p>
      </div>
    </div>
  )
}

export default function ComplianceStatus({ compliance }) {
  if (!compliance) {
    return (
      <div className="panel">
        <h3 className="text-xs font-semibold text-valeon-muted uppercase tracking-wider mb-3 flex items-center gap-2">
          <ShieldCheck size={14} /> Compliance Review
        </h3>
        <p className="text-sm text-valeon-muted">No compliance check run yet.</p>
      </div>
    )
  }

  const issues = Array.isArray(compliance.issues)
    ? compliance.issues
    : (typeof compliance.issues === 'string' ? JSON.parse(compliance.issues) : [])

  const isPassed = compliance.result === 'pass'
  const criticals = issues.filter(i => i.severity === 'critical').length
  const warnings  = issues.filter(i => i.severity === 'warning').length

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold text-valeon-muted uppercase tracking-wider flex items-center gap-2">
        <ShieldCheck size={14} /> Compliance Review
      </h3>

      {/* Verdict banner */}
      <div className={`flex items-center gap-3 p-4 rounded-xl border ${
        isPassed
          ? 'bg-emerald-900/30 border-emerald-700'
          : 'bg-red-900/30 border-red-700'
      }`}>
        {isPassed
          ? <ShieldCheck size={24} className="text-emerald-400" />
          : <ShieldX     size={24} className="text-red-400" />
        }
        <div>
          <p className={`text-base font-bold ${isPassed ? 'text-emerald-400' : 'text-red-400'}`}>
            {isPassed ? 'COMPLIANCE PASSED' : 'COMPLIANCE FAILED'}
          </p>
          <p className="text-xs text-valeon-muted mt-0.5">
            {isPassed
              ? 'All critical requirements satisfied — deal cleared for CRM sync'
              : `${criticals} critical issue${criticals !== 1 ? 's' : ''} blocking progression${warnings ? `, ${warnings} warning${warnings !== 1 ? 's' : ''}` : ''}`
            }
          </p>
        </div>
      </div>

      {/* Issues list */}
      {issues.length > 0 && (
        <div className="space-y-2">
          {issues.map((issue, i) => (
            <IssueRow key={i} issue={issue} />
          ))}
        </div>
      )}

      {/* Reasoning */}
      {compliance.reasoning && (
        <div className="panel">
          <p className="text-xs font-semibold text-valeon-muted uppercase tracking-wider mb-2">Agent Reasoning</p>
          <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono leading-relaxed max-h-60 overflow-y-auto">
            {compliance.reasoning}
          </pre>
        </div>
      )}

      <p className="text-xs text-valeon-muted">
        Checked: {new Date(compliance.checked_at).toLocaleString()}
      </p>
    </div>
  )
}
