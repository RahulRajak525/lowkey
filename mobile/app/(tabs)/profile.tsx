import { useAuth, useUser } from '@clerk/expo'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function ProfileTab() {
  const { user, isLoaded } = useUser()
  const { signOut } = useAuth()
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)

  const onSignOut = async () => {
    if (signingOut) return
    setSigningOut(true)
    try {
      await signOut()
      router.replace('/(auth)')
    } catch (error) {
      setSigningOut(false)
      Alert.alert(
        'Could not sign out',
        error instanceof Error ? error.message : String(error),
      )
    }
  }

  if (!isLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-[#0D0D0F]">
        <ActivityIndicator size="large" color="#F4A261" />
      </View>
    )
  }

  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Your account'
  const email = user?.primaryEmailAddress?.emailAddress ?? ''

  return (
    <SafeAreaView className="flex-1 bg-[#0D0D0F]" edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <Text className="mb-8 text-3xl font-bold text-white">Profile</Text>

        <View className="mb-8 items-center gap-3">
          {user?.imageUrl ? (
            <Image
              source={{ uri: user.imageUrl }}
              style={{ width: 88, height: 88, borderRadius: 44 }}
              contentFit="cover"
            />
          ) : (
            <View className="h-[88px] w-[88px] items-center justify-center rounded-full bg-[#2D2D30]">
              <Text className="text-3xl font-bold text-[#F4A261]">
                {(displayName[0] ?? '?').toUpperCase()}
              </Text>
            </View>
          )}

          <Text className="text-xl font-semibold text-white">{displayName}</Text>
          {email ? <Text className="text-base text-[#A0A0A5]">{email}</Text> : null}
        </View>

        <Pressable
          className="items-center rounded-xl border border-[#E76F51] py-4 active:opacity-80"
          onPress={onSignOut}
          disabled={signingOut}
        >
          {signingOut ? (
            <ActivityIndicator color="#E76F51" />
          ) : (
            <Text className="text-base font-semibold text-[#E76F51]">Sign out</Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  )
}
