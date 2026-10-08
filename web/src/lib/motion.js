/** The one easing curve used across the app (mirrors --ease-out-soft in index.css). */
export const EASE = [0.22, 1, 0.36, 1]

export const transitions = {
  fast: { duration: 0.15, ease: EASE },
  base: { duration: 0.2, ease: EASE },
  slow: { duration: 0.25, ease: EASE },
}

export const fade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
}

export const fadeUp = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 4 },
}

/** Dialogs and other floating panels. */
export const popIn = {
  initial: { opacity: 0, scale: 0.97, y: 8 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.98, y: 4 },
}
