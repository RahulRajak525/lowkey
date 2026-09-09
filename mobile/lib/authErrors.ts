/**
 * Clerk's signals API returns `{ error }` rather than throwing, and the error
 * carries a developer-facing `message` plus a user-facing `longMessage`.
 */
export function authErrorMessage(error: unknown): string {
  if (error && typeof error === 'object') {
    const e = error as { longMessage?: string; message?: string }
    if (e.longMessage) return e.longMessage
    if (e.message) return e.message
  }
  return error ? String(error) : 'Something went wrong.'
}

/** Mirrors the Clerk instance password policy (min length 15). */
export const PASSWORD_MIN_LENGTH = 15
