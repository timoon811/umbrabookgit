"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ThemeToggle from "./ThemeToggle";
import UmbraLogo from "./UmbraLogo";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

export default function AdminHeader() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await fetch("/api/auth/me");
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else if (response.status === 401) {
        setUser(null);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.warn("Проблема с получением данных пользователя:", errorData.message || `Status: ${response.status}`);
        setUser(null);
      }
    } catch (error) {
      console.warn("Ошибка соединения при получении данных пользователя:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch (error) {
      console.error("Ошибка при выходе:", error);
      router.push("/login");
    }
  };

  if (loading) {
    return (
      <header className="fixed-header">
        <div className="mx-auto max-w-screen-2xl px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-200 dark:bg-[#0a0a0a] rounded animate-pulse"></div>
              <div className="w-32 h-6 bg-gray-200 dark:bg-[#0a0a0a] rounded animate-pulse"></div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-gray-200 dark:bg-[#0a0a0a] rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="fixed-header">
      <div className="mx-auto max-w-screen-2xl px-6">
        <div className="flex items-center justify-between h-14">
          {/* Логотип и название админ панели */}
          <div className="flex items-center gap-3">
            <Link href="/admin" className="flex items-center gap-2">
              <UmbraLogo size="sm" />
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold text-[#171717] dark:text-[#ededed]">
                  Umbra Platform
                </span>
                <span className="px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full font-medium">
                  Admin
                </span>
              </div>
            </Link>
          </div>

          {/* Правая часть с действиями пользователя */}
          <div className="flex items-center gap-3">
            {/* Возврат в пользовательский интерфейс */}
            <Link
              href="/"
              className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-900/20 rounded-lg transition-all duration-200 group"
              title="Вернуться к пользовательскому интерфейсу"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>

            {/* Профиль */}
            <Link
              href="/profile"
              className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-900/20 rounded-lg transition-all duration-200 group"
              title="Профиль"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </Link>

            {/* Выход */}
            <button
              onClick={handleLogout}
              className="p-2 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 group"
              title="Выйти"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>

            {/* Аватар пользователя */}
            {user && (
              <div className="flex items-center gap-2 ml-2 pl-2 border-l border-gray-200 dark:border-gray-700">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-500 to-gray-700 flex items-center justify-center text-white text-sm font-semibold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block">
                  <div className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-24">
                    {user.name}
                  </div>
                </div>
              </div>
            )}

            {/* Переключатель темы */}
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}


