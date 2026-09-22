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
          path="/"
          element={isSignedIn ? <Navigate to="/chats" replace /> : <SignInPage />}
        />
        <Route
          path="/chats"
          element={isSignedIn ? <ChatsLayout /> : <Navigate to="/" replace />}
        />
        <Route
          path="/chats/:chatId"
          element={isSignedIn ? <ChatsLayout /> : <Navigate to="/" replace />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default App
