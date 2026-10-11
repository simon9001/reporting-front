import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createAutosave } from './autosave'

const isConflict = (e: unknown) => e === 'conflict'
beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

function deferred<T>() {
  let resolve!: (v: T) => void, reject!: (e: unknown) => void
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej })
  return { promise, resolve, reject }
}

describe('createAutosave', () => {
  it('debounces: three changes within 1s make one save with the last fields', async () => {
    const save = vi.fn().mockResolvedValue({ updatedAt: 'v2' })
    const a = createAutosave<string>({ save, baseline: 'v1', onState: () => {}, isConflict })
    a.change('a'); await vi.advanceTimersByTimeAsync(400)
    a.change('ab'); await vi.advanceTimersByTimeAsync(400)
    a.change('abc'); await vi.advanceTimersByTimeAsync(999)
    expect(save).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1)
    expect(save).toHaveBeenCalledTimes(1)
    expect(save).toHaveBeenCalledWith('abc', 'v1')
  })

  it('does not retry after a failure until the next change', async () => {
    const save = vi.fn().mockRejectedValue(new Error('net'))
    const states: string[] = []
    const a = createAutosave<string>({ save, baseline: 'v1', onState: (s) => states.push(s), isConflict })
    a.change('x'); await vi.advanceTimersByTimeAsync(1000)
    await vi.advanceTimersByTimeAsync(10_000)
    expect(save).toHaveBeenCalledTimes(1)
    expect(states.at(-1)).toBe('error')
    a.change('xy'); await vi.advanceTimersByTimeAsync(1000)
    expect(save).toHaveBeenCalledTimes(2)
  })

  it('stops saving after a conflict', async () => {
    const save = vi.fn().mockRejectedValue('conflict')
    const states: string[] = []
    const a = createAutosave<string>({ save, baseline: 'v1', onState: (s) => states.push(s), isConflict })
    a.change('x'); await vi.advanceTimersByTimeAsync(1000)
    expect(states.at(-1)).toBe('conflict')
    a.change('xy'); await vi.advanceTimersByTimeAsync(5000)
    expect(await a.flush()).toBe(false)
    expect(save).toHaveBeenCalledTimes(1)
  })

  it('flush waits for an in-flight save, then saves newer changes with the new baseline', async () => {
    const first = deferred<{ updatedAt: string }>()
    const save = vi.fn().mockReturnValueOnce(first.promise).mockResolvedValue({ updatedAt: 'v3' })
    const a = createAutosave<string>({ save, baseline: 'v1', onState: () => {}, isConflict })
    a.change('a'); await vi.advanceTimersByTimeAsync(1000)
    expect(save).toHaveBeenCalledTimes(1)
    a.change('ab')
    const flushed = a.flush()
    await vi.advanceTimersByTimeAsync(0)
    expect(save).toHaveBeenCalledTimes(1)
    first.resolve({ updatedAt: 'v2' })
    expect(await flushed).toBe(true)
    expect(save).toHaveBeenCalledTimes(2)
    expect(save).toHaveBeenLastCalledWith('ab', 'v2')
  })

  it('flush resolves false when the save fails', async () => {
    const save = vi.fn().mockRejectedValue(new Error('net'))
    const a = createAutosave<string>({ save, baseline: 'v1', onState: () => {}, isConflict })
    a.change('x')
    expect(await a.flush()).toBe(false)
  })

  it('reports pending as soon as there are unsaved edits', async () => {
    const save = vi.fn().mockResolvedValue({ updatedAt: 'v2' })
    const states: string[] = []
    const a = createAutosave<string>({ save, baseline: 'v1', onState: (s) => states.push(s), isConflict })
    a.change('a')
    expect(states).toEqual(['pending'])
    await vi.advanceTimersByTimeAsync(1000)
    expect(states).toEqual(['pending', 'saving', 'saved'])
  })

  it('a flush after dispose still saves the pending edit', async () => {
    const save = vi.fn().mockResolvedValue({ updatedAt: 'v2' })
    const a = createAutosave<string>({ save, baseline: 'v1', onState: () => {}, isConflict })
    a.change('typed just before leaving')
    a.dispose()
    await vi.advanceTimersByTimeAsync(5000)
    expect(save).not.toHaveBeenCalled() // dispose only clears the timer
    expect(await a.flush()).toBe(true)
    expect(save).toHaveBeenCalledWith('typed just before leaving', 'v1')
  })

  it('never runs two saves at once', async () => {
    let active = 0, peak = 0
    const save = vi.fn(async () => {
      active++; peak = Math.max(peak, active)
      await new Promise((r) => setTimeout(r, 2500))
      active--
      return { updatedAt: 'v' + Math.random() }
    })
    const a = createAutosave<string>({ save, baseline: 'v1', onState: () => {}, isConflict })
    a.change('a'); await vi.advanceTimersByTimeAsync(1000)
    a.change('ab'); await vi.advanceTimersByTimeAsync(1000)
    a.change('abc'); await vi.advanceTimersByTimeAsync(10_000)
    await a.flush()
    expect(peak).toBe(1)
    expect(save).toHaveBeenLastCalledWith('abc', expect.any(String))
  })
})
