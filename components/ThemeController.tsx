"use client";

import { useEffect } from "react";

export const THEME_CHANGED_EVENT = "defiance-theme-changed";
export type ThemePreference = "system" | "light" | "dark";

const STORAGE_KEY = "defiance-settings-preferences";

const getStoredTheme = (): ThemePreference => {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return "system";

    const parsed = JSON.parse(saved);
    return parsed?.theme || "system";
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
