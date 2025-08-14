"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useModal } from "@/hooks/useModal";
import AlertModal from "@/components/modals/AlertModal";
import ConfirmModal from "@/components/modals/ConfirmModal";

interface UserDetails {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  isBlocked: boolean;
  telegram?: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  articles: Array<{
    id: string;
    title: string;
    status: string;
    viewCount: number;
    createdAt: string;
  }>;
  comments: Array<{
    id: string;
    content: string;
    status: string;
    createdAt: string;
    article: {
      title: string;
      slug: string;
    };
  }>;
  feedbacks: Array<{
    id: string;
    type: string;
    message?: string;
    rating?: number;
    createdAt: string;
  }>;
  _count: {
    articles: number;
    comments: number;
    feedbacks: number;
  };
}

export default function UserDetailsPage() {
  const params = useParams();
  const userId = params.id as string;
  
  const [user, setUser] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({
    name: "",
    email: "",
    role: "",
    telegram: "",
  });
  
  // Modal hooks
  const { alertModal, confirmModal, success, error, confirm } = useModal();

  const loadUser = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}`);
      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        setEditData({
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
          telegram: data.user.telegram || "",
        });
      }
    } catch (error) {
      console.error("Ошибка загрузки пользователя:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, [userId]);

  const handleAction = async (action: string) => {
    const actionText = {
      approve: "одобрить",
      reject: "отклонить", 
      block: "заблокировать",
      unblock: "разблокировать",
    }[action] || action;

    const confirmed = await confirm(
      `${action === 'approve' ? 'Одобрить' : action === 'reject' ? 'Отклонить' : action === 'block' ? 'Заблокировать' : 'Разблокировать'} пользователя`,
      `Вы уверены, что хотите ${actionText} этого пользователя?`,
      {
        type: action === 'block' || action === 'reject' ? 'warning' : 'info',
        actionType: action as any
      }
    );
    
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });

      const result = await response.json();

      if (response.ok) {
        loadUser();
        success("Действие выполнено успешно");
      } else {
        error(result.message || "Ошибка выполнения действия");
      }
    } catch {
      error("Ошибка сети");
    }
  };

  const handleUpdate = async () => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "update",
          ...editData,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setUser(result.user);
        setEditMode(false);
        success("Пользователь обновлен");
      } else {
        error(result.message || "Ошибка обновления");
      }
    } catch {
      error("Ошибка сети");
    }
  };

  const handleDelete = async () => {
    const confirmed = await confirm(
      "Удалить пользователя",
      "Вы уверены, что хотите удалить этого пользователя? Это действие необратимо.",
      {
        type: 'danger',
        actionType: 'delete'
      }
    );
    
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (response.ok) {
        success("Пользователь удален");
        window.history.back();
      } else {
        error(result.message || "Ошибка удаления");
      }
    } catch {
      error("Ошибка сети");
    }
  };

  const getStatusBadge = (status: string, isBlocked: boolean) => {
    if (isBlocked) {
      return <span className="px-3 py-1 text-sm font-medium bg-red-100 text-red-800 rounded-full">Заблокирован</span>;
    }

    switch (status) {
      case "APPROVED":
        return <span className="px-3 py-1 text-sm font-medium bg-green-100 text-green-800 rounded-full">Одобрен</span>;
      case "PENDING":
        return <span className="px-3 py-1 text-sm font-medium bg-yellow-100 text-yellow-800 rounded-full">Ожидает</span>;
      case "REJECTED":
        return <span className="px-3 py-1 text-sm font-medium bg-red-100 text-red-800 rounded-full">Отклонен</span>;
      default:
        return <span className="px-3 py-1 text-sm font-medium bg-gray-100 text-gray-800 rounded-full">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Загрузка...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Пользователь не найден</h2>
        <Link href="/admin/users" className="mt-4 text-blue-600 hover:text-blue-500">
          ← Вернуться к списку
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Хлебные крошки */}
      <div className="mb-6">
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-4">
            <li>
              <Link href="/admin/users" className="text-gray-500 hover:text-gray-700 dark:text-gray-400">
                Пользователи
              </Link>
            </li>
            <li>
              <span className="text-gray-500 dark:text-gray-400">→</span>
            </li>
            <li>
              <span className="text-gray-900 dark:text-white font-medium">{user.name}</span>
            </li>
          </ol>
        </nav>
      </div>

      {/* Основная информация */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0 h-16 w-16">
                <div className="h-16 w-16 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                  <span className="text-2xl font-medium text-gray-700 dark:text-gray-300">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="ml-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{user.name}</h1>
                <div className="mt-2 flex items-center gap-3">
                  {getStatusBadge(user.status, user.isBlocked)}
                  <span className="px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full">
                    {user.role === "ADMIN" ? "Администратор" : user.role === "MODERATOR" ? "Модератор" : "Пользователь"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setEditMode(!editMode)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                {editMode ? "Отмена" : "Редактировать"}
              </button>

              {user.status === "PENDING" && (
                <>
                  <button
                    onClick={() => handleAction("approve")}
                    className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700"
                  >
                    Одобрить
                  </button>
                  <button
                    onClick={() => handleAction("reject")}
                    className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700"
                  >
                    Отклонить
                  </button>
                </>
              )}

              {user.status === "APPROVED" && !user.isBlocked && (
                <button
                  onClick={() => handleAction("block")}
                  className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700"
                >
                  Заблокировать
                </button>
              )}

              {user.isBlocked && (
                <button
                  onClick={() => handleAction("unblock")}
                  className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700"
                >
                  Разблокировать
                </button>
              )}

              {user.role !== "ADMIN" && (
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700"
                >
                  Удалить
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-4">
          {editMode ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Имя
                </label>
                <input
                  type="text"
                  value={editData.name}
                  onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={editData.email}
                  onChange={(e) => setEditData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Роль
                </label>
                <select
                  value={editData.role}
                  onChange={(e) => setEditData(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="USER">Пользователь</option>
                  <option value="MODERATOR">Модератор</option>
                  <option value="ADMIN">Администратор</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Telegram
                </label>
                <input
                  type="text"
                  value={editData.telegram}
                  onChange={(e) => setEditData(prev => ({ ...prev, telegram: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="@username"
                />
              </div>

              <div className="md:col-span-2">
                <button
                  onClick={handleUpdate}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700"
                >
                  Сохранить изменения
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Email</h3>
                <p className="text-gray-900 dark:text-white">{user.email}</p>
              </div>

              {user.telegram && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Telegram</h3>
                  <p className="text-gray-900 dark:text-white">{user.telegram}</p>
                </div>
              )}

              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Дата регистрации</h3>
                <p className="text-gray-900 dark:text-white">
                  {new Date(user.createdAt).toLocaleDateString("ru", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              {user.lastLoginAt && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Последний вход</h3>
                  <p className="text-gray-900 dark:text-white">
                    {new Date(user.lastLoginAt).toLocaleDateString("ru", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Статистика активности */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="text-2xl font-bold text-blue-600">{user._count.articles}</div>
            <div className="ml-3">
              <div className="text-sm font-medium text-gray-900 dark:text-white">Статьи</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Создано</div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="text-2xl font-bold text-green-600">{user._count.comments}</div>
            <div className="ml-3">
              <div className="text-sm font-medium text-gray-900 dark:text-white">Комментарии</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Написано</div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="text-2xl font-bold text-purple-600">{user._count.feedbacks}</div>
            <div className="ml-3">
              <div className="text-sm font-medium text-gray-900 dark:text-white">Отзывы</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Оставлено</div>
            </div>
          </div>
        </div>
      </div>

      {/* Недавние статьи */}
      {user.articles.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">Недавние статьи</h2>
          </div>
          <div className="px-6 py-4">
            <div className="space-y-4">
              {user.articles.map((article) => (
                <div key={article.id} className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">{article.title}</h3>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(article.createdAt).toLocaleDateString("ru")} • {article.viewCount} просмотров
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    article.status === "PUBLISHED" 
                      ? "bg-green-100 text-green-800" 
                      : "bg-yellow-100 text-yellow-800"
                  }`}>
                    {article.status === "PUBLISHED" ? "Опубликована" : "Черновик"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Недавние комментарии */}
      {user.comments.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">Недавние комментарии</h2>
          </div>
          <div className="px-6 py-4">
            <div className="space-y-4">
              {user.comments.map((comment) => (
                <div key={comment.id} className="border-l-4 border-blue-200 pl-4">
                  <p className="text-sm text-gray-900 dark:text-white">{comment.content}</p>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    К статье "{comment.article.title}" • {new Date(comment.createdAt).toLocaleDateString("ru")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Alert and Confirm Modals */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={alertModal.onClose}
        title={alertModal.options.title}
        message={alertModal.options.message}
        type={alertModal.options.type}
        confirmText={alertModal.options.confirmText}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={confirmModal.onClose}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.options.title}
        message={confirmModal.options.message}
        confirmText={confirmModal.options.confirmText}
        cancelText={confirmModal.options.cancelText}
        type={confirmModal.options.type}
        actionType={confirmModal.options.actionType}
      />
    </div>
  );
}

