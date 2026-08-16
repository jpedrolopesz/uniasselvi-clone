"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type AppTheme = "light" | "dark";

interface ThemeContextValue {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);
const THEME_COOKIE = "uniasselvi-theme";
const THEME_STORAGE = "uniasselvi-theme";

function applyTheme(theme: AppTheme) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;

  document.querySelectorAll<HTMLIFrameElement>("iframe").forEach((frame) => {
    try {
      const frameRoot = frame.contentDocument?.documentElement;
      if (frameRoot) {
        frameRoot.dataset.theme = theme;
        frameRoot.style.colorScheme = theme;
      }
    } catch {
      // Conteúdo de outra origem mantém o próprio tema.
    }
  });
}

export function ThemeProvider({ initialTheme, children }: { initialTheme: AppTheme; children: ReactNode }) {
  const [theme, setTheme] = useState<AppTheme>(initialTheme);

  useEffect(() => {
    applyTheme(theme);
    window.localStorage.setItem(THEME_STORAGE, theme);
    document.cookie = `${THEME_COOKIE}=${theme}; Path=/; Max-Age=31536000; SameSite=Lax`;
  }, [theme]);

  useEffect(() => {
    function syncTheme(event: StorageEvent) {
      if (event.key === THEME_STORAGE && (event.newValue === "light" || event.newValue === "dark")) {
        setTheme(event.newValue);
      }
    }

    window.addEventListener("storage", syncTheme);
    return () => window.removeEventListener("storage", syncTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((current) => current === "light" ? "dark" : "light");
  }, []);

  const value = useMemo(() => ({ theme, setTheme, toggleTheme }), [theme, toggleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme deve ser usado dentro de ThemeProvider");
  return context;
}
