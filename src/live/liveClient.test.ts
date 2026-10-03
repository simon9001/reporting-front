import { describe, expect, it } from 'vitest'
import { connectLive, queryKeysForTopics, type EventSourceLike } from './liveClient'

class FakeEventSource implements EventSourceLike {
  onopen: ((e: Event) => void) | null = null
  onerror: ((e: Event) => void) | null = null
  listeners = new Map<string, (e: MessageEvent) => void>()
  closed = false
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
})
