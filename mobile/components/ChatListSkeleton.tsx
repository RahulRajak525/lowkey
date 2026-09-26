import { useEffect } from 'react'
import { View } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'
import { TypingBubble } from './TypingBubble'
import { useThemeColors } from '@/lib/theme'

const PULSE_MS = 850
const ROW_STAGGER_MS = 110 // rows breathe in sequence, like messages landing

// Uneven widths keep the placeholder from looking like a table.
const ROWS = [
  { name: '52%', message: '78%' },
  { name: '38%', message: '64%' },
  { name: '61%', message: '85%' },
  { name: '44%', message: '55%' },
  { name: '49%', message: '72%' },
  { name: '35%', message: '60%' },
] as const

const Bar = ({ width, height }: { width: `${number}%`; height: number }) => {
  const colors = useThemeColors()
  return (
    <View
      style={{
        width,
        height,
        borderRadius: height / 2,
        backgroundColor: colors.surfaceLight,
      }}
    />
  )
}

const SkeletonRow = ({
  index,
  widths,
}: {
  index: number
  widths: (typeof ROWS)[number]
}) => {
  const colors = useThemeColors()
  const pulse = useSharedValue(0)

  useEffect(() => {
    pulse.value = withDelay(
      index * ROW_STAGGER_MS,
      withRepeat(
        withTiming(1, { duration: PULSE_MS, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      ),
    )
  }, [index, pulse])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 0.35 + pulse.value * 0.5,
  }))

  return (
    <Animated.View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 16,
          paddingVertical: 12,
        },
        animatedStyle,
      ]}
    >
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: colors.surfaceLight,
        }}
      />
      <View className="flex-1 gap-2">
        <Bar width={widths.name} height={12} />
        <Bar width={widths.message} height={10} />
      </View>
      <Bar width="12%" height={9} />
    </Animated.View>
  )
}

/**
 * Placeholder for the chat list: pulsing conversation rows topped off with the
 * typing bubble, so a cold load still feels like a chat screen.
 */
export const ChatListSkeleton = ({
  label = 'Loading your conversations',
}: {
  label?: string
}) => (
  <View className="flex-1">
    <View className="mb-2">
      <TypingBubble label={label} />
    </View>
    {ROWS.map((widths, index) => (
      <SkeletonRow key={index} index={index} widths={widths} />
    ))}
  </View>
)

export default ChatListSkeleton
