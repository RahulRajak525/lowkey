import { ScrollView, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function ChatsTab() {
  
  return (
    <SafeAreaView className="flex-1 bg-[#0D0D0F]" edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <Text className="text-3xl font-bold text-white">Chats</Text>
      </ScrollView>
    </SafeAreaView>
  )
}
