/**
 * BYOK API keys, stored per-device in localStorage.
 *
 * Keys never travel to our server — they're loaded here and handed
 * directly to the AI SDK provider instance in the browser. See the
 * BYOK section of README.md for the architectural guarantee.
 */

import type { ProviderId } from '@/models/registry'
import { keysApi } from '@/api/client'

export type ApiKeys = Partial<Record<ProviderId, string>>

// Local cache to keep synchronous reads working (since getApiKeys is heavily used)
let cachedKeys: ApiKeys = {}

// Fetch initial keys in the background
keysApi.list().then(keys => {
  const clean: ApiKeys = {}
  for (const k of keys) {
    clean[k.provider as ProviderId] = k.maskedKey
  }
  cachedKeys = clean
  window.dispatchEvent(new Event('verdict-ai:keys-changed'))
}).catch(console.error)

export const getApiKeys = () => cachedKeys

export const setApiKeys = async (keys: ApiKeys) => {
  // Diff and set
  for (const [k, v] of Object.entries(keys)) {
    if (v) {
      await keysApi.set(k, v)
    } else {
      await keysApi.delete(k)
    }
  }
  // Refresh cache
  const list = await keysApi.list()
  const clean: ApiKeys = {}
  for (const k of list) {
    clean[k.provider as ProviderId] = k.maskedKey
  }
  cachedKeys = clean
  window.dispatchEvent(new Event('verdict-ai:keys-changed'))
}

export const keysAdapter = {
  get: getApiKeys,
  set: setApiKeys,
  eventName: 'verdict-ai:keys-changed',
  subscribe: (cb: () => void) => {
    window.addEventListener('verdict-ai:keys-changed', cb)
    return () => window.removeEventListener('verdict-ai:keys-changed', cb)
  }
}
