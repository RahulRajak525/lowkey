import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'
import { Show, SignInButton, SignUpButton, UserButton } from '@clerk/react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
    <h1>Hello world</h1>
     <Show when="signed-out">
          <SignInButton mode="modal"/>
          <SignUpButton />
        </Show>
        <Show when="signed-in">
          <UserButton />
        </Show>
    </>
  )
}

export default App
