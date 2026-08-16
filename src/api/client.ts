import type { Council, Seat, Turn } from '@/types/council'

const API_BASE = '/api'

export const councilsApi = {
  list: async (): Promise<Council[]> => {
    const res = await fetch(`${API_BASE}/councils`)
    if (!res.ok) throw new Error('Failed to list councils')
    return res.json()
  },
  create: async (council: Partial<Council>): Promise<Council> => {
    const res = await fetch(`${API_BASE}/councils`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(council)
    })
    if (!res.ok) throw new Error('Failed to create council')
    return res.json()
  },
  get: async (id: string): Promise<Council> => {
    const res = await fetch(`${API_BASE}/councils/${id}`)
    if (!res.ok) throw new Error('Failed to get council')
    return res.json()
  },
  update: async (id: string, updates: Partial<Council>): Promise<Council> => {
    const res = await fetch(`${API_BASE}/councils/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    })
    if (!res.ok) throw new Error('Failed to update council')
    return res.json()
  },
  delete: async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/councils/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to delete council')
  },
  addSeat: async (councilId: string, seat: Seat): Promise<void> => {
    const res = await fetch(`${API_BASE}/councils/${councilId}/seats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(seat)
    })
    if (!res.ok) throw new Error('Failed to add seat')
  },
  updateSeat: async (councilId: string, seatId: string, seat: Partial<Seat>): Promise<void> => {
    const res = await fetch(`${API_BASE}/councils/${councilId}/seats/${seatId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(seat)
    })
    if (!res.ok) throw new Error('Failed to update seat')
  },
  deleteSeat: async (councilId: string, seatId: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/councils/${councilId}/seats/${seatId}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to delete seat')
  },
  appendTurn: async (councilId: string, turn: Turn): Promise<void> => {
    const res = await fetch(`${API_BASE}/councils/${councilId}/turns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(turn)
    })
    if (!res.ok) throw new Error('Failed to append turn')
  },
  updateTurn: async (councilId: string, turnId: string, turn: Partial<Turn>): Promise<void> => {
    const res = await fetch(`${API_BASE}/councils/${councilId}/turns/${turnId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(turn)
    })
    if (!res.ok) throw new Error('Failed to update turn')
  },
  deleteTurn: async (councilId: string, turnId: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/councils/${councilId}/turns/${turnId}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to delete turn')
  }
}

export const keysApi = {
  list: async (): Promise<Array<{provider: string, maskedKey: string}>> => {
    const res = await fetch(`${API_BASE}/keys`)
    if (!res.ok) throw new Error('Failed to list keys')
    return res.json()
  },
  set: async (provider: string, key: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/keys/${provider}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key })
    })
    if (!res.ok) throw new Error('Failed to set key')
  },
  delete: async (provider: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/keys/${provider}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to delete key')
  }
}

export const settingsApi = {
  get: async (key: string): Promise<Record<string, any>> => {
    const res = await fetch(`${API_BASE}/settings/${key}`)
    if (!res.ok) throw new Error('Failed to get setting')
    const json = await res.json()
    return json.value || {}
  },
  set: async (key: string, value: Record<string, any>): Promise<void> => {
    const res = await fetch(`${API_BASE}/settings/${key}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value })
    })
    if (!res.ok) throw new Error('Failed to set setting')
  }
}
