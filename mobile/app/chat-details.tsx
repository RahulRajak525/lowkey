import { useDeleteChat } from "@/hooks/useChats";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Alert, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Params arrive as string | string[] because a route param can legally repeat.
const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

/**
 * Reached by tapping the contact in a chat's header — a clearly-labelled
 * place to clear *that one* conversation's history for yourself, rather
 * than only a long-press gesture on the chat list.
 */
export default function ChatDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    chatId: string;
    name?: string;
    avatar?: string;
    isSelf?: string;
  }>();

  const chatId = first(params.chatId) ?? "";
  const name = first(params.name) ?? "Chat";
  const avatar = first(params.avatar);
  const isSelf = first(params.isSelf) === "1";

  const { mutate: deleteChat, isPending } = useDeleteChat();

  const handleDeleteChat = () => {
    Alert.alert(
      isSelf ? "Delete this chat?" : `Delete chat with ${name}?`,
      isSelf
        ? "Every message will be cleared for you."
        : `Every message will be cleared for you. ${name} keeps their own copy, and stays in your chat list — anything they send afterwards shows up normally.`,
      [
        {
          text: "Delete",
          style: "destructive",
          onPress: () =>
            deleteChat(chatId, {
              // The chat row and its history stay put — only this screen
              // needs to close, landing back on the now-cleared thread.
              onSuccess: () => router.back(),
              onError: () =>
                Alert.alert("Could not delete chat", "Something went wrong. Please try again."),
            }),
        },
        { text: "Cancel", style: "cancel" },
      ],
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-surface-dark" edges={["top"]}>
      <View className="flex-row items-center gap-3 px-4 py-3">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => router.back()}
          className="size-10 items-center justify-center rounded-full active:opacity-70"
        >
          <Ionicons name="chevron-back" size={24} color="#F4A261" />
        </Pressable>
        <Text className="text-lg font-semibold text-foreground">Chat Details</Text>
      </View>

      <View className="items-center pt-6">
        {avatar ? (
          <Image source={avatar} style={{ width: 96, height: 96, borderRadius: 999 }} />
        ) : (
          <View className="size-24 items-center justify-center rounded-full bg-surface-light">
            <Text className="text-3xl font-semibold text-primary">
              {name[0]?.toUpperCase() ?? "?"}
            </Text>
          </View>
        )}

        <Text className="mt-4 text-xl font-bold text-foreground">
          {name}
          {isSelf ? <Text className="text-subtle-foreground"> (You)</Text> : null}
        </Text>
      </View>

      <View className="mt-10 mx-5">
        <Text className="mb-2 ml-1 text-xs font-semibold uppercase tracking-wider text-subtle-foreground">
          Danger Zone
        </Text>
        <Pressable
          className="flex-row items-center rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3.5 active:opacity-70"
          onPress={handleDeleteChat}
          disabled={isPending}
        >
          <View className="size-9 items-center justify-center rounded-xl bg-red-500/20">
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
          </View>
          <View className="ml-3 flex-1">
            <Text className="font-medium text-red-500">Delete Chat</Text>
            <Text className="mt-0.5 text-xs text-subtle-foreground">
              {isSelf
                ? "Clears every message in this conversation, for you."
                : `Clears every message with ${name}, for you only.`}
            </Text>
          </View>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
