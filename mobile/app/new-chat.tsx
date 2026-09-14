import EmptyUI from "@/components/EmptyUI";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NewChatScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
      <View className="flex-row items-center gap-3 border-b border-surface-light px-4 py-3">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => router.back()}
          className="size-10 items-center justify-center rounded-full active:opacity-70"
        >
          <Ionicons name="chevron-back" size={24} color="#F4A261" />
        </Pressable>
        <Text className="flex-1 text-lg font-semibold text-foreground">New chat</Text>
      </View>

      {/* TODO: list people from GET /users, then open a chat with
          GET /chats/with/:participantId and push to /chat/[id]. */}
      <EmptyUI
        title="Nobody to show yet"
        subtitle="The people list is not wired up yet."
        iconName="person-add-outline"
      />
    </SafeAreaView>
  );
}
