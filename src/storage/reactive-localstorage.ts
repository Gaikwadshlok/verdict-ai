/**
 * Reactive localStorage adapter factory.
 *
 * Three storage modules — `keys.ts`, `behavior.ts`, `prompts.ts` —
 * each implemented the same `getX` / `setX` / `X_CHANGED_EVENT`
 * pattern with shape-guarded JSON.parse and a custom dispatchEvent
 * for in-tab reactivity. This factory hosts that pattern in one
 * place so the three call sites stop drifting independently.
 *
 * The only thing that varies per call site is the sanitize step —
 * different shapes have different "empty / absent" semantics (an
 * unset BYOK key is `undefined`; an unset Behavior knob is also
 * `undefined`, but `false` / `0` are valid values that must survive).
 * Callers provide their own `sanitize` if the default identity isn't
 * enough.
 */

import { settingsApi } from '@/api/client'

export interface ReactiveStorage<T extends object> {
  /** Read the current value. Returns `defaultValue` for missing /
   *  corrupt rows. Never throws. */
  get(): T
  /** Write + dispatch the custom event. Cross-tab updates also fire
   *  the native `storage` event automatically. */
  set(value: T): void
  /** Custom event name; hooks subscribe to this *and* `'storage'`. */
  eventName: string
}

export function createReactiveLocalStorage<T extends object>(opts: {
  storageKey: string
  eventName: string
  defaultValue: T
  /** Optional: post-process value before write (strip empty fields,
   *  etc.). Defaults to identity. */
  sanitize?: (value: T) => T
}): ReactiveStorage<T> {
  const {
    storageKey,
    eventName,
    defaultValue,
    sanitize = (v: T) => v,
  } = opts

  let cachedValue: T = defaultValue

  // Fetch initial value from backend
  settingsApi.get(storageKey)
    .then(val => {
      if (val && Object.keys(val).length > 0) {
        cachedValue = val as T
        window.dispatchEvent(new Event(eventName))
      }
    })
    .catch(err => console.error(`[reactive-apistorage] failed to fetch ${storageKey}`, err))

  function get(): T {
    return cachedValue
  }

  function set(value: T): void {
    const clean = sanitize(value)
    cachedValue = clean
    
    settingsApi.set(storageKey, clean)
      .catch(err => {
        console.warn(`[reactive-apistorage] write failed for ${storageKey}:`, err)
      })

    // Notify in-tab listeners
    window.dispatchEvent(new Event(eventName))
  }

  return { get, set, eventName }
}
