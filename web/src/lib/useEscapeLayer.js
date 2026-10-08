import { useEffect, useRef } from 'react'

// Open layers (dialogs, menus, panels) in the order they opened. Escape only
// closes the topmost one, so a confirm dialog over the details panel doesn't
// take the panel down with it.
const layers = []
let listening = false

const handleKeyDown = (event) => {
  if (event.key !== 'Escape' || layers.length === 0) return
  event.preventDefault()
  layers[layers.length - 1].current()
}

export const useEscapeLayer = (onEscape, active = true) => {
  const handlerRef = useRef(onEscape)

  useEffect(() => {
    handlerRef.current = onEscape
  })

  useEffect(() => {
    if (!active) return undefined
    if (!listening) {
      document.addEventListener('keydown', handleKeyDown)
      listening = true
    }
    layers.push(handlerRef)
    return () => {
      const index = layers.indexOf(handlerRef)
      if (index !== -1) layers.splice(index, 1)
    }
  }, [active])
}
