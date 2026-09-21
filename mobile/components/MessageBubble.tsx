import type { Message } from "@/types";
import { format } from "date-fns";
import { Text, View } from "react-native";

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
};

const MessageBubble = ({ message, isMine }: MessageBubbleProps) => (
  <View className={`w-full px-1 py-1 ${isMine ? "items-end" : "items-start"}`}>
    <View
      className={`max-w-[80%] px-4 py-2.5 ${isMine ? "bg-primary" : "bg-surface-card"}`}
      style={{
        borderTopLeftRadius: 18,
        borderTopRightRadius: 18,
        // the tail sits on the sender's side
        borderBottomLeftRadius: isMine ? 18 : 4,
        borderBottomRightRadius: isMine ? 4 : 18,
        opacity: message.pending ? 0.6 : 1,
      }}
    >
      <Text className={`text-base ${isMine ? "text-surface-dark" : "text-foreground"}`}>
        {message.text}
      </Text>
    </View>

    <Text className="mt-1 px-2 text-[11px] text-subtle-foreground">
      {message.pending ? "Sending…" : formatSentAt(message.createdAt)}
    </Text>
  </View>
);

export default MessageBubble;
