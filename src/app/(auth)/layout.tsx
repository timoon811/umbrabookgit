import type { Metadata } from "next";
import ThemeToggle from "@/components/ThemeToggle";

export const metadata: Metadata = {
  title: "Umbra Platform - Вход",
  description: "Вход в Umbra Platform - Платформа для разработчиков",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] relative">
      {/* Переключатель темы в правом верхнем углу */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      
      {/* Основной контент страницы аутентификации */}
      {children}
    </div>
  );
}
