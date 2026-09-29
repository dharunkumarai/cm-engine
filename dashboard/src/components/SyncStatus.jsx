import React, { useState } from 'react'
import { Link2, CheckCircle, XCircle, ChevronDown, ChevronRight } from 'lucide-react'

export default function SyncStatus({ syncLog }) {
  const [open, setOpen] = useState(false)

  if (!syncLog || syncLog.length === 0) {
    return (
      <div className="panel">
        <h3 className="text-xs font-semibold text-valeon-muted uppercase tracking-wider mb-3 flex items-center gap-2">
          <Link2 size={14} /> CRM Sync (MadeMarket Mock)
        </h3>
        <p className="text-sm text-valeon-muted">Not yet synced. Deal must pass compliance gate first.</p>
      </div>
    )
  }

  const latest = syncLog[0]
  const crmId = latest.response_payload?.id || '—'

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-valeon-muted uppercase tracking-wider flex items-center gap-2">
        <Link2 size={14} /> CRM Sync (MadeMarket Mock)
      </h3>

      {/* Latest sync result */}
      <div className={`flex items-start gap-3 p-4 rounded-xl border ${
        latest.success
          ? 'bg-cyan-900/20 border-cyan-800'
          : 'bg-red-900/20 border-red-800'
      }`}>
        {latest.success
          ? <CheckCircle size={20} className="text-cyan-400 shrink-0 mt-0.5" />
          : <XCircle     size={20} className="text-red-400 shrink-0 mt-0.5"  />
        }
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold ${latest.success ? 'text-cyan-300' : 'text-red-300'}`}>
            {latest.success ? 'Successfully synced to MadeMarket' : 'Sync failed'}
          </p>
          {latest.success && crmId !== '—' && (
            <p className="text-xs text-valeon-muted mt-0.5 font-mono">CRM ID: {crmId}</p>
          )}
          <div className="flex items-center gap-3 mt-1 text-xs text-valeon-muted">
            <span>HTTP {latest.http_status}</span>
            <span>·</span>
            <span>{new Date(latest.synced_at).toLocaleString()}</span>
            {syncLog.length > 1 && <span>· {syncLog.length} attempts</span>}
          </div>
          {latest.error_message && (
            <p className="text-xs text-red-400 mt-1">{latest.error_message}</p>
          )}
        </div>
      </div>

      {/* Payload inspector */}
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1 text-xs text-valeon-muted hover:text-gray-300 transition-colors"
      >
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        {open ? 'Hide' : 'Show'} payload
      </button>

      {open && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-xs font-semibold text-valeon-muted mb-1">Request</p>
            <pre className="text-xs font-mono text-gray-400 bg-black/30 rounded-lg p-2 overflow-x-auto max-h-40">
              {JSON.stringify(latest.request_payload, null, 2)}
            </pre>
          </div>
          <div>
            <p className="text-xs font-semibold text-valeon-muted mb-1">Response</p>
            <pre className="text-xs font-mono text-cyan-300 bg-black/30 rounded-lg p-2 overflow-x-auto max-h-40">
              {JSON.stringify(latest.response_payload, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}
