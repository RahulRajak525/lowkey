import { ChatListSkeleton } from "@/components/ChatListSkeleton";
import EmptyUI from "@/components/EmptyUI";
import { TypingBubble } from "@/components/TypingBubble";
import UserItem from "@/components/UserItem";
import { useGetOrCreateChat } from "@/hooks/useChats";
import { useUsers } from "@/hooks/useUsers";
import { User } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, FlatList, Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/** How long the closing modal gets before the conversation is pushed. */
const DISMISS_SETTLE_MS = 100;

export default function NewChatScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: allUsers, isLoading, error, refetch } = useUsers();
  const { mutate: getOrCreateChat, isPending: isCreatingChat } = useGetOrCreateChat();

  // The directory is small enough to filter on the device, so typing stays
  // instant instead of waiting on a round trip per keystroke.
  const query = searchQuery.trim().toLowerCase();
  const filteredUsers =
    allUsers?.filter(
      (user) =>
        !query ||
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query),
    ) ?? [];

  const handleUserSelect = (user: User) => {
    if (isCreatingChat) return;
    getOrCreateChat(user._id, {
      onSuccess: (chat) => {
        // This screen is presented as a modal, so the conversation must not be
        // opened inside it: dismiss back to the chat list first, then push the
        // chat onto the root stack. Backing out of the conversation then lands
        // on the list rather than reopening this picker.
        router.dismiss();

        // Deliberately staged rather than simultaneous. Issued in the same tick
        // the two transitions play as one motion, which reads as the picker
        // turning into the conversation; holding the push back lets the modal
        // visibly close first, so the conversation arrives as its own step.
        // This is a presentation choice, not a race guard — expo-router queues
        // both calls and drains them in order either way.
        //
        // `router` is a module singleton, so the deferred push is still valid
        // after the modal has unmounted; there is deliberately no cleanup, as
        // cancelling it on unmount would cancel the navigation itself.
        setTimeout(() => {
          router.push({
            pathname: "/chat/[id]",
            params: {
              id: chat._id,
              participantId: user._id,
              name: user.name,
              avatar: user.avatar,
            },
          });
        }, DISMISS_SETTLE_MS);
      },
      onError: () => {
        // Without this the failure is invisible: the "Opening chat" bubble just
        // disappears and the tap looks ignored.
        Alert.alert(
          "Could not open chat",
          `Something went wrong starting a conversation with ${user.name}. Please try again.`,
        );
      },
    });
  };

  const renderBody = () => {
    if (isLoading) {
      return (
        <View className="flex-1 px-4 pt-4">
          <ChatListSkeleton label="Finding people to chat with" />
        </View>
      );
    }

    if (error) {
      return (
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="cloud-offline-outline" size={56} color="#6B6B70" />
          <Text className="mt-4 text-lg text-muted-foreground">Failed to load users</Text>
          <Pressable onPress={() => refetch()} className="mt-6 rounded-full bg-primary px-6 py-3">
            <Text className="font-semibold text-surface-dark">Retry</Text>
          </Pressable>
        </View>
      );
    }

    if (filteredUsers.length === 0) {
      return query ? (
        <EmptyUI
          title="No users found"
          subtitle={`Nothing matches "${searchQuery.trim()}"`}
          iconName="search-outline"
        />
      ) : (
        <EmptyUI
          title="Nobody to show yet"
          subtitle="New people will appear here once they join."
          iconName="person-add-outline"
        />
      );
    }

    return (
      <View className="flex-1 pt-4">
        <Text className="mb-2 px-4 text-[11px] font-semibold uppercase tracking-widest text-subtle-foreground">
          Users
        </Text>

        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <UserItem
              user={item}
              disabled={isCreatingChat}
              onPress={() => handleUserSelect(item)}
            />
          )}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
          ItemSeparatorComponent={() => <View className="ml-[72px] h-px bg-surface-light" />}
        />
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-surface-dark" edges={["top"]}>
      {/* header panel */}
      <View className="px-4 pb-4 pt-2">
        <View className="flex-row items-center gap-3">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            onPress={() => router.back()}
            className="size-9 items-center justify-center rounded-xl bg-surface-light active:opacity-70"
          >
            <Ionicons name="close" size={20} color="#F4A261" />
          </Pressable>

          <View className="flex-1">
            <Text className="text-xl font-bold text-foreground">New chat</Text>
            <Text className="mt-0.5 text-xs text-muted-foreground">
              Search for a user to start chatting
            </Text>
          </View>
        </View>

        <View className="mt-4 h-11 flex-row items-center gap-2 rounded-full border border-surface-light bg-surface px-4">
          <Ionicons name="search" size={16} color="#6B6B70" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search users"
            placeholderTextColor="#6B6B70"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            className="flex-1 text-base text-foreground"
          />
          {searchQuery.length > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              onPress={() => setSearchQuery("")}
              hitSlop={8}
            >
              <Ionicons name="close-circle" size={18} color="#6B6B70" />
            </Pressable>
          ) : null}
        </View>
      </View>

      {renderBody()}

      {/* the tap is already registered, so the screen says so while the chat opens */}
      {isCreatingChat ? (
        <View pointerEvents="none" className="absolute inset-x-0 bottom-10 items-center">
          <TypingBubble label="Opening chat" dotSize={7} />
        </View>
      ) : null}
    </SafeAreaView>
  );
}
