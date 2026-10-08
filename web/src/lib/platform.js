const platform =
  typeof navigator === 'undefined'
    ? ''
    : (navigator.userAgentData?.platform ?? navigator.platform ?? '')

export const isMac = /mac|iphone|ipad|ipod/i.test(platform)

/** Label for the platform's shortcut modifier, for keyboard hints. */
export const modKeyLabel = isMac ? '⌘' : 'Ctrl'

/** Cmd on macOS, Ctrl elsewhere. */
export const hasModKey = (event) => (isMac ? event.metaKey : event.ctrlKey)
