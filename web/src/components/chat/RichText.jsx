import { URL_PATTERN, trimUrl } from '@/lib/links'

// ```fenced blocks``` (an optional language tag on the first line is dropped)
const FENCE = /```(?:[\w+-]*\n)?([\s\S]*?)```/g
const INLINE_CODE = /`([^`\n]+)`/g

const styles = {
  mine: {
    link: 'font-medium underline decoration-brand-ink/35 underline-offset-2 transition-colors hover:decoration-brand-ink',
    code: 'rounded-chip bg-brand-ink/10 px-1 py-px font-mono text-[0.86em]',
    block: 'my-1 block overflow-x-auto whitespace-pre rounded-item bg-brand-ink/10 px-3 py-2 font-mono text-[0.82em] leading-relaxed',
    mark: 'rounded-[3px] bg-brand-ink/20 text-inherit',
  },
  theirs: {
    link: 'text-brand-hi underline decoration-brand-hi/30 underline-offset-2 transition-colors hover:decoration-brand-hi',
    code: 'rounded-chip border border-line bg-canvas/60 px-1 py-px font-mono text-[0.86em]',
    block: 'my-1 block overflow-x-auto whitespace-pre rounded-item border border-line bg-canvas/70 px-3 py-2 font-mono text-[0.82em] leading-relaxed',
    mark: 'rounded-[3px] bg-brand/35 text-fg',
  },
}

const highlight = (text, query, className, keyPrefix) => {
  if (!query) return [text]
  const lower = text.toLowerCase()
  const nodes = []
  let from = 0
  let count = 0
  for (let index = lower.indexOf(query); index !== -1; index = lower.indexOf(query, from)) {
    if (index > from) nodes.push(text.slice(from, index))
    nodes.push(
      <mark key={`${keyPrefix}m${count++}`} className={className}>
        {text.slice(index, index + query.length)}
      </mark>,
    )
    from = index + query.length
  }
  if (from < text.length) nodes.push(text.slice(from))
  return nodes
}

/** Splits `text` on `pattern`, rendering matches and the text between them. */
const splitOn = (text, pattern, renderMatch, renderText) => {
  const nodes = []
  let last = 0
  let count = 0
  for (const match of text.matchAll(pattern)) {
    if (match.index > last) nodes.push(...renderText(text.slice(last, match.index), count))
    const { node, length } = renderMatch(match, count)
    nodes.push(node)
    last = match.index + length
    count++
  }
  if (last < text.length) nodes.push(...renderText(text.slice(last), count))
  return nodes
}

const renderLinks = (text, query, style, prefix) =>
  splitOn(
    text,
    URL_PATTERN,
    (match, count) => {
      const url = trimUrl(match[0])
      return {
        length: url.length,
        node: (
          <a key={`${prefix}a${count}`} href={url} target="_blank" rel="noopener noreferrer" className={style.link}>
            {highlight(url, query, style.mark, `${prefix}a${count}`)}
          </a>
        ),
      }
    },
    (plain, count) => highlight(plain, query, style.mark, `${prefix}t${count}`),
  )

const renderInline = (text, query, style, prefix) =>
  splitOn(
    text,
    INLINE_CODE,
    (match, count) => ({
      length: match[0].length,
      node: (
        <code key={`${prefix}c${count}`} className={style.code}>
          {highlight(match[1], query, style.mark, `${prefix}c${count}`)}
        </code>
      ),
    }),
    (plain, count) => renderLinks(plain, query, style, `${prefix}i${count}`),
  )

/**
 * Message text with clickable links, `inline code`, ```code blocks```, and
 * in-thread search matches highlighted. Rendering only — the stored text is
 * untouched, so the mobile app still shows it verbatim.
 */
const RichText = ({ text, query = '', tone }) => {
  const style = styles[tone]
  const normalizedQuery = query.trim().toLowerCase()

  return splitOn(
    text,
    FENCE,
    (match, count) => ({
      length: match[0].length,
      node: (
        <code key={`b${count}`} className={style.block}>
          {highlight(match[1].replace(/\n$/, ''), normalizedQuery, style.mark, `b${count}`)}
        </code>
      ),
    }),
    (plain, count) => renderInline(plain, normalizedQuery, style, `f${count}`),
  )
}

export default RichText
