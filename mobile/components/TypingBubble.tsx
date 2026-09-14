import { useEffect } from 'react'
import { Text, View } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'

const BOUNCE_MS = 360 // up, then down
const HOLD_MS = 480 // rest before the dot bounces again
const STAGGER_MS = 140 // offset between dots, so the bounce reads left-to-right

type DotProps = {
  index: number
  size: number
  color: string
}

const Dot = ({ index, size, color }: DotProps) => {
  const lift = useSharedValue(0)

  useEffect(() => {
    lift.value = withDelay(
      index * STAGGER_MS,
      withRepeat(
        withSequence(
          withTiming(1, { duration: BOUNCE_MS, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: BOUNCE_MS, easing: Easing.in(Easing.quad) }),
          withTiming(0, { duration: HOLD_MS }),
        ),
        -1,
        false,
      ),
    )
  }, [index, lift])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 0.4 + lift.value * 0.6,
    transform: [{ translateY: -lift.value * size * 0.75 }],
  }))

  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        animatedStyle,
      ]}
    />
  )
}

type TypingBubbleProps = {
  /** Optional caption rendered next to the bubble. */
  label?: string
  dotSize?: number
  dotColor?: string
}

/**
 * The "someone is typing" bubble, reused as this app's loading signature:
 * a chat tail on the bottom-left and three dots bouncing in sequence.
 */
export const TypingBubble = ({
  label,
  dotSize = 8,
  dotColor = '#F4A261',
}: TypingBubbleProps) => (
  <View className="flex-row items-center gap-3">
    <View
      className="flex-row items-end bg-surface-card px-4 py-3"
      style={{
        gap: dotSize * 0.75,
        borderTopLeftRadius: 18,
        borderTopRightRadius: 18,
        borderBottomRightRadius: 18,
        borderBottomLeftRadius: 4, // the tail
      }}
    >
      {[0, 1, 2].map((index) => (
        <Dot key={index} index={index} size={dotSize} color={dotColor} />
      ))}
    </View>
    {label ? (
      <Text className="text-sm text-muted-foreground">{label}</Text>
    ) : null}
  </View>
)

export default TypingBubble
