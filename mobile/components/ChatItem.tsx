import { ChatWithParticipant } from "@/types";
import { Image } from "expo-image";
import { View, Text, Pressable } from "react-native";
import { formatDistanceToNow } from "date-fns";
import { useSocketStore } from "@/lib/socket";

// date-fns throws "Invalid time value" on an unparseable date, which would take
// the whole list down, so bad timestamps just render as no timestamp.
const formatLastMessageAt = (iso: string | null | undefined) => {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return formatDistanceToNow(date, { addSuffix: false });
};

const ChatItem = ({ chat, onPress }: { chat: ChatWithParticipant; onPress: () => void }) => {
  const participant = chat.participant;

  const { onlineUsers, typingUsers, unreadChats } = useSocketStore();

  // Presence is about the person on the other side, and in a self chat there is
  // none: the user is always here, and cannot be typing to themselves from
  // somewhere else.
  const isOnline = !chat.isSelf && onlineUsers.has(participant._id);
  const isTyping = !chat.isSelf && typingUsers.get(chat._id) === participant._id;
  const hasUnread = unreadChats.has(chat._id);

  return (
    <Pressable className="flex-row items-center py-3 active:opacity-70" onPress={onPress}>
      {/* avatar & online indicator */}
      <View className="relative">
        {participant.avatar ? (
          <Image source={participant.avatar} style={{ width: 56, height: 56, borderRadius: 999 }} />
        ) : (
          <View className="size-14 rounded-full bg-surface-light items-center justify-center">
            <Text className="text-lg font-semibold text-primary">
              {participant.name?.[0]?.toUpperCase() ?? "?"}
            </Text>
          </View>
        )}
        {isOnline && (
          <View className="absolute bottom-0 right-0 size-4 bg-green-500 rounded-full border-[3px] border-surface" />
        )}
      </View>

      {/* chat info */}
      <View className="flex-1 ml-4">
        <View className="flex-row items-center justify-between">
          <Text
            className={`text-base font-medium ${hasUnread ? "text-primary" : "text-foreground"}`}
          >
            {participant.name}
            {chat.isSelf ? <Text className="text-subtle-foreground"> (You)</Text> : null}
          </Text>

          <View className="flex-row items-center gap-2">
            {hasUnread && <View className="w-2.5 h-2.5 bg-primary rounded-full" />}
            <Text className="text-xs text-subtle-foreground">
              {formatLastMessageAt(chat.lastMessageAt)}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center justify-between mt-1">
          {isTyping ? (
            <Text className="text-sm text-primary italic">typing...</Text>
          ) : (
            <Text
              className={`text-sm flex-1 mr-3 ${hasUnread ? "text-foreground font-medium" : "text-subtle-foreground"}`}
              numberOfLines={1}
            >
              {chat.lastMessage?.text ||
                (chat.isSelf ? "Message yourself" : "No messages yet")}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
};
export default ChatItem;
