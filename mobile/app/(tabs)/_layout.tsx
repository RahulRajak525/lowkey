import React from 'react'
import { Redirect, Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '@clerk/expo'
import { ActivityIndicator, View } from 'react-native'
import { useThemeColors } from '@/lib/theme'

const TabsLayout = () => {
  const { isLoaded, isSignedIn } = useAuth()
  const colors = useThemeColors()

  if (!isLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-surface-dark">
        <ActivityIndicator size="large" color="#F4A261" />
      </View>
    )
  }

  // Keeps the signed-in area reactive: signing out bounces straight back to auth.
  if (!isSignedIn) {
    return <Redirect href="/(auth)" />
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#F4A261',
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarLabelStyle:{fontSize:12,fontWeight:"600"},
        tabBarStyle: {
          backgroundColor: colors.surfaceDark,
          borderTopColor: colors.surfaceLight,
          borderTopWidth:1,
          height:88,
          paddingTop:8
        },

      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Chats',
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons
              name={focused ? 'chatbubbles' : 'chatbubbles-outline'}
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              color={color}
              size={size}
            />
          ),
        }}
      />
    </Tabs>
  )
}

export default TabsLayout
