import ChatItem from "@/components/ChatItem";
import { ChatListSkeleton } from "@/components/ChatListSkeleton";
import EmptyUI from "@/components/EmptyUI";
import { useChats, useDeleteChat } from "@/hooks/useChats";
import { ChatWithParticipant, hasParticipant } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Alert, FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ON_PRIMARY, useThemeColors } from "@/lib/theme";

const ChatsTab = () => {
  const router = useRouter();
  const { data: chats, isLoading, isRefetching, error, refetch } = useChats();
  const { mutate: deleteChat } = useDeleteChat();
  const colors = useThemeColors();

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
        <Header />
        <View className="flex-1 px-5">
          <ChatListSkeleton />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-surface items-center justify-center" edges={["top"]}>
        <Text className="text-red-500 text-3xl">Failed to load chats</Text>
        <Pressable onPress={() => refetch()} className="mt-4 px-4 py-2 bg-primary rounded-lg">
          <Text className="text-foreground">Retry</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  // A chat whose other participant could not be resolved has no name, avatar or
  // id to open, so it is dropped rather than rendered as a blank row.
  const visibleChats = chats?.filter(hasParticipant) ?? [];

  const handleChatLongPress = (chat: ChatWithParticipant) => {
    Alert.alert(
      chat.isSelf ? "Delete this chat?" : `Delete chat with ${chat.participant.name}?`,
      "It will be removed from your chat list. If they message you again, it comes back.",
      [
        { text: "Delete", style: "destructive", onPress: () => deleteChat(chat._id) },
        { text: "Cancel", style: "cancel" },
      ],
    );
  };

  const handleChatPress = (chat: ChatWithParticipant) => {
    router.push({
      pathname: "/chat/[id]",
      params: {
        id: chat._id,
        participantId: chat.participant._id,
        name: chat.participant.name,
        avatar: chat.participant.avatar,
      },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
      <FlatList
        data={visibleChats}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <ChatItem
            chat={item}
            onPress={() => handleChatPress(item)}
            onLongPress={() => handleChatLongPress(item)}
          />
        )}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 }}
        ListHeaderComponent={<Header />}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#F4A261"
            colors={["#F4A261"]}
            progressBackgroundColor={colors.surfaceCard}
          />
        }
        ListEmptyComponent={
          <EmptyUI
            title="No chats yet"
            subtitle="Start a conversation!"
            iconName="chatbubbles-outline"
            iconColor={colors.subtleForeground}
            iconSize={64}
            buttonLabel="New Chat"
            onPressButton={() => router.push("/new-chat")}
          />
        }
      />
    </SafeAreaView>
  );
};

export default ChatsTab;

function Header() {
  const router = useRouter();

  return (
    <View className="px-5 pt-2 pb-4">
      <View className="flex-row items-center justify-between">
        <Text className="text-2xl font-bold text-foreground">Chats</Text>
        <Pressable
          className="size-10 bg-primary rounded-full items-center justify-center"
          onPress={() => router.push("/new-chat")}
        >
          <Ionicons name="create-outline" size={20} color={ON_PRIMARY} />
        </Pressable>
      </View>
    </View>
  );
}
