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

const PULSE_MS = 850
const ROW_STAGGER_MS = 110 // bubbles breathe in sequence, like messages landing

const PLACEHOLDER = '#2D2D30'

// A real thread alternates sides and mixes one- and two-line messages; an even
// ladder of same-width bubbles reads as a table instead of a conversation.
// Heights match MessageBubble's `px-4 py-2.5` around one or two lines of
// `text-base`, so nothing jumps when the real messages swap in.
const ROWS = [
  { mine: false, width: '64%', height: 40 },
  { mine: true, width: '48%', height: 40 },
  { mine: false, width: '78%', height: 61 },
  { mine: true, width: '56%', height: 40 },
  { mine: false, width: '41%', height: 40 },
  { mine: true, width: '70%', height: 61 },
] as const

type Row = (typeof ROWS)[number]

const SkeletonBubble = ({ delay, row }: { delay: number; row: Row }) => {
  const pulse = useSharedValue(0)

  useEffect(() => {
    pulse.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration: PULSE_MS, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      ),
    )
  }, [delay, pulse])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 0.35 + pulse.value * 0.5,
  }))

  return (
    <Animated.View
      style={animatedStyle}
      className={`w-full px-1 py-1 ${row.mine ? 'items-end' : 'items-start'}`}
    >
      <View
        style={{
          width: row.width,
          height: row.height,
          backgroundColor: PLACEHOLDER,
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
          // the tail sits on the sender's side, as in MessageBubble
          borderBottomLeftRadius: row.mine ? 18 : 4,
          borderBottomRightRadius: row.mine ? 4 : 18,
        }}
      />
      {/* stands in for the timestamp line under every bubble */}
      <View
        style={{
          width: 34,
          height: 9,
          borderRadius: 4.5,
          marginTop: 5,
          marginHorizontal: 8,
          backgroundColor: PLACEHOLDER,
        }}
      />
    </Animated.View>
  )
}

/**
 * Placeholder for a message thread: pulsing bubbles anchored to the bottom the
 * way the inverted list sits, so a cold thread still reads as a conversation.
 */
export const MessageThreadSkeleton = () => (
  <View className="flex-1 justify-end px-4 py-4">
    {ROWS.map((row, index) => (
      <SkeletonBubble
        key={index}
        row={row}
        // The thread is newest-at-the-bottom, so the pulse runs upward from the
        // last bubble rather than down from the first.
        delay={(ROWS.length - 1 - index) * ROW_STAGGER_MS}
      />
    ))}
  </View>
)

export default MessageThreadSkeleton
