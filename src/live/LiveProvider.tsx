import { useQueryClient } from '@tanstack/react-query'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { connectLive, queryKeysForTopics, type LiveStatus } from './liveClient'

const LiveContext = createContext<{ status: LiveStatus; lastEventAt: Date | null }>({ status: 'connecting', lastEventAt: null })

export function LiveProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient()
  const [status, setStatus] = useState<LiveStatus>('connecting')
  const [lastEventAt, setLastEventAt] = useState<Date | null>(null)
  useEffect(
    () =>
      connectLive({
        url: '/api/events',
        onStatus: setStatus,
        onTopics: (topics) => {
          setLastEventAt(new Date())
          for (const key of queryKeysForTopics(topics)) void qc.invalidateQueries({ queryKey: [...key] })
        },
        onReconnected: () => {
          setLastEventAt(new Date())
          void qc.invalidateQueries() // catch up on anything missed while disconnected
        },
      }),
    [qc],
  )
  return <LiveContext.Provider value={{ status, lastEventAt }}>{children}</LiveContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useLiveStatus = () => useContext(LiveContext)
