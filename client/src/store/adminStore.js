import { create } from 'zustand'

export const useAdminStore = create((set, get) => ({
  token: localStorage.getItem('cartowl_admin_token') || null,
  requests: [],
  players: [],
  legend: [],

  login: async (password) => {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (!res.ok) throw new Error('Invalid password')
    const { token } = await res.json()
    localStorage.setItem('cartowl_admin_token', token)
    set({ token })
  },

  logout: () => {
    localStorage.removeItem('cartowl_admin_token')
    set({ token: null })
  },

  authHeaders: () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${get().token}`,
  }),

  fetchRequests: async () => {
    const res = await fetch('/api/admin/requests', { headers: get().authHeaders() })
    set({ requests: await res.json() })
  },

  approveRequest: async (id) => {
    await fetch(`/api/admin/requests/${id}`, {
      method: 'PUT', headers: get().authHeaders(),
      body: JSON.stringify({ action: 'approve' }),
    })
    get().fetchRequests()
  },

  rejectRequest: async (id) => {
    await fetch(`/api/admin/requests/${id}`, {
      method: 'PUT', headers: get().authHeaders(),
      body: JSON.stringify({ action: 'reject' }),
    })
    get().fetchRequests()
  },

  fetchPlayers: async () => {
    const res = await fetch('/api/admin/players', { headers: get().authHeaders() })
    set({ players: await res.json() })
  },

  createPlayer: async (name, gold_balance) => {
    await fetch('/api/admin/players', {
      method: 'POST', headers: get().authHeaders(),
      body: JSON.stringify({ name, gold_balance }),
    })
    get().fetchPlayers()
  },

  updatePlayerGold: async (id, gold_balance) => {
    await fetch(`/api/admin/players/${id}`, {
      method: 'PUT', headers: get().authHeaders(),
      body: JSON.stringify({ gold_balance }),
    })
    get().fetchPlayers()
  },

  fetchLegend: async () => {
    const res = await fetch('/api/admin/legend', { headers: get().authHeaders() })
    set({ legend: await res.json() })
  },

  createLegendEntry: async (entry) => {
    await fetch('/api/admin/legend', {
      method: 'POST', headers: get().authHeaders(),
      body: JSON.stringify(entry),
    })
    get().fetchLegend()
  },

  deleteLegendEntry: async (id) => {
    await fetch(`/api/admin/legend/${id}`, {
      method: 'DELETE', headers: get().authHeaders(),
    })
    get().fetchLegend()
  },

  unlockSection: async (x, y, width, height) => {
    await fetch('/api/admin/sections', {
      method: 'POST', headers: get().authHeaders(),
      body: JSON.stringify({ x, y, width, height }),
    })
  },
}))
