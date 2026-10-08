// Deliberately simple: http(s) up to the next whitespace, minus trailing
// punctuation that usually belongs to the sentence rather than the URL.
export const URL_PATTERN = /https?:\/\/[^\s<>"']+/gi
const TRAILING_PUNCTUATION = /[.,!?;:'")\]]+$/

export const trimUrl = (url) => url.replace(TRAILING_PUNCTUATION, '')

/** Most recent unique links across `messages` (oldest first), newest first. */
export const extractLinks = (messages, limit) => {
  const found = new Set()
  for (let index = messages.length - 1; index >= 0 && found.size < limit; index--) {
    for (const match of messages[index].text?.matchAll(URL_PATTERN) ?? []) {
      found.add(trimUrl(match[0]))
      if (found.size >= limit) break
    }
  }
  return [...found]
}

/** "https://www.example.com/a/" → "example.com/a" */
export const prettyUrl = (url) => url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')
