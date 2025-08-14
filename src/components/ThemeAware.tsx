"use client";

import { useTheme } from "@/providers/ThemeProvider";
import { ReactNode } from "react";

interface ThemeAwareProps {
  children: ReactNode;
  lightClassName?: string;
  darkClassName?: string;
  fallback?: ReactNode;
}

export default function ThemeAware({ 
  children, 
  lightClassName = "", 
  darkClassName = "", 
  fallback = null 
}: ThemeAwareProps) {
  const { theme, mounted } = useTheme();

  if (!mounted) {
    return fallback;
  }

  const className = theme === "dark" ? darkClassName : lightClassName;

  return (
    <div className={className}>
      {children}
    </div>
  );
}

// Утилита для условных классов тем
export function themeClass(lightClass: string, darkClass: string) {
  return `${lightClass} dark:${darkClass}`;
}

// Утилита для условных стилей тем
export function themeStyle(lightStyle: React.CSSProperties, darkStyle: React.CSSProperties) {
  return (theme: "light" | "dark") => theme === "dark" ? darkStyle : lightStyle;
}
