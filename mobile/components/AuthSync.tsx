import {useAuthCallback} from "../hooks/useAuth";
import {useEffect, useRef} from "react";
import {useAuth , useUser} from "@clerk/expo";

 const  AuthSync=()=> {
  const {isSignedIn} = useAuth()
  const {user} = useUser()
  const {mutate: syncUser} = useAuthCallback()
  const hasSynced = useRef(false)  // this is used to prevent multiple syncs during the same session
useEffect(()=>{
  if(isSignedIn && user && !hasSynced.current){
    hasSynced.current = true
      syncUser(undefined ,{
        onSuccess:(data)=>{
          console.log("✅ User synced with backend successfully:", data.name)
        },
        onError:(error)=>{
          hasSynced.current = false // let the next sign-in / user update retry a failed sync
          console.error("❌ Error syncing user:", error.message)
        }
      })

  }
if(!isSignedIn){
  hasSynced.current = false
  }
},[isSignedIn, user, syncUser])

  return null
}
export default AuthSync
