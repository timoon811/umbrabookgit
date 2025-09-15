"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { hasAdminAccess } from "@/lib/permissions";
import { getRoleDisplayName } from "@/types/roles";
import type { UserRole } from "@/types/roles";
import WalletsTab from "@/components/WalletsTab";
import { useAuth } from "@/hooks/useAuth";
import { getUserInitial } from "@/utils/userUtils";

interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<"info" | "security" | "wallets">("info");
  const [passwordData, setPasswordData] = useState<PasswordChangeData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const router = useRouter();

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    setNotification(null);

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(passwordData),
      });

      const data = await response.json();

      if (response.ok) {
        setNotification({
          type: "success",
          message: "Пароль успешно изменен!",
        });
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        setNotification({
          type: "error",
          message: data.error || "Ошибка при смене пароля",
        });
      }
    } catch (error) {
      setNotification({
        type: "error",
        message: "Произошла ошибка. Попробуйте еще раз.",
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("ru-RU", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getRoleName = (role: string) => {
    return getRoleDisplayName(role as UserRole);
  };

  // Функция getStatusName удалена (поле status больше не используется)

  // Функция getStatusColor удалена (поле status больше не используется)

  const getRoleColor = (role: string) => {
    const colorMap: Record<string, string> = {
      ADMIN: "bg-purple-500/15 text-purple-700 dark:bg-purple-500/30 dark:text-purple-300",
      USER: "bg-gray-500/15 text-gray-800 dark:bg-white/10 dark:text-white",
      PROCESSOR: "bg-blue-500/15 text-blue-700 dark:bg-blue-500/30 dark:text-blue-300",
      MEDIA_BUYER: "bg-orange-500/15 text-orange-700 dark:bg-orange-500/30 dark:text-orange-300",
      ROP_PROCESSOR: "bg-indigo-500/15 text-indigo-700 dark:bg-indigo-500/30 dark:text-indigo-300",
      ROP_BUYER: "bg-pink-500/15 text-pink-700 dark:bg-pink-500/30 dark:text-pink-300",
      MODERATOR: "bg-gray-500/15 text-gray-700 dark:bg-gray-500/30 dark:text-gray-300",
      SUPPORT: "bg-green-500/15 text-green-700 dark:bg-green-500/30 dark:text-green-300",
    };
    return colorMap[role] || "bg-black/10 dark:bg-white/20 text-black/70 dark:text-white/70";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-500/30 border-t-gray-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-black/90 dark:text-white/90 mb-2">
            Пользователь не найден
          </h1>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            Вернуться к входу
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a]">
      {/* Контейнер с правильным выравниванием */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="max-w-4xl mx-auto">
          {/* Кнопка возврата сверху слева */}
          <div className="mb-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-black/60 dark:text-white/60 hover:text-black/80 dark:hover:text-white/80 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Вернуться к главной странице
            </Link>
          </div>

          {/* Заголовок */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-black/90 dark:text-white/90 mb-2">
              Профиль пользователя
            </h1>
            <p className="text-sm sm:text-base text-black/60 dark:text-white/60">
              Управляйте настройками вашего аккаунта и безопасностью
            </p>
          </div>

          {/* Информация о пользователе */}
          <div className="mb-8 p-4 sm:p-6 border border-black/5 dark:border-white/10 rounded-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                {'P'}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg sm:text-xl font-semibold text-black/90 dark:text-white/90 mb-1">
                  {user.name || 'Пользователь'}
                </h2>
                <p className="text-sm sm:text-base text-black/70 dark:text-white/70 mb-3 break-all">
                  {user.email}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  {/* Статус пользователя убран */}
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${getRoleColor(
                      user.role
                    )}`}
                  >
                    {getRoleName(user.role)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Табы */}
          <div className="mb-6">
            <div className="border-b border-black/5 dark:border-white/10">
              <nav className="flex space-x-6 sm:space-x-8 overflow-x-auto">
                <button
                  onClick={() => setActiveTab("info")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                    activeTab === "info"
                      ? "border-gray-500 text-gray-600 dark:text-gray-400"
                      : "border-transparent text-black/60 dark:text-white/60 hover:text-black/80 dark:hover:text-white/80"
                  }`}
                >
                  Информация
                </button>
                <button
                  onClick={() => setActiveTab("security")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                    activeTab === "security"
                      ? "border-gray-500 text-gray-600 dark:text-gray-400"
                      : "border-transparent text-black/60 dark:text-white/60 hover:text-black/80 dark:hover:text-white/80"
                  }`}
                >
                  Безопасность
                </button>
                <button
                  onClick={() => setActiveTab("wallets")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                    activeTab === "wallets"
                      ? "border-gray-500 text-gray-600 dark:text-gray-400"
                      : "border-transparent text-black/60 dark:text-white/60 hover:text-black/80 dark:hover:text-white/80"
                  }`}
                >
                  Кошельки
                </button>
              </nav>
            </div>
          </div>

          {/* Содержимое табов */}
          {activeTab === "info" && (
            <div className="space-y-6">
              {/* Основная информация */}
              <div className="p-4 sm:p-6 border border-black/5 dark:border-white/10 rounded-lg">
                <h3 className="text-lg font-semibold text-black/90 dark:text-white/90 mb-4">
                  Основная информация
                </h3>
                <dl className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <dt className="text-sm font-medium text-black/60 dark:text-white/60 mb-1">
                      Имя пользователя
                    </dt>
                    <dd className="text-sm text-black/90 dark:text-white/90 break-words">
                      {user.name || 'Пользователь'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-black/60 dark:text-white/60 mb-1">
                      Email адрес
                    </dt>
                    <dd className="text-sm text-black/90 dark:text-white/90 break-all">
                      {user.email}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-black/60 dark:text-white/60 mb-1">
                      Роль в системе
                    </dt>
                    <dd className="text-sm text-black/90 dark:text-white/90">
                      {getRoleName(user.role)}
                    </dd>
                  </div>
                  {/* Статус аккаунта убран */}
                  {/* Поле Telegram удалено */}
                  <div>
                    <dt className="text-sm font-medium text-black/60 dark:text-white/60 mb-1">
                      Дата регистрации
                    </dt>
                    <dd className="text-sm text-black/90 dark:text-white/90">
                      {formatDate(user.createdAt)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-black/60 dark:text-white/60 mb-1">
                      Последний вход
                    </dt>
                    <dd className="text-sm text-black/90 dark:text-white/90">
                      {user.lastLoginAt ? formatDate(user.lastLoginAt) : "Никогда"}
                    </dd>
                  </div>
                  <div className="lg:col-span-2">
                    <dt className="text-sm font-medium text-black/60 dark:text-white/60 mb-1">
                      ID пользователя
                    </dt>
                    <dd className="text-sm">
                      <code className="bg-black/5 dark:bg-white/10 px-2 py-1 rounded text-xs font-mono text-black/80 dark:text-white/80 break-all">
                        {user.id}
                      </code>
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Быстрые действия */}
              {user && hasAdminAccess(user.role as UserRole) && (
                <div className="p-4 sm:p-6 border border-black/5 dark:border-white/10 rounded-lg">
                  <h3 className="text-lg font-semibold text-black/90 dark:text-white/90 mb-4">
                    Административные функции
                  </h3>
                  <Link
                    href="/admin"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 dark:bg-purple-500/20 hover:bg-purple-500/20 dark:hover:bg-purple-500/30 text-purple-600 dark:text-purple-400 rounded-md transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Перейти в админ-панель
                  </Link>
                </div>
              )}
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-6">
              {/* Смена пароля */}
              <div className="p-4 sm:p-6 border border-black/5 dark:border-white/10 rounded-lg">
                <h3 className="text-lg font-semibold text-black/90 dark:text-white/90 mb-4">
                  Смена пароля
                </h3>
                <p className="text-sm text-black/60 dark:text-white/60 mb-6">
                  Обновите свой пароль для обеспечения безопасности аккаунта
                </p>

                {notification && (
                  <div
                    className={`mb-4 p-3 rounded-md text-sm ${
                      notification.type === "success"
                        ? "bg-green-500/15 text-green-700 dark:bg-green-500/30 dark:text-green-300"
                        : "bg-red-500/15 text-red-700 dark:bg-red-500/30 dark:text-red-300"
                    }`}
                  >
                    {notification.message}
                  </div>
                )}

                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-black/70 dark:text-white/80 mb-2">
                      Текущий пароль
                    </label>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, currentPassword: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-black/10 dark:border-white/10 rounded-md bg-transparent text-black/90 dark:text-white/90 text-sm focus:outline-none focus:border-gray-500 dark:focus:border-gray-400 transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black/70 dark:text-white/80 mb-2">
                      Новый пароль
                    </label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, newPassword: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-black/10 dark:border-white/10 rounded-md bg-transparent text-black/90 dark:text-white/90 text-sm focus:outline-none focus:border-gray-500 dark:focus:border-gray-400 transition-colors"
                      minLength={6}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black/70 dark:text-white/80 mb-2">
                      Подтвердите новый пароль
                    </label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-black/10 dark:border-white/10 rounded-md bg-transparent text-black/90 dark:text-white/90 text-sm focus:outline-none focus:border-gray-500 dark:focus:border-gray-400 transition-colors"
                      minLength={6}
                      required
                    />
                  </div>
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={passwordLoading}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 dark:bg-white/10 dark:hover:bg-white/20 disabled:bg-gray-700 text-white text-sm font-medium rounded-md transition-colors disabled:cursor-not-allowed"
                    >
                      {passwordLoading && (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                      )}
                      {passwordLoading ? "Обновление..." : "Обновить пароль"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {activeTab === "wallets" && <WalletsTab />}
        </div>
      </div>
    </div>
  );
}