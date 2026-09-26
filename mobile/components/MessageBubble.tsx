import type { Message } from "@/types";
import { format } from "date-fns";
import { Alert, Pressable, Text, View } from "react-native";

// Same guard as the chat list: an unparseable timestamp renders as no
// timestamp rather than taking the whole thread down.
const formatSentAt = (iso: string | null | undefined) => {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return format(date, "h:mm a");
};

type MessageBubbleProps = {
  message: Message;
  isMine: boolean;
  onDelete?: (messageId: string, forEveryone: boolean) => void;
};

const MessageBubble = ({ message, isMine, onDelete }: MessageBubbleProps) => {
  // Already-deleted and still-sending bubbles have nothing to delete, and a
  // pending id is a local placeholder the server has never heard of.
  const canDelete = Boolean(onDelete) && !message.isDeleted && !message.pending;

  const handleLongPress = () => {
    if (!canDelete || !onDelete) return;

    const buttons = isMine
      ? [
          {
            text: "Delete for everyone",
            style: "destructive" as const,
            onPress: () => onDelete(message._id, true),
          },
          { text: "Delete for me", onPress: () => onDelete(message._id, false) },
          { text: "Cancel", style: "cancel" as const },
        ]
      : [
          { text: "Delete for me", onPress: () => onDelete(message._id, false) },
          { text: "Cancel", style: "cancel" as const },
        ];

    Alert.alert("Delete message", undefined, buttons);
  };

  return (
    <View className={`w-full px-1 py-1 ${isMine ? "items-end" : "items-start"}`}>
      <Pressable
        onLongPress={handleLongPress}
        delayLongPress={300}
        disabled={!canDelete}
        className={`max-w-[80%] px-4 py-2.5 ${isMine ? "bg-primary" : "bg-gray-100"} ${canDelete ? "active:opacity-80" : ""}`}
        style={{
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
          // the tail sits on the sender's side
          borderBottomLeftRadius: isMine ? 18 : 4,
          borderBottomRightRadius: isMine ? 4 : 18,
          opacity: message.pending ? 0.6 : 1,
        }}
      >
        <Text
          className={`text-base ${isMine ? "text-on-primary" : "text-black"} ${message.isDeleted ? "italic opacity-70" : ""}`}
        >
          {message.text}
        </Text>
      </Pressable>

      <Text className="mt-1 px-2 text-[11px] text-subtle-foreground">
        {message.pending ? "Sending…" : formatSentAt(message.createdAt)}
      </Text>
    </View>
  );
};

export default MessageBubble;
