import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ClerkProvider } from '@clerk/react'
import './index.css'
import App from './App.jsx'
import ServerWakeNotice from '@/components/common/ServerWakeNotice'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error('Add your Clerk Publishable Key to the .env file')
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* Outside Clerk: the notice only talks to /health, and must be up
        while Clerk is still loading and the splash screen is showing. */}
    <ServerWakeNotice />
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      signInFallbackRedirectUrl="/chats"
      afterSignOutUrl="/"
    >
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </ClerkProvider>
  </StrictMode>,
)
