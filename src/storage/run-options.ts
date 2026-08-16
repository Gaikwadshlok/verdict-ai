/**
 * Per-council composer run options — the popover's tool mutes + thinking
 * override. **Sticky**: they apply to every upcoming message in that
 * council until changed back (originally message-scoped with reset-after-
 * send; real use showed the common case is a durable stance — "keep search
 * off here" — so re-arming every message was pure friction).
 *
 * Per-device localStorage (`verdict-ai:run-options:<councilId>`), matching
 * the client-storage pattern: run *preferences* live in localStorage;
 * council data lives in Dexie. Absent key = no overrides. The key is not
 * cleaned up on council delete — a few orphaned bytes beat coupling the
 * council store to UI preferences.
 */

import type { SeatConfig } from '@/types/council'
import { settingsApi } from '@/api/client'

export interface RunOptionsValue {
  mutedTools: string[]
  reasoningEffort: NonNullable<SeatConfig['reasoningEffort']> | null
}

const KEY_PREFIX = 'verdict-ai:run-options:'

// In-memory cache
const cache: Record<string, RunOptionsValue> = {}

// Fetch all run-options on boot
settingsApi.get('__run_options_manifest').then(manifest => {
  if (manifest && Array.isArray(manifest.keys)) {
    for (const key of manifest.keys) {
      settingsApi.get(key).then(val => {
        if (val) cache[key] = val as unknown as RunOptionsValue
      })
    }
  }
}).catch(() => {})

function addToManifest(key: string) {
  settingsApi.get('__run_options_manifest').then(manifest => {
    const keys = manifest?.keys || []
    if (!keys.includes(key)) {
      settingsApi.set('__run_options_manifest', { keys: [...keys, key] })
    }
  })
}

export function getRunOptions(councilId: string): RunOptionsValue {
  const empty: RunOptionsValue = { mutedTools: [], reasoningEffort: null }
  const key = KEY_PREFIX + councilId
  return cache[key] || empty
}

export function getStickyReasoningEffort(
  councilId: string,
): NonNullable<SeatConfig['reasoningEffort']> | undefined {
  return getRunOptions(councilId).reasoningEffort ?? undefined
}

export function setRunOptions(councilId: string, value: RunOptionsValue): void {
  const key = KEY_PREFIX + councilId
  
  if (value.mutedTools.length === 0 && value.reasoningEffort === null) {
    delete cache[key]
    settingsApi.set(key, {}) // Store empty object to clear
    return
  }
  
  cache[key] = value
  settingsApi.set(key, value as any).then(() => {
    addToManifest(key)
  }).catch(() => {})
}
