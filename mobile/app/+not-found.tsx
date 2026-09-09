import { Link, Redirect, usePathname } from 'expo-router'
import { Text, View } from 'react-native'

/**
 * Clerk's hosted auth redirects back to `clerk://<package>.hosted-callback`.
 * `useHostedAuth` consumes that URL itself to finish the sign-in, but the deep
 * link is also handed to the router, which has no route for it. Send those to
 * the root so index can route on the (now active) session instead of showing
 * "Unmatched Route" over a successful login.
 */
export default function NotFound() {
  const pathname = usePathname()

  if (pathname.includes('hosted-callback')) {
    return <Redirect href="/" />
  }

  return (
    <View className="flex-1 items-center justify-center gap-3 bg-[#0D0D0F] px-8">
      <Text className="text-2xl font-bold text-white">Page not found</Text>
      <Text className="text-center text-base text-[#A0A0A5]">
        That screen doesn&apos;t exist.
      </Text>
      <Link href="/" replace className="mt-2">
        <Text className="text-base font-semibold text-[#F4A261]">Go home</Text>
      </Link>
    </View>
  )
}
