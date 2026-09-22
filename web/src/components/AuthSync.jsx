import { useAuthCallback } from '@/hooks/useAuth'
import { useEffect, useRef } from 'react'
import { useAuth, useUser } from '@clerk/react'

/** Syncs the signed-in Clerk user into the backend's own user row, once per session. */
const AuthSync = () => {
  const { isSignedIn } = useAuth()
  const { user } = useUser()
  const { mutate: syncUser } = useAuthCallback()
  const hasSynced = useRef(false)

  useEffect(() => {
    if (isSignedIn && user && !hasSynced.current) {
      hasSynced.current = true
      syncUser(undefined, {
        onError: () => {
          // let the next render / user update retry a failed sync
          hasSynced.current = false
        },
      })
    }

    if (!isSignedIn) {
      hasSynced.current = false
    }
  }, [isSignedIn, user, syncUser])

  return null
}

export default AuthSync
