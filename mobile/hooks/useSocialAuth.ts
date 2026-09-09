import { useSSO } from '@clerk/expo'
import * as AuthSession from 'expo-auth-session'
import * as Linking from 'expo-linking'
import * as WebBrowser from 'expo-web-browser'
import { useEffect, useState } from 'react'
import { Alert, Platform } from 'react-native'
import { completeSSOSignIn, getRotatingTokenNonce, ssoFlow } from '../lib/ssoFlow'

// Lets the auth session close itself once the redirect lands (web); no-op on native.
WebBrowser.maybeCompleteAuthSession()

type Strategy = 'oauth_google' | 'oauth_apple'

const providerName = (strategy: Strategy) =>
  strategy === 'oauth_google' ? 'Google' : 'Apple'

function useAuthSocial() {
  const [loadingStrategy, setLoadingStrategy] = useState<Strategy | null>(null)
  const { startSSOFlow } = useSSO()

  // Pre-warm Chrome Custom Tabs so the Google page opens without a blank pause.
  useEffect(() => {
    if (Platform.OS !== 'android') return
    void WebBrowser.warmUpAsync()
    return () => {
      void WebBrowser.coolDownAsync()
    }
  }, [])

  const handleSocialAuth = async (strategy: Strategy) => {
    if (loadingStrategy || ssoFlow.isActive()) return
    setLoadingStrategy(strategy)
    ssoFlow.setActive(true)

    // Same value Clerk derives internally; passed explicitly so the listener
    // below matches exactly what Clerk asked the browser to return to.
    const redirectUrl = AuthSession.makeRedirectUri({ path: 'sso-callback' })

    // Capture the callback ourselves. When the browser delivers it, we claim the
    // nonce so the `sso-callback` screen (which receives the same deep link via
    // expo-router) knows this hook is finishing the sign-in.
    let callbackUrl: string | null = null
    const subscription = Linking.addEventListener('url', ({ url }) => {
      if (!url.startsWith(redirectUrl)) return
      callbackUrl = url
      const nonce = getRotatingTokenNonce(url)
      if (nonce) ssoFlow.claimNonce(nonce)
    })

    try {
      const { createdSessionId, setActive, signIn, signUp, authSessionResult } =
        await startSSOFlow({ strategy, redirectUrl })

      if (createdSessionId && setActive) {
        // (auth)/_layout redirects to the tabs as soon as the session is active.
        await setActive({ session: createdSessionId })
        return
      }

      // Android: the browser reported "dismiss" because the app regained focus a
      // beat before the deep link was delivered, but we still caught the URL.
      const nonce = callbackUrl ? getRotatingTokenNonce(callbackUrl) : null
      if (nonce && signIn && signUp && setActive) {
        const done = await completeSSOSignIn({ signIn, signUp, setActive, rotatingTokenNonce: nonce })
        if (done) return
      }

      // User closed the browser, or the deep link is still on its way (in which
      // case the `sso-callback` screen finishes the sign-in). Nothing to alert.
      const type = authSessionResult?.type
      if (type === 'cancel' || type === 'dismiss' || type === 'locked') return

      Alert.alert(
        'Sign-in incomplete',
        `${providerName(strategy)} sign-in did not complete. Please try again.`,
      )
    } catch (error) {
      console.error('Social auth failed:', error)
      Alert.alert('Error', `Failed to sign in with ${providerName(strategy)}. Please try again.`)
    } finally {
      subscription.remove()
      ssoFlow.setActive(false)
      setLoadingStrategy(null)
    }
  }

  return { handleSocialAuth, loadingStrategy }
}

export default useAuthSocial
