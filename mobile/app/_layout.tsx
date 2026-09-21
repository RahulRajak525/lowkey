import { Stack } from "expo-router";
import "../global.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ClerkProvider } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache'
import AuthSync from "../components/AuthSync";
import SocketSync from "../components/SocketSync";
import { StatusBar } from "expo-status-bar";
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'https://3022aca7ae47a4005faecac6faec0620@o4511890536005632.ingest.de.sentry.io/4512061727244368',

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Enable Logs
  enableLogs: true,

  // Configure Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration(),
    Sentry.reactNativeTracingIntegration({
      traceFetch: true,
      traceXHR: true,
      enableHTTPTimings: true,
    })
  ],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

const queryClient = new QueryClient();
const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!

if (!publishableKey) {
  throw new Error('Add your Clerk Publishable Key to the .env file')
}

export default Sentry.wrap(function RootLayout() {
  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
    <QueryClientProvider client={queryClient}>
      <AuthSync />
      <SocketSync />
      <StatusBar style="light"/>
      <Stack screenOptions={{headerShown:false, contentStyle:{backgroundColor:'#0D0D0F'}}}>
        <Stack.Screen name="index" options={{ animation: "fade" }}/>
        <Stack.Screen name="(auth)" options={{ animation: "fade" }} />
        <Stack.Screen name="(tabs)" options={{ animation: "fade" }}/>
        <Stack.Screen
          name="new-chat"
          options={{ presentation: "modal", animation: "slide_from_bottom", gestureEnabled: true }}
        />
      </Stack>
    </QueryClientProvider>
    </ClerkProvider>
  );
});
