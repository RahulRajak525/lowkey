import type { SetActive, SignInResource, SignUpResource } from '@clerk/shared/types'

/**
 * Shared state for the social sign-in flow.
 *
 * On Android the OAuth callback (`mobile://sso-callback?rotating_token_nonce=…`)
 * is delivered twice: once to expo-web-browser (which resolves `startSSOFlow`)
 * and once to expo-router (which navigates to the `sso-callback` screen). The
 * browser side can also lose the race against the "app became active" event
 * and report `dismiss` even though the sign-in succeeded. So both the hook and
 * the screen may end up holding the nonce, and exactly one of them must finish
 * the sign-in. `claimNonce` decides who.
 */
type Listener = () => void

let active = false
const listeners = new Set<Listener>()
const claimedNonces = new Set<string>()

export const ssoFlow = {
  isActive: () => active,
  setActive(next: boolean) {
    if (active === next) return
    active = next
    listeners.forEach((listener) => listener())
  },
  subscribe(listener: Listener) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
  /** Returns true for the first caller with a given nonce, false afterwards. */
  claimNonce(nonce: string) {
    if (claimedNonces.has(nonce)) return false
    claimedNonces.add(nonce)
    return true
  },
}

export function getRotatingTokenNonce(url: string): string | null {
  try {
    return new URL(url).searchParams.get('rotating_token_nonce')
  } catch {
    return null
  }
}

type CompleteParams = {
  signIn: SignInResource
  signUp: SignUpResource
  setActive: SetActive
  rotatingTokenNonce: string
}

/**
 * Finishes an OAuth sign-in from the `rotating_token_nonce` Clerk appends to
 * the callback URL. Mirrors what `startSSOFlow` does after the browser returns
 * so the `sso-callback` screen can complete a sign-in whose browser result was
 * lost to the Android race described above.
 */
export async function completeSSOSignIn({
  signIn,
  signUp,
  setActive,
  rotatingTokenNonce,
}: CompleteParams): Promise<boolean> {
  await signIn.reload({ rotatingTokenNonce })

  if (signIn.firstFactorVerification.status === 'transferable') {
    await signUp.create({ transfer: true })
  }

  const sessionId = signUp.createdSessionId ?? signIn.createdSessionId
  if (!sessionId) return false

  await setActive({ session: sessionId })
  return true
}
