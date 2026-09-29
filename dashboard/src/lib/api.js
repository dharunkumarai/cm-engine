/**
 * API client for the Valeon Dashboard.
 * Calls the agents service read API (proxied via Vite dev server).
 */

const BASE = '/api';

export async function fetchDeals() {
  const res = await fetch(`${BASE}/deals`);
  if (!res.ok) throw new Error(`Failed to fetch deals: ${res.statusText}`);
  const data = await res.json();
  return data.deals || [];
}

export async function fetchDeal(id) {
  const res = await fetch(`${BASE}/deals/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch deal ${id}: ${res.statusText}`);
  return res.json();
}

export async function runPipeline(id) {
  const res = await fetch(`${BASE}/pipeline/${id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`Failed to run pipeline: ${res.statusText}`);
  return res.json();
}
