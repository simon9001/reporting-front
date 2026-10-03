import { LIVE_TOPICS, type LiveTopic } from '@sr/shared'

export type LiveStatus = 'connecting' | 'live' | 'reconnecting'

/** Server topic → TanStack Query key prefixes to refetch. */
export const TOPIC_QUERY_KEYS: Record<LiveTopic, readonly (readonly string[])[]> = {
  incidents: [['incidents'], ['incident'], ['analytics'], ['search']],
  roster: [['roster'], ['me']],
  shift: [['me'], ['roster'], ['incidents'], ['analytics']],
  users: [['users'], ['search']],
  config: [['config']],
  audit: [['audit']],
}

export function queryKeysForTopics(topics: readonly string[]): (readonly string[])[] {
  const seen = new Set<string>()
  const out: (readonly string[])[] = []
  for (const t of topics) {
    if (!(LIVE_TOPICS as readonly string[]).includes(t)) continue
    for (const key of TOPIC_QUERY_KEYS[t as LiveTopic]) {
      const id = key.join('/')
      if (!seen.has(id)) {
        seen.add(id)
        out.push(key)
      }
    }
  }
  return out
}

export interface EventSourceLike {
  onopen: ((e: Event) => void) | null
  onerror: ((e: Event) => void) | null
  addEventListener(type: string, fn: (e: MessageEvent) => void): void
  close(): void
}

/** Opens the SSE stream. The browser reconnects by itself; on every re-open we ask the caller to catch up. */
export function connectLive(opts: {
  url: string
  create?: (url: string) => EventSourceLike
  onTopics: (topics: string[]) => void
  onStatus: (status: LiveStatus) => void
  onReconnected: () => void
}): () => void {
  const create = opts.create ?? ((url: string) => new EventSource(url, { withCredentials: true }) as unknown as EventSourceLike)
  let openedBefore = false
  opts.onStatus('connecting')
  const es = create(opts.url)
  es.onopen = () => {
    opts.onStatus('live')
    if (openedBefore) opts.onReconnected()
    openedBefore = true
  }
  es.onerror = () => opts.onStatus('reconnecting')
  es.addEventListener('change', (e) => {
    try {
      const { topics } = JSON.parse(e.data) as { topics: string[] }
      if (Array.isArray(topics)) opts.onTopics(topics)
    } catch {
      // ignore malformed messages
    }
  })
  return () => es.close()
}
