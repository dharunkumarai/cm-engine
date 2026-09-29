import React, { useState, useEffect, useCallback } from 'react'
import { RefreshCw, Activity, Database, Bot, ShieldCheck, Link2 } from 'lucide-react'
import { fetchDeals } from './lib/api.js'
import DealsList from './components/DealsList.jsx'
import DealDetail from './components/DealDetail.jsx'

const POLL_INTERVAL_MS = 8000

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="panel flex items-center gap-4">
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <p className="text-xs text-valeon-muted uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
      </div>
    </div>
  )
}

export default function App() {
  const [deals, setDeals] = useState([])
  const [selectedDealId, setSelectedDealId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastRefresh, setLastRefresh] = useState(null)

  const loadDeals = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      setError(null)
      const data = await fetchDeals()
      setDeals(data)
      setLastRefresh(new Date())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDeals()
    const timer = setInterval(() => loadDeals(true), POLL_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [loadDeals])

  const stats = {
    total:    deals.length,
    passed:   deals.filter(d => ['passed','synced'].includes(d.status)).length,
    rejected: deals.filter(d => d.status === 'rejected').length,
    synced:   deals.filter(d => d.status === 'synced').length,
    pending:  deals.filter(d => ['ingested','qualifying','qualified','reviewing'].includes(d.status)).length,
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="bg-valeon-blue border-b border-valeon-border px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-valeon-gold flex items-center justify-center font-bold text-valeon-navy text-sm">
            V
          </div>
          <div>
            <h1 className="text-base font-semibold text-white leading-tight">Valeon CM Engine</h1>
            <p className="text-xs text-blue-300">Deal Flow Dashboard · Phase 1</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {lastRefresh && (
            <span className="text-xs text-valeon-muted">
              Updated {lastRefresh.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={() => loadDeals()}
            disabled={loading}
            className="btn bg-valeon-surface hover:bg-valeon-border text-gray-300 disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </header>

      {/* ── Stats bar ────────────────────────────────────────────────────── */}
      <div className="border-b border-valeon-border bg-valeon-surface px-6 py-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-4xl">
          <StatCard icon={Database}    label="Total Deals"   value={stats.total}    color="bg-valeon-accent" />
          <StatCard icon={Activity}    label="In Pipeline"   value={stats.pending}  color="bg-yellow-600"   />
          <StatCard icon={ShieldCheck} label="Passed / Synced" value={`${stats.passed}`} color="bg-emerald-700" />
          <StatCard icon={Bot}         label="Rejected"      value={stats.rejected} color="bg-red-700"      />
        </div>
      </div>

      {/* ── Error banner ─────────────────────────────────────────────────── */}
      {error && (
        <div className="mx-6 mt-4 p-3 bg-red-900/40 border border-red-700 rounded-lg text-sm text-red-300">
          <strong>Connection error:</strong> {error}
          <span className="ml-2 text-red-400 text-xs">
            (Is the agents service running on port 3002?)
          </span>
        </div>
      )}

      {/* ── Main layout ──────────────────────────────────────────────────── */}
      <main className="flex-1 flex overflow-hidden">
        {/* Deals list — left pane */}
        <div className={`flex flex-col border-r border-valeon-border overflow-hidden transition-all ${selectedDealId ? 'w-[420px] min-w-[420px]' : 'flex-1'}`}>
          <div className="px-4 py-3 border-b border-valeon-border flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Deal Pipeline</h2>
            <span className="text-xs text-valeon-muted">{deals.length} deals</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading && deals.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-valeon-muted text-sm">
                <RefreshCw size={16} className="animate-spin mr-2" /> Loading deals...
              </div>
            ) : deals.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-valeon-muted text-sm gap-2">
                <Database size={24} />
                <p>No deals yet. Run the ingestion workflow or seed the database.</p>
              </div>
            ) : (
              <DealsList
                deals={deals}
                selectedId={selectedDealId}
                onSelect={setSelectedDealId}
              />
            )}
          </div>
        </div>

        {/* Deal detail — right pane */}
        {selectedDealId && (
          <div className="flex-1 overflow-y-auto">
            <DealDetail
              dealId={selectedDealId}
              onClose={() => setSelectedDealId(null)}
              onDealUpdated={() => loadDeals(true)}
            />
          </div>
        )}

        {/* Empty right state */}
        {!selectedDealId && deals.length > 0 && (
          <div className="flex-1 flex items-center justify-center text-valeon-muted text-sm">
            <div className="text-center">
              <Link2 size={32} className="mx-auto mb-2 opacity-40" />
              <p>Select a deal to view agent reasoning and compliance details</p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
