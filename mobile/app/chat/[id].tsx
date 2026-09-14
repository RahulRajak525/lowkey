import { TypingBubble } from "@/components/TypingBubble";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Params arrive as string | string[] because a route param can legally repeat.
const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default function ChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id: string;
    participantId?: string;
    name?: string;
    avatar?: string;
  }>();

  const name = first(params.name) ?? "Chat";
  const avatar = first(params.avatar);

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

        {avatar ? (
          <Image source={avatar} style={{ width: 36, height: 36, borderRadius: 999 }} />
        ) : (
          <View className="size-9 items-center justify-center rounded-full bg-surface-light">
            <Text className="text-sm font-semibold text-primary">
              {name[0]?.toUpperCase() ?? "?"}
            </Text>
          </View>
        )}

        <Text className="flex-1 text-lg font-semibold text-foreground" numberOfLines={1}>
          {name}
        </Text>
      </View>

      {/* TODO: message list + composer. The messages endpoint is
          GET /messages/chat/:chatId, keyed by params.id. */}
      <View className="flex-1 items-center justify-center gap-4 px-8">
        <TypingBubble />
        <Text className="text-center text-muted-foreground">
          Messages are not wired up yet.
        </Text>
      </View>
    </SafeAreaView>
  );
}
