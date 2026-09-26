import { useCallback, useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import { colorScheme, useColorScheme } from "nativewind";

const STORAGE_KEY = "theme-preference";

export type ThemePreference = "light" | "dark";

/**
 * Literal hex values mirroring the CSS variables in global.css. NativeWind's
 * `bg-surface`/`text-foreground`/etc. classes resolve automatically, but a
 * few native props (Ionicons `color`, ActivityIndicator, RefreshControl,
 * LinearGradient, the Stack navigator's `contentStyle`) take a plain color
 * value instead of a className, so those read from here via `useThemeColors`.
 * Keep these numerically in sync with global.css if either changes.
 */
const LIGHT_COLORS = {
  surface: "#F7F7F8",
  surfaceLight: "#E7E7EA",
  surfaceDark: "#FFFFFF",
  surfaceCard: "#FFFFFF",
  foreground: "#111112",
  mutedForeground: "#5A5A60",
  subtleForeground: "#8A8A91",
};

const DARK_COLORS = {
  surface: "#1A1A1D",
  surfaceLight: "#2D2D30",
  surfaceDark: "#0D0D0F",
  surfaceCard: "#242428",
  foreground: "#FFFFFF",
  mutedForeground: "#A0A0A5",
  subtleForeground: "#6B6B70",
};

/**
 * The brand orange (`primary`) is intentionally identical in both color
 * schemes, so content drawn on top of it needs a color that also stays
 * fixed rather than flipping with the theme.
 */
export const ON_PRIMARY = "#14110D";

export const useThemeColors = () => {
  const { colorScheme: active } = useColorScheme();
  return active === "dark" ? DARK_COLORS : LIGHT_COLORS;
};

/**
 * Applies a persisted theme choice, if any, before the app's first paint.
 * With no stored preference (first launch, or the user never overrode it),
 * NativeWind already falls back to following the OS appearance on its own —
 * this only needs to run when there *is* an explicit override to restore.
 */
export const restoreThemePreference = async () => {
  const saved = await SecureStore.getItemAsync(STORAGE_KEY);
  if (saved === "light" || saved === "dark") {
    colorScheme.set(saved);
  }
};

/** Read/write the user's explicit theme choice; persists across launches. */
export const useThemePreference = () => {
  const { colorScheme: active, setColorScheme } = useColorScheme();

  const setPreference = useCallback(
    (value: ThemePreference) => {
      setColorScheme(value);
      SecureStore.setItemAsync(STORAGE_KEY, value).catch(() => {});
    },
    [setColorScheme],
  );

  return { isDark: active === "dark", setPreference };
};

/** Mount once at the app root so the app boots in the last theme the user chose. */
export const useRestoreThemeOnLaunch = () => {
  useEffect(() => {
    restoreThemePreference();
  }, []);
};
