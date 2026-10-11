export type SaveState = 'idle' | 'saving' | 'saved' | 'conflict' | 'error'

export interface Autosave<F> {
  /** Records the latest fields, marks them dirty and (re)starts the debounce timer. */
  change(next: F): void
  /** Waits for any in-flight save, then saves pending changes. Resolves true only when nothing is unsaved. */
  flush(): Promise<boolean>
  /** Clears the timer. */
  dispose(): void
}

/**
 * Debounced autosave with a single save in flight. A failure never re-arms by itself (only a new change does);
 * a conflict stops all saving. The baseline is advanced from each successful save before the next one starts.
 */
export function createAutosave<F>(opts: {
  save: (fields: F, baseline: string) => Promise<{ updatedAt: string }>
  baseline: string
  delayMs?: number
  onState: (s: SaveState) => void
  isConflict: (err: unknown) => boolean
}): Autosave<F> {
  const delay = opts.delayMs ?? 1000
  let baseline = opts.baseline
  let latest: F | undefined
  let dirty = false
  let conflict = false
  let failed = false
  let running: Promise<void> | null = null
  let timer: ReturnType<typeof setTimeout> | null = null

  const clear = () => { if (timer) { clearTimeout(timer); timer = null } }
  const arm = () => { clear(); timer = setTimeout(() => { timer = null; if (!running) void start() }, delay) }

  function start(): Promise<void> {
    const fields = latest as F
    dirty = false
    opts.onState('saving')
    running = (async () => {
      try {
        const saved = await opts.save(fields, baseline)
        baseline = saved.updatedAt
        failed = false
        if (dirty) arm()
        else opts.onState('saved')
      } catch (e) {
        dirty = true
        failed = true
        if (opts.isConflict(e)) { conflict = true; opts.onState('conflict') } else opts.onState('error')
      } finally {
        running = null
      }
    })()
    return running
  }

  return {
    change(next) {
      if (conflict) return
      latest = next
      dirty = true
      failed = false
      arm()
    },
    async flush() {
      clear()
      for (;;) {
        if (conflict) return false
        if (running) { await running; if (failed) return false; continue }
        if (!dirty) return true
        await start()
        if (failed) return false
      }
    },
    dispose: clear,
  }
}
