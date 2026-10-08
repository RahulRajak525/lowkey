import { Dimensions, Pressable, StyleSheet, Text, View, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { Image } from 'expo-image'
import useAuthSocial from '../../hooks/useSocialAuth'
import { Ionicons } from '@expo/vector-icons'
const { width , height } = Dimensions.get('window')
export default function AuthLandingScreen() {
  const { handleSocialAuth, loadingStrategy } = useAuthSocial();

  const isLoading = loadingStrategy !== null;

  return (
    <View className="flex-1 justify-center gap-4 bg-[#0D0D0F]">
      {/* Ambient backdrop: warm brand light from the top, embers under the
          buttons, deep neutral through the middle so the hero stays readable. */}
      <View className="absolute inset-0 overflow-hidden" pointerEvents="none">
        <LinearGradient
          colors={['#1B1419', '#0D0D0F', '#0D0D0F']}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={['rgba(244,162,97,0.15)', 'rgba(244,162,97,0.04)', 'rgba(244,162,97,0)']}
          locations={[0, 0.55, 1]}
          start={{ x: 0.15, y: 0 }}
          end={{ x: 0.85, y: 1 }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, height: height * 0.42 }}
        />
        <LinearGradient
          colors={['rgba(231,111,81,0)', 'rgba(231,111,81,0.13)']}
          style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: height * 0.34 }}
        />
      </View>
      {/*Top Section -Branding */}
      <SafeAreaView className="flex-1 px-8">

         <View className="items-center pt-10">
          <Image source={require('../../assets/images/logo.png')}  style={{ width: 100, height: 100 , marginVertical: -10 }} contentFit='contain' />
              <Text className="mb-4 text-center text-4xl font-bold text-primary font-serif tracking-wider uppercase " >LowKey</Text>
         </View>
         {/* CENTER SECTION - HERO IMG */}
         <View className="flex-1 items-center justify-center px-6">
  <Image source={require('../../assets/images/auth.png')}  style={{ width: width- 48, height: height * 0.3  }} contentFit='contain' />
              {/* Headline */}
          <View className="mt-6 items-center">
            <Text className="text-5xl font-bold text-foreground text-center font-sans">
              Connect & Chat
            </Text>
            <Text className="text-3xl font-bold text-primary font-mono">Seamlessly</Text>
          </View>
            {/* AUTH BUTTONS */}
          <View className="flex-row gap-4 mt-10">
            {/* GOOGLE BTN */}
            <Pressable
              className="flex-1 flex-row items-center justify-center gap-2 bg-white/95 py-4 rounded-2xl active:scale-[0.97]"
              disabled={isLoading}
              accessibilityRole="button"
              accessibilityLabel="Continue with Google"
              onPress={() => !isLoading && handleSocialAuth("oauth_google")}
            >
              {loadingStrategy === "oauth_google" ? (
                <ActivityIndicator size="small" color="#1a1a1a" />
              ) : (
                <>
                  <Image
                    source={require("../../assets/images/google.png")}
                    style={{ width: 20, height: 20 }}
                    contentFit="contain"
                  />
                  <Text className="text-gray-900 font-semibold text-sm">Google</Text>
                </>
              )}
            </Pressable>

            {/* APPLE BTN */}
            <Pressable
              className="flex-1 flex-row items-center justify-center gap-2 bg-white/10 py-4 rounded-2xl border border-white/20 active:scale-[0.97]"
              disabled={isLoading}
              accessibilityRole="button"
              accessibilityLabel="Continue with Apple"
              onPress={() => !isLoading && handleSocialAuth("oauth_apple")}
            >
              {loadingStrategy === "oauth_apple" ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="logo-apple" size={20} color="#FFFFFF" />
                  <Text className="text-foreground font-semibold text-sm">Apple</Text>
                </>
              )}
            </Pressable>
          </View>
          
          </View>
      </SafeAreaView>
    </View>
  )
}
