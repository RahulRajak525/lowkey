import { TypingBubble } from "@/components/TypingBubble";
import { API_URL } from "@/lib/axios";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { AppState, Text, View } from "react-native";
import Animated, { FadeInUp, FadeOutUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// How long /health may take before it's treated as a cold start. A warm
// Render instance answers in well under this, so the notice never flashes.
const SLOW_AFTER_MS = 2500;
const RETRY_EVERY_MS = 3000;
const ATTEMPT_TIMEOUT_MS = 20000;
// Render's free plan sleeps after ~15 min without traffic, so an app left in
// the background for longer than this re-checks when it comes back.
const RECHECK_AFTER_BACKGROUND_MS = 10 * 60 * 1000;
const CONNECTED_VISIBLE_MS = 1800;

type Status = "hidden" | "waking" | "connected";

const pingHealth = async () => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ATTEMPT_TIMEOUT_MS);
  try {
    const response = await fetch(`${API_URL}/health`, {
      signal: controller.signal,
      cache: "no-store",
    });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
};

/**
 * Tells the user when the API is waking from Render's free-tier sleep instead
 * of leaving them on a loader for ~30s. Deliberately keeps no persisted
 * "seen" flag: every launch (and every return from a long stay in the
 * background) measures /health afresh, so opening the app after a long break
 * shows the notice again, and a warm server never shows it at all.
 */
const ServerWakeNotice = () => {
  const [status, setStatus] = useState<Status>("hidden");
  const insets = useSafeAreaInsets();

  useEffect(() => {
    // Bumped by every new check and by unmount, so a stale check stops.
    let latestRun = 0;

    const check = async () => {
      const run = ++latestRun;
      const isCurrent = () => run === latestRun;

      let shown = false;
      const slowTimer = setTimeout(() => {
        if (!isCurrent()) return;
        shown = true;
        setStatus("waking");
      }, SLOW_AFTER_MS);

      for (;;) {
        const started = Date.now();
        const ok = await pingHealth();
        if (!isCurrent()) return clearTimeout(slowTimer);
        if (ok) break;
        await new Promise((resolve) =>
          setTimeout(resolve, Math.max(0, RETRY_EVERY_MS - (Date.now() - started))),
        );
        if (!isCurrent()) return clearTimeout(slowTimer);
      }

      clearTimeout(slowTimer);
      // A fast answer never showed anything, so there's nothing to confirm.
      if (!shown) return;
      setStatus("connected");
      setTimeout(() => {
        if (isCurrent()) setStatus("hidden");
      }, CONNECTED_VISIBLE_MS);
    };

    check();

    let backgroundedAt: number | null = null;
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "background") {
        backgroundedAt = Date.now();
      } else if (
        state === "active" &&
        backgroundedAt &&
        Date.now() - backgroundedAt >= RECHECK_AFTER_BACKGROUND_MS
      ) {
        backgroundedAt = null;
        check();
      }
    });

    return () => {
      latestRun++; // cancels any in-flight check
      subscription.remove();
    };
  }, []);

  if (status === "hidden") return null;

  return (
    <View
      pointerEvents="box-none"
      style={{ position: "absolute", top: insets.top + 8, left: 16, right: 16, zIndex: 50 }}
    >
      <Animated.View
        entering={FadeInUp.duration(200)}
        exiting={FadeOutUp.duration(200)}
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        className="rounded-2xl border border-surface-light bg-surface-card px-4 py-3"
        style={{
          shadowColor: "#000",
          shadowOpacity: 0.25,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
          elevation: 8,
        }}
      >
        {status === "waking" ? (
          <View className="flex-row items-center gap-3">
            <TypingBubble dotSize={6} />
            <View className="flex-1">
              <Text className="text-sm font-semibold text-foreground">Waking up the server…</Text>
              <Text className="mt-0.5 text-xs text-subtle-foreground">
                LowKey runs on a free server that naps when idle. This can take up to a minute —
                thanks for your patience!
              </Text>
            </View>
          </View>
        ) : (
          <View className="flex-row items-center gap-3">
            <Ionicons name="checkmark-circle" size={20} color="#F4A261" />
            <Text className="text-sm font-semibold text-foreground">
              Server is awake — you’re all set!
            </Text>
          </View>
        )}
      </Animated.View>
    </View>
  );
};

export default ServerWakeNotice;
