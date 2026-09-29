import React, { useState } from 'react'
import { Bot, ChevronDown, ChevronRight, Clock, Cpu } from 'lucide-react'

const AGENT_LABELS = {
  deal_qualifier:      { name: 'Agent A — Deal Qualifier',       color: 'text-blue-400',   bg: 'bg-blue-900/30 border-blue-700' },
  compliance_reviewer: { name: 'Agent B — Compliance Reviewer',  color: 'text-purple-400', bg: 'bg-purple-900/30 border-purple-700' },
}

function AgentRunCard({ run }) {
  const [open, setOpen] = useState(false)
  const cfg = AGENT_LABELS[run.agent_name] || { name: run.agent_name, color: 'text-gray-400', bg: 'bg-gray-800 border-gray-700' }
  const ts = new Date(run.created_at).toLocaleString()

  return (
    <div className={`border rounded-lg overflow-hidden ${cfg.bg}`}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Bot size={16} className={cfg.color} />
          <div>
            <p className={`text-sm font-semibold ${cfg.color}`}>{cfg.name}</p>
            <div className="flex items-center gap-3 text-xs text-valeon-muted mt-0.5">
              <span className="flex items-center gap-1"><Clock size={10} />{ts}</span>
              {run.duration_ms && (
                <span className="flex items-center gap-1"><Cpu size={10} />{run.duration_ms}ms</span>
              )}
              {run.input_tokens > 0 && (
                <span>{run.input_tokens + run.output_tokens} tokens</span>
              )}
              <span className={run.status === 'success' ? 'text-emerald-400' : 'text-red-400'}>
                {run.status}
              </span>
            </div>
          </div>
        </div>
        {open ? <ChevronDown size={16} className="text-valeon-muted" /> : <ChevronRight size={16} className="text-valeon-muted" />}
      </button>

      {open && (
        <div className="border-t border-white/10 px-4 py-3 space-y-3">
          {/* Reasoning */}
          {run.reasoning && (
            <div>
              <p className="text-xs font-semibold text-valeon-muted uppercase tracking-wider mb-2">Reasoning</p>
              <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono leading-relaxed bg-black/20 rounded-lg p-3 max-h-80 overflow-y-auto">
                {run.reasoning}
              </pre>
            </div>
          )}

          {/* Output */}
          {run.output_payload && (
            <div>
              <p className="text-xs font-semibold text-valeon-muted uppercase tracking-wider mb-2">Output</p>
              <pre className="text-xs text-emerald-300 font-mono bg-black/20 rounded-lg p-3 overflow-x-auto">
                {JSON.stringify(run.output_payload, null, 2)}
              </pre>
            </div>
          )}

          {/* Model */}
          <p className="text-xs text-valeon-muted">
            Model: <span className="text-gray-400 font-mono">{run.model}</span>
            {run.agent_version && <span className="ml-2 text-gray-600">· {run.agent_version}</span>}
          </p>

          {/* Error */}
          {run.error_message && (
            <p className="text-xs text-red-400 font-mono">{run.error_message}</p>
          )}
        </div>
      )}
    </div>
  )
}

export default function AgentReasoning({ agentRuns }) {
  if (!agentRuns || agentRuns.length === 0) {
    return (
      <div className="panel">
        <h3 className="text-xs font-semibold text-valeon-muted uppercase tracking-wider mb-3 flex items-center gap-2">
          <Bot size={14} /> Agent Runs
        </h3>
        <p className="text-sm text-valeon-muted">No agent runs yet. Trigger the orchestration workflow to process this deal.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-valeon-muted uppercase tracking-wider flex items-center gap-2">
        <Bot size={14} /> Agent Runs ({agentRuns.length})
      </h3>
      {agentRuns.map(run => (
        <AgentRunCard key={run.id} run={run} />
      ))}
    </div>
  )
}
