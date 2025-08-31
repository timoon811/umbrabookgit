"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

export default function UserActions() {
  const { user, loading, mounted } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch (error) {
      console.error("Ошибка при выходе:", error);
      router.push("/login");
    }
  };

  // Показываем одинаковый loading state на сервере и клиенте до монтирования
  if (!mounted) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
        <div className="w-16 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      </div>
    );
  }

  // Показываем loading state если данные загружаются
  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
        <div className="w-16 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      </div>
    );
  }

  // Показываем кнопки входа/регистрации если пользователь не авторизован
  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/login"
          className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
        >
          Войти
        </Link>
        <Link
          href="/register"
          className="px-3 py-1.5 text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 rounded-md transition-colors"
        >
          Регистрация
        </Link>
      </div>
    );
  }

  // Показываем действия авторизованного пользователя
  return (
    <div className="flex items-center gap-2">
      {/* Админ панель (только для администраторов) */}
      {user.role === "ADMIN" && (
        <Link
          href="/admin"
          className="p-2 text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-all duration-200 group"
          title="Админ панель"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </Link>
      )}

      {/* Профиль */}
      <Link
        href="/profile"
        className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900/20 rounded-lg transition-all duration-200 group"
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
      <div className="flex items-center gap-2 ml-2 pl-2 border-l border-gray-200 dark:border-gray-700">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div className="hidden sm:block">
          <div className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-24">
            {user.name}
          </div>
        </div>
      </div>
    </div>
  );
}
