import { useAuth, useUser } from "@clerk/expo";
import { useState } from "react";
import { ActivityIndicator, Alert, View, Text, ScrollView, Pressable, Switch } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Sentry from "@sentry/react-native";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthCallback } from "@/hooks/useAuth";
import { ON_PRIMARY, useThemeColors, useThemePreference } from "@/lib/theme";

// `id` is a stable key the render logic below uses to special-case the
// "Dark Mode" row with a real Switch — every item gets one so the array's
// inferred element type stays consistent, not just the row that needs it.
const MENU_SECTIONS = [
  {
    title: "Account",
    items: [
      { id: "edit-profile", icon: "person-outline", label: "Edit Profile", color: "#F4A261" },
      {
        id: "privacy",
        icon: "shield-checkmark-outline",
        label: "Privacy & Security",
        color: "#10B981",
      },
      {
        id: "notifications",
        icon: "notifications-outline",
        label: "Notifications",
        value: "On",
        color: "#8B5CF6",
      },
    ],
  },
  {
    title: "Preferences",
    items: [
      { id: "dark-mode", icon: "moon-outline", label: "Dark Mode", color: "#6366F1" },
      {
        id: "language",
        icon: "language-outline",
        label: "Language",
        value: "English",
        color: "#EC4899",
      },
      {
        id: "data-storage",
        icon: "cloud-outline",
        label: "Data & Storage",
        value: "1.2 GB",
        color: "#14B8A6",
      },
    ],
  },
  {
    title: "Support",
    items: [
      { id: "help", icon: "help-circle-outline", label: "Help Center", color: "#F59E0B" },
      { id: "contact", icon: "chatbubble-outline", label: "Contact Us", color: "#3B82F6" },
      { id: "rate", icon: "star-outline", label: "Rate the App", color: "#F4A261" },
    ],
  },
];

const ProfileTab = () => {
  const { signOut } = useAuth();
  const { user } = useUser();
  const colors = useThemeColors();
  const { isDark, setPreference } = useThemePreference();
  const { mutateAsync: syncUser } = useAuthCallback();
  const queryClient = useQueryClient();
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const pickAndUploadAvatar = async (source: "camera" | "library") => {
    if (!user) return;

    const permission =
      source === "camera"
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Permission needed",
        `Allow LowKey to access your ${source === "camera" ? "camera" : "photos"} to update your profile picture.`,
      );
      return;
    }

    const result = await (source === "camera"
      ? ImagePicker.launchCameraAsync
      : ImagePicker.launchImageLibraryAsync)({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });

    if (result.canceled || !result.assets[0]?.base64) return;

    setIsUploadingAvatar(true);
    try {
      // Clerk hosts and serves the image itself; the backend's User.avatar is
      // just a cached copy of Clerk's imageUrl, refreshed the same way it is
      // at sign-in — by re-running the callback — rather than a dedicated route.
      // Clerk's `file` accepts a string, but despite the local URI also being a
      // string, it rejects it (422 "must be a valid base64 encoded image") —
      // it wants a base64 data URI, not a file:// path. expo-image-picker's
      // `base64` output is always JPEG-encoded regardless of the source
      // format, so the data URI's mime type is hardcoded to match.
      await user.setProfileImage({ file: `data:image/jpeg;base64,${result.assets[0].base64}` });
      await syncUser();
      // `syncUser` only refreshes the `me` query; the chat list caches its own
      // copy of this same avatar per participant and needs telling separately.
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    } catch (error) {
      console.error("❌ Failed to update profile image:", error);
      Sentry.logger.error(Sentry.logger.fmt`Failed to update profile image: ${error}`);
      Alert.alert("Upload failed", "Could not update your profile picture. Please try again.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleAvatarPress = () => {
    Alert.alert("Update profile photo", undefined, [
      { text: "Take Photo", onPress: () => pickAndUploadAvatar("camera") },
      { text: "Choose from Library", onPress: () => pickAndUploadAvatar("library") },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  return (
    <ScrollView
      className="bg-surface-dark"
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      // indicatorStyle="white"
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* HEADER  */}
      <View className="relative">
        <View className="items-center mt-10">
          <View className="relative">
            <View className="rounded-full border-2 border-primary">
              <Image
                source={user?.imageUrl}
                style={{ width: 100, height: 100, borderRadius: 999 }}
              />
            </View>

            <Pressable
              onPress={handleAvatarPress}
              disabled={isUploadingAvatar}
              className="absolute bottom-1 right-1 w-8 h-8 bg-primary rounded-full items-center justify-center border-2 border-surface-dark"
            >
              {isUploadingAvatar ? (
                <ActivityIndicator size="small" color={ON_PRIMARY} />
              ) : (
                <Ionicons name="camera" size={16} color={ON_PRIMARY} />
              )}
            </Pressable>
          </View>

          {/* NAME & EMAIL */}
          <Text className="text-2xl font-bold text-foreground mt-4">
            {user?.firstName} {user?.lastName}
          </Text>

          <Text className="text-muted-foreground mt-1">
            {user?.emailAddresses[0]?.emailAddress}
          </Text>

          <View className="flex-row items-center mt-3 bg-green-500/20 px-3 py-1.5 rounded-full">
            <View className="w-2 h-2 bg-green-500 rounded-full mr-2" />
            <Text className="text-green-500 text-sm font-medium">Online</Text>
          </View>
        </View>
      </View>

      {/* MENU SECTIONS */}
      {MENU_SECTIONS.map((section) => (
        <View key={section.title} className="mt-6 mx-5">
          <Text className="text-subtle-foreground text-xs font-semibold uppercase tracking-wider mb-2 ml-1">
            {section.title}
          </Text>
          <View className="bg-surface-card rounded-2xl overflow-hidden">
            {section.items.map((item, index) => {
              const isDarkModeRow = item.id === "dark-mode";

              return (
                <Pressable
                  key={item.label}
                  disabled={!isDarkModeRow}
                  onPress={isDarkModeRow ? () => setPreference(isDark ? "light" : "dark") : undefined}
                  className={`flex-row items-center px-4 py-3.5 active:bg-surface-light ${
                    index < section.items.length - 1 ? "border-b border-surface-light" : ""
                  }`}
                >
                  <View
                    className="w-9 h-9 rounded-xl items-center justify-center"
                    style={{ backgroundColor: `${item.color}20` }}
                  >
                    <Ionicons name={item.icon as any} size={20} color={item.color} />
                  </View>
                  <Text className="flex-1 ml-3 text-foreground font-medium">{item.label}</Text>
                  {isDarkModeRow ? (
                    <Switch
                      value={isDark}
                      onValueChange={(value) => setPreference(value ? "dark" : "light")}
                      trackColor={{ false: colors.surfaceLight, true: "#F4A261" }}
                      thumbColor="#FFFFFF"
                      ios_backgroundColor={colors.surfaceLight}
                    />
                  ) : (
                    <>
                      {item.value && (
                        <Text className="text-subtle-foreground text-sm mr-1">{item.value}</Text>
                      )}
                      <Ionicons name="chevron-forward" size={18} color={colors.subtleForeground} />
                    </>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}

      {/* Logout Button */}
      <Pressable
        className="mx-5 mt-8 bg-red-500/10 rounded-2xl py-4 items-center active:opacity-70 border border-red-500/20"
        onPress={() => signOut()}
      >
        <View className="flex-row items-center">
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text className="ml-2 text-red-500 font-semibold">Log Out</Text>
        </View>
      </Pressable>
    </ScrollView>
  );
};

export default ProfileTab;