import { User } from "@/types";
import { useSocketStore } from "@/lib/socket";
import { Image } from "expo-image";
import { Pressable, Text, View } from "react-native";

const UserItem = ({
  user,
  onPress,
  disabled,
  /** Replaces the email line, e.g. "Message yourself" on the self row. */
  subtitle,
  /** The signed-in user is never in the online set, so their row opts out. */
  showPresence = true,
  accessibilityLabel,
}: {
  user: User;
  onPress: () => void;
  disabled?: boolean;
  subtitle?: string;
  showPresence?: boolean;
  accessibilityLabel?: string;
}) => {
  const { onlineUsers } = useSocketStore();
  const isOnline = showPresence && onlineUsers.has(user._id);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? `Start a chat with ${user.name}`}
      onPress={onPress}
      disabled={disabled}
      className="flex-row items-center gap-3 px-4 py-3 active:bg-surface-light"
    >
      <View className="relative">
        {user.avatar ? (
          <Image source={user.avatar} style={{ width: 44, height: 44, borderRadius: 999 }} />
        ) : (
          <View className="size-11 items-center justify-center rounded-full bg-surface-light">
            <Text className="text-base font-semibold text-primary">
              {user.name?.[0]?.toUpperCase() ?? "?"}
            </Text>
          </View>
        )}
        {isOnline && (
          <View className="absolute bottom-0 right-0 size-3 rounded-full border-[2.5px] border-surface-dark bg-green-500" />
        )}
      </View>

      <View className="flex-1">
        <Text className="text-base font-medium text-foreground" numberOfLines={1}>
          {user.name}
        </Text>
        <Text className="mt-0.5 text-xs text-subtle-foreground" numberOfLines={1}>
          {subtitle ?? user.email}
        </Text>
      </View>
    </Pressable>
  );
};

export default UserItem;
