"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme | null;
  setTheme: (theme: Theme) => void;
  toggle: () => void;
  mounted: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Устанавливаем mounted только на клиенте
    setMounted(true);

    // Проверяем, что мы на клиенте
    if (typeof window === 'undefined') return;

    // Получаем сохранённую тему или системную
    const saved = localStorage.getItem("theme");
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    const initial = saved || systemTheme;

    setThemeState(initial as Theme);
    updateTheme(initial as Theme);

    // Слушаем изменения системной темы
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem("theme")) {
        const newTheme = e.matches ? "dark" : "light";
        setThemeState(newTheme);
        updateTheme(newTheme);
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const updateTheme = (newTheme: Theme) => {
    // Проверяем, что мы на клиенте
    if (typeof window === 'undefined') return;

    const root = document.documentElement;

    // Плавно применяем тему
    if (newTheme === "dark") {
      root.classList.add("dark");
      root.style.colorScheme = "dark";
    } else {
      root.classList.remove("dark");
      root.style.colorScheme = "light";
    }
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    // Проверяем, что мы на клиенте перед использованием localStorage
    if (typeof window !== 'undefined' && mounted) {
      localStorage.setItem("theme", newTheme);
    }
    updateTheme(newTheme);
  };

  const toggle = () => {
    if (!theme || !mounted) return; // Не переключаем, если тема еще не загружена или не смонтирована
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
  };

  const value = {
    theme,
    setTheme,
    toggle,
    mounted,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
