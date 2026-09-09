import { useAuth } from '@clerk/expo'
import { Redirect, Stack } from 'expo-router'
import { ActivityIndicator, View } from 'react-native'

export default function AuthLayout() {
  const { isLoaded, isSignedIn } = useAuth()

  if (!isLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-[#0D0D0F]">
        <ActivityIndicator size="large" color="#F4A261" />
      </View>
    )
  }

  // Hosted auth activates the session asynchronously after the callback deep
  // link lands, so this group must react to that rather than relying on the
  // signed-out state that was true when it mounted.
  if (isSignedIn) {
    return <Redirect href="/(tabs)" />
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="sso-callback" options={{ animation: 'fade' }} />
    </Stack>
  )
}
