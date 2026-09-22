import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '@clerk/react'
import AuthSync from '@/components/AuthSync'
import SocketSync from '@/components/SocketSync'
import SplashScreen from '@/components/common/SplashScreen'
import SignInPage from '@/pages/SignInPage'
import ChatsLayout from '@/pages/ChatsLayout'

function App() {
  const { isLoaded, isSignedIn } = useAuth()

  if (!isLoaded) {
    return <SplashScreen />
  }

  return (
    <>
      <AuthSync />
      <SocketSync />

      <Routes>
        <Route
          path="/chats"
          element={isSignedIn ? <ChatsLayout /> : <Navigate to="/" replace />}
        />
        <Route
          path="/chats/:chatId"
          element={isSignedIn ? <ChatsLayout /> : <Navigate to="/" replace />}
        />
        {/* Wildcard, not an exact "/": Clerk's path-based routing needs
            sub-paths like /sso-callback and /factor-one to also reach
            SignInPage so its <SignIn/> component can read and process
            them — a narrower route would 404 an OAuth redirect mid-flow. */}
        <Route
          path="/*"
          element={isSignedIn ? <Navigate to="/chats" replace /> : <SignInPage />}
        />
      </Routes>
    </>
  )
}

export default App
