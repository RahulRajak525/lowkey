import { differenceInCalendarDays, format, isThisYear, isToday, isYesterday } from 'date-fns'

// date-fns throws "Invalid time value" on an unparseable date, which would
// take a whole list down, so bad timestamps just render as nothing.
export const parseDate = (iso) => {
  if (!iso) return null
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? null : date
}

/** Chat list: "9:41 PM", "Yesterday", "Mon", "Mar 12", "03/12/24". */
export const formatListTime = (iso) => {
  const date = parseDate(iso)
  if (!date) return ''
  if (isToday(date)) return format(date, 'h:mm a')
  if (isYesterday(date)) return 'Yesterday'
  if (differenceInCalendarDays(new Date(), date) < 7) return format(date, 'EEE')
  if (isThisYear(date)) return format(date, 'MMM d')
  return format(date, 'MM/dd/yy')
}

/** A single message: "9:41 PM". */
export const formatMessageTime = (iso) => {
  const date = parseDate(iso)
  return date ? format(date, 'h:mm a') : ''
}

/** Day separators in a thread: "Today", "Yesterday", "Monday", "Monday, Mar 12". */
export const formatDayLabel = (iso) => {
  const date = parseDate(iso)
  if (!date) return ''
  if (isToday(date)) return 'Today'
  if (isYesterday(date)) return 'Yesterday'
  if (differenceInCalendarDays(new Date(), date) < 7) return format(date, 'EEEE')
  if (isThisYear(date)) return format(date, 'EEEE, MMM d')
  return format(date, 'MMM d, yyyy')
}

/** "Mar 12, 2026" */
export const formatFullDate = (iso) => {
  const date = parseDate(iso)
  return date ? format(date, 'MMM d, yyyy') : ''
}
