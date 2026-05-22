"use client";

import { useEffect } from "react";

export const THEME_CHANGED_EVENT = "defiance-theme-changed";
export const SETTINGS_STORAGE_KEY = "defiance-settings-preferences";
export const LEGACY_SETTINGS_STORAGE_KEY = "spendwise-settings-preferences";
export type ThemePreference = "system" | "light" | "dark";

const isThemePreference = (value: unknown): value is ThemePreference =>
  value === "system" || value === "light" || value === "dark";

const readStoredPreferences = () => {
  const saved =
    window.localStorage.getItem(SETTINGS_STORAGE_KEY) ||
    window.localStorage.getItem(LEGACY_SETTINGS_STORAGE_KEY);

  if (!saved) return null;
  return JSON.parse(saved);
};

const getStoredTheme = (): ThemePreference => {
  try {
    const parsed = readStoredPreferences();
    return isThemePreference(parsed?.theme) ? parsed.theme : "system";
  } catch {
    return "system";
  }
};

const applyTheme = (theme: ThemePreference) => {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const shouldUseDark = theme === "dark" || (theme === "system" && prefersDark);
  document.documentElement.classList.toggle("dark", shouldUseDark);
};

const ThemeController = () => {
  useEffect(() => {
    applyTheme(getStoredTheme());

    const handleThemeChange = (event: Event) => {
      applyTheme((event as CustomEvent<ThemePreference>).detail || getStoredTheme());
    };

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemThemeChange = () => {
      if (getStoredTheme() === "system") applyTheme("system");
    };

    window.addEventListener(THEME_CHANGED_EVENT, handleThemeChange);
    mediaQuery.addEventListener("change", handleSystemThemeChange);

    return () => {
      window.removeEventListener(THEME_CHANGED_EVENT, handleThemeChange);
      mediaQuery.removeEventListener("change", handleSystemThemeChange);
    };
  }, []);

  return null;
};

export default ThemeController;
