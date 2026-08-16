"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/layout/ThemeProvider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Ativar tema claro" : "Ativar tema escuro"}
      aria-pressed={!isDark}
      title={isDark ? "Ativar tema claro" : "Ativar tema escuro"}
      className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-black/15 bg-black/10 text-black transition hover:bg-black/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
    >
      {isDark ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
    </button>
  );
}
