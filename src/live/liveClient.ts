import { LIVE_TOPICS, type LiveTopic } from '@sr/shared'

export type LiveStatus = 'connecting' | 'live' | 'reconnecting'

/** Server topic → TanStack Query key prefixes to refetch. */
export const TOPIC_QUERY_KEYS: Record<LiveTopic, readonly (readonly string[])[]> = {
  incidents: [['incidents'], ['incident'], ['analytics'], ['search']],
  roster: [['roster'], ['me'], ['incident']],
  shift: [['me'], ['roster'], ['incidents'], ['incident'], ['analytics']],
  users: [['users'], ['search'], ['roster'], ['me']],
  config: [['config'], ['me']],
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
  readyState?: number
  onopen: ((e: Event) => void) | null
  onerror: ((e: Event) => void) | null
  addEventListener(type: string, fn: (e: MessageEvent) => void): void
  close(): void
}

const CLOSED = 2
const BASE_DELAY_MS = 1000
const MAX_DELAY_MS = 30000

/**
 * Opens the SSE stream. The browser reconnects by itself while the stream is merely interrupted; if it gives up
 * (readyState CLOSED) we re-create the source after a capped exponential backoff. Whenever a stream opens after an
 * earlier open or failure, the caller is asked to catch up.
 */
export function connectLive(opts: {
  url: string
  create?: (url: string) => EventSourceLike
  onTopics: (topics: string[]) => void
  onStatus: (status: LiveStatus) => void
  onReconnected: () => void
}): () => void {
  const create = opts.create ?? ((url: string) => new EventSource(url, { withCredentials: true }) as unknown as EventSourceLike)
  let needsCatchUp = false
  let delay = BASE_DELAY_MS
  let timer: ReturnType<typeof setTimeout> | null = null
  let current: EventSourceLike | null = null
  let stopped = false

  const open = () => {
    const es = create(opts.url)
    current = es
    es.onopen = () => {
      delay = BASE_DELAY_MS
      opts.onStatus('live')
      if (needsCatchUp) opts.onReconnected()
      needsCatchUp = true
    }
    es.onerror = () => {
      needsCatchUp = true
      opts.onStatus('reconnecting')
      if (es.readyState === CLOSED && !stopped) {
        es.close()
        timer = setTimeout(() => {
          timer = null
          if (!stopped) open()
        }, delay)
        delay = Math.min(delay * 2, MAX_DELAY_MS)
      }
    }
    es.addEventListener('change', (e) => {
      try {
        const { topics } = JSON.parse(e.data) as { topics: string[] }
        if (Array.isArray(topics)) opts.onTopics(topics)
      } catch {
        // ignore malformed messages
      }
    })
  }

  opts.onStatus('connecting')
  open()
  return () => {
    stopped = true
    if (timer) clearTimeout(timer)
    timer = null
    current?.close()
  }
}
