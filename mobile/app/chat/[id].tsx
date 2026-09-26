import EmptyUI from "@/components/EmptyUI";
import MessageBubble from "@/components/MessageBubble";
import { MessageThreadSkeleton } from "@/components/MessageThreadSkeleton";
import { TypingBubble } from "@/components/TypingBubble";
import { useMe } from "@/hooks/useAuth";
import { useDeleteMessage, useMessages, useSendMessage } from "@/hooks/useMessages";
import { emitTyping, setActiveChat, useSocketStore } from "@/lib/socket";
import { ON_PRIMARY, useThemeColors } from "@/lib/theme";
import type { Message } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

/** Matches the `py-3` the composer used before the bottom inset was added. */
const COMPOSER_PADDING = 12;

/** Silence after the last keystroke before the other side stops seeing "typing...". */
const TYPING_IDLE_MS = 2000;

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

  // Android draws edge-to-edge, so the composer sits under the navigation bar
  // unless the inset is added back, and `adjustResize` no longer shrinks the
  // window for the keyboard either — KeyboardAvoidingView has nothing to react
  // to and the composer ends up behind the keyboard. Both are handled here by
  // measuring the keyboard and lifting the thread by that much. While it is up
  // the navigation bar inset is dropped, since the keyboard covers that strip.
  const insets = useSafeAreaInsets();
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const isKeyboardVisible = keyboardHeight > 0;

  useEffect(() => {
    const shown = Keyboard.addListener("keyboardDidShow", (event) =>
      setKeyboardHeight(event.endCoordinates.height),
    );
    const hidden = Keyboard.addListener("keyboardDidHide", () => setKeyboardHeight(0));
    return () => {
      shown.remove();
      hidden.remove();
    };
  }, []);

  // The reported keyboard height stops at the top of the navigation bar, not at
  // the bottom of the screen, so lifting by it alone leaves the composer hidden
  // behind that bar. Measured on a 560dpi device: reported 255dp + 44dp inset
  // against a keyboard that actually occludes 301dp.
  const androidKeyboardLift = isKeyboardVisible ? keyboardHeight + insets.bottom : 0;

  const { data: me } = useMe();
  const { data: messages, isLoading, error, refetch } = useMessages(chatId);
  const sendMessage = useSendMessage(chatId);
  const deleteMessage = useDeleteMessage(chatId);
  const { onlineUsers, typingUsers, isConnected } = useSocketStore();
  const colors = useThemeColors();

  // A chat with yourself carries your own id as the participant. There is no
  // other side to be online or typing, and every message in it is your own.
  const isSelfChat = Boolean(me && participantId && me._id === participantId);
  const isOnline = !isSelfChat && participantId !== undefined && onlineUsers.has(participantId);
  const isParticipantTyping =
    !isSelfChat && participantId !== undefined && typingUsers.get(chatId) === participantId;

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
    if (isSelfChat) return true;
    const senderId = typeof message.sender === "string" ? message.sender : message.sender._id;
    // Before /auth/me resolves, fall back to the one thing the route already
    // knows: in a 1:1 chat, anyone who is not the participant is me.
    return me ? senderId === me._id : senderId !== participantId;
  };

  // One "typing" event per burst rather than one per keystroke: `isTyping`
  // tracks what the other side has already been told, and the timer is what
  // retracts it once the keystrokes stop.
  const isTyping = useRef(false);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopTyping = useCallback(() => {
    if (idleTimer.current) {
      clearTimeout(idleTimer.current);
      idleTimer.current = null;
    }
    if (!isTyping.current) return;
    isTyping.current = false;
    if (chatId) emitTyping(chatId, false);
  }, [chatId]);

  // Leaving the screen mid-sentence would otherwise strand the indicator on the
  // other device until its own expiry timer fired.
  useEffect(() => stopTyping, [stopTyping]);

  const handleDraftChange = (text: string) => {
    setDraft(text);
    if (!chatId || isSelfChat) return;

    if (!isTyping.current) {
      isTyping.current = true;
      emitTyping(chatId, true);
    }

    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(stopTyping, TYPING_IDLE_MS);
  };

  const handleSend = () => {
    // The draft is only cleared once the socket has actually taken the message,
    // so a send attempted while disconnected does not lose what was typed.
    if (sendMessage(draft)) {
      setDraft("");
      stopTyping();
    }
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

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${name} — chat details`}
          onPress={() =>
            router.push({
              pathname: "/chat-details",
              params: {
                chatId,
                name,
                avatar: avatar ?? "",
                isSelf: isSelfChat ? "1" : "",
              },
            })
          }
          className="flex-1 flex-row items-center gap-3 active:opacity-70"
        >
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
              {isSelfChat ? <Text className="text-subtle-foreground"> (You)</Text> : null}
            </Text>
            {!isConnected ? (
              <Text className="text-xs text-primary">Connecting…</Text>
            ) : isParticipantTyping ? (
              <Text className="text-xs text-primary italic">typing…</Text>
            ) : isSelfChat ? (
              <Text className="text-xs text-subtle-foreground">Message yourself</Text>
            ) : isOnline ? (
              <Text className="text-xs text-subtle-foreground">Online</Text>
            ) : null}
          </View>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        // `flex: 1` lives in this object rather than a `flex-1` className: the
        // explicit `style` prop replaces NativeWind's generated style outright,
        // which collapses the view to zero height and blanks the thread.
        style={{ flex: 1, paddingBottom: Platform.OS === "android" ? androidKeyboardLift : 0 }}
        // iOS resizes the window itself, so it keeps the built-in behaviour;
        // Android is driven by the measured keyboard height above.
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {isLoading ? (
          <MessageThreadSkeleton />
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
            renderItem={({ item }) => (
              <MessageBubble message={item} isMine={isMine(item)} onDelete={deleteMessage} />
            )}
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
                  subtitle={
                    isSelfChat
                      ? "Send yourself notes, links and reminders"
                      : `Say hi to ${name}`
                  }
                  iconName="chatbubble-ellipses-outline"
                  iconSize={56}
                />
              </View>
            }
          />
        )}

        {/* Sits between the thread and the composer, so it reads as the next
            message about to arrive rather than a status line. The bubble is
            this component's original purpose — the loading screens borrowed
            it, not the other way round. */}
        {isParticipantTyping ? (
          <Animated.View
            entering={FadeInDown.duration(160)}
            exiting={FadeOutDown.duration(160)}
            className="px-4 pb-2"
          >
            {/* Matches an incoming message's text color, since this bubble
                stands in for one — which flips with the theme, so it stays
                readable against the (also theme-reactive) bubble behind it.
                The orange default belongs to the loading screens, where the
                bubble is the app's spinner rather than a message. */}
            <TypingBubble dotSize={7} dotColor={colors.foreground} />
          </Animated.View>
        ) : null}

        <View
          className="flex-row items-end gap-2 border-t border-surface-light px-4 pt-3"
          style={{
            paddingBottom: COMPOSER_PADDING + (isKeyboardVisible ? 0 : insets.bottom),
          }}
        >
          <TextInput
            value={draft}
            onChangeText={handleDraftChange}
            placeholder="Message"
            placeholderTextColor={colors.subtleForeground}
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
            <Ionicons name="send" size={20} color={canSend ? ON_PRIMARY : colors.subtleForeground} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
