import { useThemeColors } from "@/lib/theme";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

type EmptyUIProps = {
  title: string;
  subtitle?: string;
  iconName?: React.ComponentProps<typeof Ionicons>["name"];
  iconColor?: string;
  iconSize?: number;
  buttonLabel?: string;
  onPressButton?: () => void;
};

function EmptyUI({
  title,
  subtitle,
  iconName = "chatbubbles-outline",
  iconColor,
  iconSize = 64,
  buttonLabel,
  onPressButton,
}: EmptyUIProps) {
  const colors = useThemeColors();

  return (
    <View className="flex-1 items-center justify-center py-20">
      {iconName && (
        <Ionicons name={iconName} size={iconSize} color={iconColor ?? colors.subtleForeground} />
      )}
      <Text className="text-muted-foreground text-lg mt-4">{title}</Text>
      {subtitle ? <Text className="text-subtle-foreground text-sm mt-1">{subtitle}</Text> : null}
      {buttonLabel && onPressButton ? (
        <Pressable className="mt-6 bg-primary px-6 py-3 rounded-full" onPress={onPressButton}>
          <Text className="text-on-primary font-semibold">{buttonLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export default EmptyUI;