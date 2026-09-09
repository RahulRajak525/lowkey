import { useAuth } from '@clerk/expo'
import { useSignIn, useSignUp } from '@clerk/expo/legacy'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useRef, useSyncExternalStore } from 'react'
import { ActivityIndicator, Alert, Text, View } from 'react-native'
import { completeSSOSignIn, ssoFlow } from '../../lib/ssoFlow'

/**
 * Landing route for the OAuth deep link (`mobile://sso-callback`).
 *
 * On Android expo-router navigates here when Google redirects back. If the
 * social-auth hook already caught the callback it finishes the sign-in and
 * `(auth)/_layout` redirects to the tabs; otherwise this screen finishes it
 * from the `rotating_token_nonce` in the URL. Either way the user sees one
 * spinner instead of "Unmatched Route" or a bounce back to the login screen.
 */
export default function SSOCallbackScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{ rotating_token_nonce?: string | string[] }>()
  const nonce = Array.isArray(params.rotating_token_nonce)
    ? params.rotating_token_nonce[0]
    : params.rotating_token_nonce

  const { isLoaded: authLoaded, isSignedIn } = useAuth()
  const { isLoaded: signInLoaded, signIn, setActive } = useSignIn()
  const { isLoaded: signUpLoaded, signUp } = useSignUp()
  const hookFlowActive = useSyncExternalStore(ssoFlow.subscribe, ssoFlow.isActive)
  const completing = useRef(false)

  // Finish the sign-in here only if the hook did not already claim this nonce.
  useEffect(() => {
    if (!nonce || completing.current) return
    if (!signInLoaded || !signUpLoaded || !signIn || !signUp || !setActive) return
    // The hook already caught this callback and is finishing the sign-in.
    if (!ssoFlow.claimNonce(nonce)) return

    completing.current = true
    ;(async () => {
      try {
        const done = await completeSSOSignIn({
          signIn,
          signUp,
          setActive,
          rotatingTokenNonce: nonce,
        })
        if (!done) {
          Alert.alert('Sign-in incomplete', 'Sign-in did not complete. Please try again.')
          router.replace('/(auth)')
        }
        // On success `(auth)/_layout` sees isSignedIn and redirects to the tabs.
      } catch (error) {
        console.error('Finishing social auth failed:', error)
        Alert.alert('Error', 'Failed to finish sign-in. Please try again.')
        router.replace('/(auth)')
      }
    })()
  }, [nonce, signInLoaded, signUpLoaded, signIn, signUp, setActive, router])

  // Nothing is finishing a sign-in and there is no session: back to the login screen.
  useEffect(() => {
    if (!authLoaded || isSignedIn) return
    if (hookFlowActive || completing.current) return
    router.replace('/(auth)')
  }, [authLoaded, isSignedIn, hookFlowActive, router])

  return (
    <View className="flex-1 items-center justify-center gap-4 bg-[#0D0D0F]">
      <ActivityIndicator size="large" color="#F4A261" />
      <Text className="text-base text-[#A0A0A5]">Signing you in…</Text>
    </View>
  )
}
