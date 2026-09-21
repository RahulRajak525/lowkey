import EmptyUI from "@/components/EmptyUI";
import MessageBubble from "@/components/MessageBubble";
import { TypingBubble } from "@/components/TypingBubble";
import { useMe } from "@/hooks/useAuth";
import { useMessages, useSendMessage } from "@/hooks/useMessages";
import { setActiveChat, useSocketStore } from "@/lib/socket";
import type { Message } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
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

  const chatId = first(params.id) ?? "";
  const participantId = first(params.participantId);
  const name = first(params.name) ?? "Chat";
  const avatar = first(params.avatar);

  const [draft, setDraft] = useState("");

  const { data: me } = useMe();
  const { data: messages, isLoading, error, refetch } = useMessages(chatId);
  const sendMessage = useSendMessage(chatId);
  const { onlineUsers, isConnected } = useSocketStore();

  const isOnline = participantId ? onlineUsers.has(participantId) : false;

  // Joining the room is what makes the server deliver this chat's messages
  // live; leaving on unmount also clears the chat's unread dot.
  useEffect(() => {
    if (!chatId) return;
    setActiveChat(chatId);
    return () => setActiveChat(null);
  }, [chatId]);

  // The list renders inverted so new messages land at the bottom and the
  // keyboard pushes the thread up without any scroll bookkeeping. The API
  // returns oldest first, so it is reversed once per change rather than per
  // render.
  const orderedMessages = useMemo(() => [...(messages ?? [])].reverse(), [messages]);

  const isMine = (message: Message) => {
    const senderId = typeof message.sender === "string" ? message.sender : message.sender._id;
    // Before /auth/me resolves, fall back to the one thing the route already
    // knows: in a 1:1 chat, anyone who is not the participant is me.
    return me ? senderId === me._id : senderId !== participantId;
  };

  const handleSend = () => {
    // The draft is only cleared once the socket has actually taken the message,
    // so a send attempted while disconnected does not lose what was typed.
    if (sendMessage(draft)) setDraft("");
  };

  // Messages are sent over the socket, so a disconnected composer can only
  // swallow what is typed — the button says so rather than doing nothing.
  const canSend = draft.trim().length > 0 && isConnected;

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

        <View className="relative">
          {avatar ? (
            <Image source={avatar} style={{ width: 36, height: 36, borderRadius: 999 }} />
          ) : (
            <View className="size-9 items-center justify-center rounded-full bg-surface-light">
              <Text className="text-sm font-semibold text-primary">
                {name[0]?.toUpperCase() ?? "?"}
              </Text>
            </View>
          )}
          {isOnline && (
            <View className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-surface bg-green-500" />
          )}
        </View>

        <View className="flex-1">
          <Text className="text-lg font-semibold text-foreground" numberOfLines={1}>
            {name}
          </Text>
          {!isConnected ? (
            <Text className="text-xs text-primary">Connecting…</Text>
          ) : isOnline ? (
            <Text className="text-xs text-subtle-foreground">Online</Text>
          ) : null}
        </View>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <TypingBubble label="Loading messages" />
          </View>
        ) : error ? (
          <View className="flex-1 items-center justify-center gap-4 px-8">
            <Text className="text-center text-muted-foreground">Failed to load messages</Text>
            <Pressable onPress={() => refetch()} className="rounded-full bg-primary px-6 py-3">
              <Text className="font-semibold text-surface-dark">Retry</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={orderedMessages}
            inverted
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => <MessageBubble message={item} isMine={isMine(item)} />}
            showsVerticalScrollIndicator={false}
            keyboardDismissMode="interactive"
            contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16 }}
            ListEmptyComponent={
              // The list un-flips this for us, by cloning the element with a
              // `style` carrying the counter-transform. StyleSheet.compose lets
              // a `transform` set here replace that one outright instead of
              // merging, which renders the whole thing mirrored, so the root
              // stays unstyled and the layout lives on the child.
              <View>
                {/* Deliberately not the TypingBubble: that is the app's
                    loading signature, and on a thread that has finished
                    loading it just reads as a spinner that never stops. */}
                <EmptyUI
                  title="No messages yet"
                  subtitle={`Say hi to ${name}`}
                  iconName="chatbubble-ellipses-outline"
                  iconSize={56}
                />
              </View>
            }
          />
        )}

        <View className="flex-row items-end gap-2 border-t border-surface-light px-4 py-3">
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Message"
            placeholderTextColor="#6B6B70"
            multiline
            className="max-h-32 flex-1 rounded-3xl bg-surface-card px-4 py-3 text-base text-foreground"
            onSubmitEditing={handleSend}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send message"
            disabled={!canSend}
            onPress={handleSend}
            className={`size-12 items-center justify-center rounded-full ${
              canSend ? "bg-primary active:opacity-70" : "bg-surface-light"
            }`}
          >
            <Ionicons name="send" size={20} color={canSend ? "#0D0D0F" : "#6B6B70"} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
