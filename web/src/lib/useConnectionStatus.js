import { useEffect, useState } from 'react'
import { useSocketStore } from '@/lib/socket'

// Whether this session has connected at least once, so a screen mounted
// after a drop (a newly opened thread) still says "Reconnecting…" rather
// than "Connecting…".
let everConnected = false
const markConnected = () => {
  everConnected = true
}

/** 'connected' | 'connecting' (first attempt) | 'reconnecting' (link dropped) */
export const useConnectionStatus = () => {
  const { isConnected } = useSocketStore()
  const [hasConnected, setHasConnected] = useState(() => everConnected || isConnected)
  if (isConnected && !hasConnected) setHasConnected(true)

  useEffect(() => {
    if (isConnected) markConnected()
  }, [isConnected])

  if (isConnected) return 'connected'
  return hasConnected ? 'reconnecting' : 'connecting'
}
