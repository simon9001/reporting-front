import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { connectLive, queryKeysForTopics, type EventSourceLike } from './liveClient'

class FakeEventSource implements EventSourceLike {
  onopen: ((e: Event) => void) | null = null
  onerror: ((e: Event) => void) | null = null
  listeners = new Map<string, (e: MessageEvent) => void>()
  closed = false
  readyState = 1
  addEventListener(type: string, fn: (e: MessageEvent) => void) { this.listeners.set(type, fn) }
  close() { this.closed = true }
  emit(type: string, data: string) { this.listeners.get(type)?.(new MessageEvent(type, { data })) }
}

describe('live client', () => {
  it('maps topics to unique query keys and ignores unknown topics', () => {
    const keys = queryKeysForTopics(['incidents', 'shift', 'bogus'])
    expect(keys).toContainEqual(['incidents'])
    expect(keys).toContainEqual(['analytics'])
    expect(keys).toContainEqual(['me'])
    expect(keys.filter((k) => k[0] === 'incidents')).toHaveLength(1)
  })

  it('reports status, forwards topics, and asks for a catch-up after reconnecting', () => {
    const es = new FakeEventSource()
    const statuses: string[] = []
    const topics: string[][] = []
    let reconnects = 0
    const stop = connectLive({ url: '/api/events', create: () => es, onStatus: (s) => statuses.push(s), onTopics: (t) => topics.push(t), onReconnected: () => { reconnects += 1 } })
    es.onopen?.(new Event('open'))
    es.emit('change', '{"topics":["incidents"]}')
    es.emit('change', 'not json')
    es.onerror?.(new Event('error')) // e.g. laptop asleep / Wi-Fi dropped
    es.onopen?.(new Event('open')) // browser reconnected by itself
    expect(statuses).toEqual(['connecting', 'live', 'reconnecting', 'live'])
    expect(topics).toEqual([['incidents']])
    expect(reconnects).toBe(1)
    stop()
    expect(es.closed).toBe(true)
  })

  describe('permanent failure', () => {
    beforeEach(() => { vi.useFakeTimers() })
    afterEach(() => { vi.useRealTimers() })

    it('re-creates a closed stream after a backoff and catches up even if the first open failed', () => {
      const sources: FakeEventSource[] = []
      const statuses: string[] = []
      let reconnects = 0
      connectLive({ url: '/x', create: () => { const s = new FakeEventSource(); sources.push(s); return s }, onStatus: (s) => statuses.push(s), onTopics: () => {}, onReconnected: () => { reconnects += 1 } })
      sources[0]!.readyState = 2
      sources[0]!.onerror?.(new Event('error'))
      expect(sources[0]!.closed).toBe(true)
      expect(sources).toHaveLength(1)
      vi.advanceTimersByTime(999)
      expect(sources).toHaveLength(1)
      vi.advanceTimersByTime(1)
      expect(sources).toHaveLength(2)
      sources[1]!.onopen?.(new Event('open'))
      expect(reconnects).toBe(1)
      expect(statuses).toEqual(['connecting', 'reconnecting', 'live'])
    })

    it('doubles the delay up to a cap', () => {
      const sources: FakeEventSource[] = []
      connectLive({ url: '/x', create: () => { const s = new FakeEventSource(); sources.push(s); return s }, onStatus: () => {}, onTopics: () => {}, onReconnected: () => {} })
      const fail = () => { const s = sources[sources.length - 1]!; s.readyState = 2; s.onerror?.(new Event('error')) }
      for (let i = 0; i < 8; i++) { fail(); vi.advanceTimersByTime(30000) }
      const n = sources.length
      fail()
      vi.advanceTimersByTime(29999)
      expect(sources).toHaveLength(n)
      vi.advanceTimersByTime(1)
      expect(sources).toHaveLength(n + 1)
    })

    it('creates no new source when stopped during the backoff', () => {
      const sources: FakeEventSource[] = []
      const stop = connectLive({ url: '/x', create: () => { const s = new FakeEventSource(); sources.push(s); return s }, onStatus: () => {}, onTopics: () => {}, onReconnected: () => {} })
      sources[0]!.readyState = 2
      sources[0]!.onerror?.(new Event('error'))
      stop()
      vi.advanceTimersByTime(60000)
      expect(sources).toHaveLength(1)
    })
  })
})
