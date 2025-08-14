"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/providers/ThemeProvider";

export default function ThemeToggle() {
  const { theme, mounted, toggle } = useTheme();

  // Предотвращаем гидратацию для избежания несоответствий
  if (!mounted) {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-md border border-black/5 dark:border-white/10 bg-white dark:bg-gray-800">
        <div className="h-4 w-4 animate-pulse bg-gray-300 dark:bg-gray-600 rounded" />
      </div>
    );
  }

  return (
    <button
      onClick={toggle}
      className="flex h-8 w-8 items-center justify-center rounded-md border border-black/5 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10 transition-colors duration-200"
      aria-label="Toggle theme"
      title={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
    >
      {theme === "light" ? (
        <Moon className="h-4 w-4 text-gray-700" />
      ) : (
        <Sun className="h-4 w-4 text-yellow-500" />
      )}
    </button>
  );
}
