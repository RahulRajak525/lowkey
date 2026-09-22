import ChatItem from "@/components/ChatItem";
import { ChatListSkeleton } from "@/components/ChatListSkeleton";
import EmptyUI from "@/components/EmptyUI";
import { useChats } from "@/hooks/useChats";
import { ChatWithParticipant, hasParticipant } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";

const ChatsTab = () => {
  const router = useRouter();
  const { data: chats, isLoading, isRefetching, error, refetch } = useChats();

  if (isLoading) {
    return (
      <View className="flex-1 bg-surface">
        <Header />
        <View className="flex-1 px-5">
          <ChatListSkeleton />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-surface items-center justify-center">
        <Text className="text-red-500 text-3xl">Failed to load chats</Text>
        <Pressable onPress={() => refetch()} className="mt-4 px-4 py-2 bg-primary rounded-lg">
          <Text className="text-foreground">Retry</Text>
        </Pressable>
      </View>
    );
  }

  // A chat whose other participant could not be resolved has no name, avatar or
  // id to open, so it is dropped rather than rendered as a blank row.
  const visibleChats = chats?.filter(hasParticipant) ?? [];

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
    <View className="flex-1 bg-surface">
      <FlatList
        data={visibleChats}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <ChatItem chat={item} onPress={() => handleChatPress(item)} />}
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
            progressBackgroundColor="#242428"
          />
        }
        ListEmptyComponent={
          <EmptyUI
            title="No chats yet"
            subtitle="Start a conversation!"
            iconName="chatbubbles-outline"
            iconColor="#6B6B70"
            iconSize={64}
            buttonLabel="New Chat"
            onPressButton={() => router.push("/new-chat")}
          />
        }
      />
    </View>
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
          <Ionicons name="create-outline" size={20} color="#0D0D0F" />
        </Pressable>
      </View>
    </View>
  );
}
