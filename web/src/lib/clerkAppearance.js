import { dark } from '@clerk/themes'

/*
 * Clerk is styled entirely through its appearance API: variables theme every
 * Clerk surface (sign-in, the account modal), and style objects rather than
 * class names so they win over Clerk's own CSS-in-JS without !important.
 */

const field = {
  height: '2.75rem',
  backgroundColor: '#18181C',
  boxShadow: '0 0 0 1px rgb(255 255 255 / 0.08)',
  transition: 'box-shadow 150ms cubic-bezier(0.22, 1, 0.36, 1), background-color 150ms',
}

const fieldHover = {
  backgroundColor: '#1D1D22',
  boxShadow: '0 0 0 1px rgb(255 255 255 / 0.14)',
}

const fieldFocus = {
  boxShadow: '0 0 0 1px rgb(244 162 97 / 0.55), 0 0 0 4px rgb(244 162 97 / 0.12)',
}

// The sign-in card sits on LowKey's own floating surface (SignInPage), so its
// own card chrome is cleared. Scoped to signIn/signUp so the account modal
// keeps a solid card.
const embeddedCard = {
  elements: {
    rootBox: { width: '100%' },
    cardBox: {
      width: '100%',
      maxWidth: 'none',
      boxShadow: 'none',
      border: 'none',
      borderRadius: '0',
      background: 'transparent',
    },
    card: {
      width: '100%',
      background: 'transparent',
      boxShadow: 'none',
      border: 'none',
      padding: '2rem 1.75rem 1.5rem',
      gap: '1.75rem',
    },
    footer: {
      background: 'transparent',
      borderTop: '1px solid rgb(255 255 255 / 0.06)',
    },
  },
}

export const clerkAppearance = {
  theme: dark,
  variables: {
    colorPrimary: '#F4A261',
    colorPrimaryForeground: '#1C1009',
    colorBackground: '#121215',
    colorInput: '#18181C',
    colorInputForeground: '#EDEDEF',
    colorForeground: '#EDEDEF',
    colorMutedForeground: '#8B8B94',
    colorNeutral: '#FFFFFF',
    colorBorder: 'rgba(255, 255, 255, 0.1)',
    colorRing: '#F4A261',
    colorDanger: '#F26D6D',
    colorSuccess: '#3DDC97',
    colorWarning: '#F5B544',
    colorShadow: '#000000',
    colorModalBackdrop: '#09090B',
    borderRadius: '0.625rem',
    fontFamily: 'Geist, ui-sans-serif, system-ui, sans-serif',
    fontFamilyButtons: 'Geist, ui-sans-serif, system-ui, sans-serif',
    fontFamilyMono: '"Geist Mono", ui-monospace, monospace',
    fontSize: '0.875rem',
  },
  options: {
    logoPlacement: 'none',
    socialButtonsVariant: 'blockButton',
    socialButtonsPlacement: 'top',
    // Hides the "Development mode" badge on the dev instance; production
    // instances never show it anyway.
    unsafe_disableDevelopmentModeWarnings: true,
  },
  elements: {
    headerTitle: { fontSize: '1.25rem', fontWeight: 600, letterSpacing: '-0.02em' },
    headerSubtitle: { color: '#8B8B94' },
    socialButtonsBlockButton: {
      ...field,
      boxShadow: 'inset 0 1px 0 rgb(255 255 255 / 0.04), 0 0 0 1px rgb(255 255 255 / 0.08)',
      '&:hover': fieldHover,
      '&:focus-visible': fieldFocus,
    },
    socialButtonsBlockButtonText: { fontWeight: 500, color: '#EDEDEF' },
    alternativeMethodsBlockButton: { ...field, '&:hover': fieldHover },
    dividerLine: { background: 'rgb(255 255 255 / 0.07)' },
    dividerText: { color: '#5A5A63', fontSize: '0.75rem' },
    formFieldLabel: { color: '#A1A1AA', fontWeight: 500 },
    formFieldInput: { ...field, '&:hover': fieldHover, '&:focus': fieldFocus },
    otpCodeFieldInput: { boxShadow: '0 0 0 1px rgb(255 255 255 / 0.1)', '&:focus': fieldFocus },
    formFieldAction: { color: '#F4A261', fontWeight: 500 },
    formButtonPrimary: {
      height: '2.75rem',
      fontWeight: 600,
      color: '#1C1009',
      textTransform: 'none',
      background: 'linear-gradient(160deg, #F8BD8F 0%, #F4A261 55%, #EE8A59 100%)',
      boxShadow: 'inset 0 1px 0 rgb(255 255 255 / 0.3), 0 10px 24px -12px rgb(244 162 97 / 0.7)',
      transition: 'filter 150ms, transform 150ms',
      '&:hover': { filter: 'brightness(1.05)' },
      '&:active': { transform: 'scale(0.99)' },
      '&:focus-visible': fieldFocus,
    },
    footerActionText: { color: '#8B8B94' },
    footerActionLink: { color: '#F4A261', fontWeight: 500, '&:hover': { color: '#F8BD8F' } },
    identityPreview: { backgroundColor: '#18181C', boxShadow: '0 0 0 1px rgb(255 255 255 / 0.08)' },
    identityPreviewEditButton: { color: '#F4A261' },
  },
  signIn: embeddedCard,
  signUp: embeddedCard,
}

// The card's heading would otherwise use the app name from the Clerk
// dashboard, which still carries the old tutorial name.
const signInCopy = {
  title: 'Sign in to LowKey',
  titleCombined: 'Sign in to LowKey',
  subtitle: 'Welcome back. Your conversations are waiting.',
  subtitleCombined: 'Welcome back. Your conversations are waiting.',
}

export const clerkLocalization = {
  signIn: { start: signInCopy },
  signUp: {
    start: {
      title: 'Create your LowKey account',
      subtitle: 'Private, real-time messaging in under a minute.',
    },
  },
}
