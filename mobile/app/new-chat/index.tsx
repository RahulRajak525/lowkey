import EmptyUI from "@/components/EmptyUI";
import { TypingBubble } from "@/components/TypingBubble";
import UserItem from "@/components/UserItem";
import { useMe } from "@/hooks/useAuth";
import { useGetOrCreateChat } from "@/hooks/useChats";
import { isLikelyEmail, useSearchUserByEmail } from "@/hooks/useUsers";
import { User } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useThemeColors } from "@/lib/theme";

/** How long the closing modal gets before the conversation is pushed. */
const DISMISS_SETTLE_MS = 100;

const SectionLabel = ({ children, className }: { children: string; className?: string }) => (
  <Text
    className={`mb-2 px-4 text-[11px] font-semibold uppercase tracking-widest text-subtle-foreground ${className ?? ""}`}
  >
    {children}
  </Text>
);

export default function NewChatScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: me } = useMe();
  const { mutate: getOrCreateChat, isPending: isCreatingChat } = useGetOrCreateChat();

  const trimmedQuery = searchQuery.trim();
  // There is no "browse everyone" endpoint — someone can only be found by
  // already knowing their exact email — so a query never fires until the
  // text actually looks like a complete address.
  const looksLikeEmail = isLikelyEmail(trimmedQuery);
  const {
    data: foundUser,
    isFetching: isSearching,
    error: searchError,
    refetch: retrySearch,
  } = useSearchUserByEmail(trimmedQuery);

  // With the search box empty there is nothing to look up yet, so the only
  // option offered is the always-available self chat.
  const showingSelf = trimmedQuery.length === 0;

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
    if (showingSelf) {
      return (
        <View className="flex-1 pt-4">
          {me ? (
            <>
              <SectionLabel>You</SectionLabel>
              <UserItem
                user={me}
                subtitle="Message yourself"
                showPresence={false}
                accessibilityLabel="Message yourself"
                disabled={isCreatingChat}
                onPress={() => handleUserSelect(me)}
              />
            </>
          ) : null}
          <Text className="px-4 pt-8 text-center text-sm text-subtle-foreground">
            Enter someone&apos;s email above to start a new conversation with them.
          </Text>
        </View>
      );
    }

    if (!looksLikeEmail) {
      return (
        <EmptyUI
          title="Keep typing…"
          subtitle="Enter a full email address to search, e.g. name@example.com"
          iconName="mail-outline"
        />
      );
    }

    if (isSearching) {
      return (
        <View className="flex-1 items-center justify-center py-20">
          <ActivityIndicator color="#F4A261" />
        </View>
      );
    }

    if (searchError) {
      return (
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="cloud-offline-outline" size={56} color={colors.subtleForeground} />
          <Text className="mt-4 text-lg text-muted-foreground">Search failed</Text>
          <Pressable onPress={() => retrySearch()} className="mt-6 rounded-full bg-primary px-6 py-3">
            <Text className="font-semibold text-on-primary">Retry</Text>
          </Pressable>
        </View>
      );
    }

    if (!foundUser) {
      return (
        <EmptyUI
          title="No user found"
          subtitle={`Nobody is signed up with "${trimmedQuery}"`}
          iconName="person-add-outline"
        />
      );
    }

    return (
      <View className="flex-1 pt-4">
        <SectionLabel>Found</SectionLabel>
        <UserItem user={foundUser} disabled={isCreatingChat} onPress={() => handleUserSelect(foundUser)} />
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
              Find someone by their email address
            </Text>
          </View>
        </View>

        <View className="mt-4 h-14 flex-row items-center gap-2 rounded-full border border-surface-light bg-surface px-4">
          <Ionicons name="search" size={16} color={colors.subtleForeground} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by email"
            placeholderTextColor={colors.subtleForeground}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
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
              <Ionicons name="close-circle" size={18} color={colors.subtleForeground} />
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
