"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Получаем сохранённую тему или системную
    const saved = localStorage.getItem("theme");
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    const initial = saved || systemTheme;
    
    setTheme(initial as "light" | "dark");
    updateTheme(initial as "light" | "dark");
  }, []);

  const updateTheme = (newTheme: "light" | "dark") => {
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const toggle = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("theme", next);
    updateTheme(next);
  };

  // Предотвращаем гидратацию для избежания несоответствий
  if (!mounted) {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-md border border-black/5 dark:border-white/10">
        <div className="h-4 w-4" />
      </div>
    );
  }

  return (
    <button
      onClick={toggle}
      className="flex h-8 w-8 items-center justify-center rounded-md border border-black/5 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10"
      aria-label="Toggle theme"
    >
      {theme === "light" ? (
        <Moon className="h-4 w-4" />
      ) : (
        <Sun className="h-4 w-4" />
      )}
    </button>
  );
}
