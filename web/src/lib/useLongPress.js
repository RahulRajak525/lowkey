import { useRef } from 'react'

const LONG_PRESS_MS = 450
const MOVE_TOLERANCE_PX = 10

/**
 * Touch long-press. A mouse right-click already fires `contextmenu`, but iOS
 * Safari never does for a long touch, so touch gets its own timer. Moving
 * (scrolling) cancels it, and the click that ends a long press is swallowed
 * so it doesn't also activate whatever was pressed.
 */
export const useLongPress = (onLongPress) => {
  const timer = useRef(null)
  const origin = useRef({ x: 0, y: 0 })
  const fired = useRef(false)

  const cancel = () => {
    clearTimeout(timer.current)
    timer.current = null
  }

  return {
    onPointerDown: (event) => {
      if (event.pointerType !== 'touch') return
      fired.current = false
      origin.current = { x: event.clientX, y: event.clientY }
      cancel()
      timer.current = setTimeout(() => {
        timer.current = null
        fired.current = true
        onLongPress()
      }, LONG_PRESS_MS)
    },
    onPointerMove: (event) => {
      if (!timer.current) return
      const dx = Math.abs(event.clientX - origin.current.x)
      const dy = Math.abs(event.clientY - origin.current.y)
      if (dx > MOVE_TOLERANCE_PX || dy > MOVE_TOLERANCE_PX) cancel()
    },
    onPointerUp: cancel,
    onPointerCancel: cancel,
    onClickCapture: (event) => {
      if (!fired.current) return
      fired.current = false
      event.preventDefault()
      event.stopPropagation()
    },
  }
}
