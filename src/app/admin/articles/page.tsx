"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useModal } from "@/hooks/useModal";
import AlertModal from "@/components/modals/AlertModal";
import ConfirmModal from "@/components/modals/ConfirmModal";

// Типы данных
interface Article {
  id: string;
  title: string;
  slug: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  category: string;
  author: {
    id: string;
    name: string;
    email: string;
  };
  viewCount: number;
  likeCount: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    comments: number;
    feedbacks: number;
  };
}

interface ArticlesResponse {
  articles: Article[];
  total: number;
  limit: number;
  offset: number;
}

// Компонент главной страницы управления статьями
export default function ArticlesManagementPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedArticles, setSelectedArticles] = useState<string[]>([]);
  
  // Modal hooks
  const { alertModal, confirmModal, success, error, confirm } = useModal();

  // Загрузка статей
  const loadArticles = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: "20",
        offset: ((currentPage - 1) * 20).toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(selectedCategory && { category: selectedCategory }),
        ...(selectedStatus && { status: selectedStatus }),
      });

      const response = await fetch(`/api/admin/articles?${params}`);
      if (response.ok) {
        const data: ArticlesResponse = await response.json();
        setArticles(data.articles);
        setTotalPages(Math.ceil(data.total / data.limit));
      } else {
        console.error("Failed to load articles");
      }
    } catch (error) {
      console.error("Error loading articles:", error);
    } finally {
      setLoading(false);
    }
  };

  // Действия со статьями
  const handleStatusChange = async (articleId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/articles/${articleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        loadArticles();
      } else {
        console.error("Failed to update article status");
      }
    } catch (error) {
      console.error("Error updating article status:", error);
    }
  };

  const handleDeleteArticle = async (articleId: string) => {
    const confirmed = await confirm(
      "Удалить статью",
      "Вы уверены, что хотите удалить эту статью? Это действие необратимо.",
      {
        type: 'danger',
        actionType: 'delete'
      }
    );
    
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/admin/articles/${articleId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        loadArticles();
        success("Статья удалена");
      } else {
        error("Ошибка удаления статьи");
      }
    } catch {
      error("Ошибка сети");
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedArticles.length === 0) return;

    try {
      const response = await fetch("/api/admin/articles/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          articleIds: selectedArticles,
        }),
      });

      if (response.ok) {
        setSelectedArticles([]);
        loadArticles();
      } else {
        console.error("Failed to perform bulk action");
      }
    } catch (error) {
      console.error("Error performing bulk action:", error);
    }
  };

  // Загрузка данных при изменении фильтров
  useEffect(() => {
    loadArticles();
  }, [currentPage, searchTerm, selectedCategory, selectedStatus]);

  // Получение бейджа статуса
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      DRAFT: { color: "gray", text: "Черновик" },
      PUBLISHED: { color: "green", text: "Опубликовано" },
      ARCHIVED: { color: "yellow", text: "Архив" },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.DRAFT;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
        ${config.color === "green" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" :
          config.color === "yellow" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" :
          "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"}`}>
        {config.text}
      </span>
    );
  };

  // Получение бейджа категории
  const getCategoryBadge = (category: string) => {
    const categoryNames: Record<string, string> = {
      "getting-started": "Начало работы",
      "api": "API Reference",
      "cms-modules": "Модули CMS",
      "forms-buttons": "Формы и кнопки",
    };

    return (
      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-white/10 dark:text-white">
        {categoryNames[category] || category}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Заголовок и кнопка создания */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#171717] dark:text-[#ededed]">
            Управление статьями
          </h1>
          <p className="text-sm text-[#171717]/60 dark:text-[#ededed]/60 mt-1">
            Создавайте, редактируйте и управляйте статьями документации
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/articles/categories"
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            📁 Категории
          </Link>
          <Link
            href="/admin/articles/new"
           className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 dark:bg-white/10 dark:hover:bg-white/20 transition-colors"
          >
            ✏️ Создать статью
          </Link>
        </div>
      </div>

      {/* Фильтры и поиск */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-white dark:bg-[#0a0a0a] rounded-lg border border-[#171717]/5 dark:border-[#ededed]/10">
        <div>
          <label className="block text-sm font-medium text-[#171717] dark:text-[#ededed] mb-1">
            Поиск
          </label>
          <input
            type="text"
            placeholder="Поиск по заголовку или содержимому..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-[#171717] dark:text-[#ededed] text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#171717] dark:text-[#ededed] mb-1">
            Категория
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-[#171717] dark:text-[#ededed] text-sm"
          >
            <option value="">Все категории</option>
            <option value="getting-started">Начало работы</option>
            <option value="api">API Reference</option>
            <option value="cms-modules">Модули CMS</option>
            <option value="forms-buttons">Формы и кнопки</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#171717] dark:text-[#ededed] mb-1">
            Статус
          </label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-[#171717] dark:text-[#ededed] text-sm"
          >
            <option value="">Все статусы</option>
            <option value="DRAFT">Черновики</option>
            <option value="PUBLISHED">Опубликованные</option>
            <option value="ARCHIVED">Архивные</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#171717] dark:text-[#ededed] mb-1">
            Сортировка
          </label>
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split("-");
              setSortBy(field);
              setSortOrder(order as "asc" | "desc");
            }}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-[#171717] dark:text-[#ededed] text-sm"
          >
            <option value="createdAt-desc">Дата создания (новые)</option>
            <option value="createdAt-asc">Дата создания (старые)</option>
            <option value="updatedAt-desc">Дата обновления (новые)</option>
            <option value="title-asc">Заголовок (А-Я)</option>
            <option value="viewCount-desc">Просмотры (больше)</option>
          </select>
        </div>
      </div>

      {/* Массовые действия */}
      {selectedArticles.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg">
          <span className="text-sm text-blue-700 dark:text-blue-300">
            Выбрано статей: {selectedArticles.length}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => handleBulkAction("publish")}
              className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Опубликовать
            </button>
            <button
              onClick={() => handleBulkAction("archive")}
              className="px-3 py-1 text-sm bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
            >
              Архивировать
            </button>
            <button
              onClick={() => handleBulkAction("delete")}
              className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Удалить
            </button>
          </div>
        </div>
      )}

      {/* Таблица статей */}
      <div className="bg-white dark:bg-[#0a0a0a] rounded-lg border border-[#171717]/5 dark:border-[#ededed]/10 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="text-[#171717]/60 dark:text-[#ededed]/60">Загрузка статей...</div>
          </div>
        ) : articles.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-[#171717]/60 dark:text-[#ededed]/60 mb-2">Статьи не найдены</div>
            <Link
              href="/admin/articles/new"
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              Создать первую статью
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="w-12 px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedArticles.length === articles.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedArticles(articles.map(a => a.id));
                        } else {
                          setSelectedArticles([]);
                        }
                      }}
                      className="rounded border-gray-300 dark:border-gray-600"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-[#171717] dark:text-[#ededed]">
                    Статья
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-[#171717] dark:text-[#ededed]">
                    Статус
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-[#171717] dark:text-[#ededed]">
                    Автор
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-[#171717] dark:text-[#ededed]">
                    Статистика
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-[#171717] dark:text-[#ededed]">
                    Дата
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-[#171717] dark:text-[#ededed]">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {articles.map((article) => (
                  <tr key={article.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedArticles.includes(article.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedArticles([...selectedArticles, article.id]);
                          } else {
                            setSelectedArticles(selectedArticles.filter(id => id !== article.id));
                          }
                        }}
                        className="rounded border-gray-300 dark:border-gray-600"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-1">
                        <Link
                          href={`/admin/articles/${article.id}`}
                          className="font-medium text-[#171717] dark:text-[#ededed] hover:text-blue-600 dark:hover:text-blue-400"
                        >
                          {article.title}
                        </Link>
                        <div className="flex items-center gap-2">
                          {getCategoryBadge(article.category)}
                          <span className="text-xs text-[#171717]/60 dark:text-[#ededed]/60">
                            /{article.slug}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {getStatusBadge(article.status)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-[#171717] dark:text-[#ededed]">
                        {article.author.name}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-1 text-xs text-[#171717]/60 dark:text-[#ededed]/60">
                        <span>👀 {article.viewCount} просмотров</span>
                        <span>💬 {article._count.comments} комментариев</span>
                        <span>👍 {article.likeCount} лайков</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-1 text-xs text-[#171717]/60 dark:text-[#ededed]/60">
                        <span>Создано: {new Date(article.createdAt).toLocaleDateString()}</span>
                        <span>Обновлено: {new Date(article.updatedAt).toLocaleDateString()}</span>
                        {article.publishedAt && (
                          <span>Опубликовано: {new Date(article.publishedAt).toLocaleDateString()}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/admin/articles/${article.id}`}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 transition-colors"
                          title="Редактировать"
                        >
                          ✏️
                        </Link>
                        <Link
                          href={`/${article.slug}`}
                          target="_blank"
                          className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-900/30 dark:text-gray-300 dark:hover:bg-gray-900/50 transition-colors"
                          title="Просмотреть"
                        >
                          👁️
                        </Link>
                        <select
                          value={article.status}
                          onChange={(e) => handleStatusChange(article.id, e.target.value)}
                          className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-[#171717] dark:text-[#ededed]"
                        >
                          <option value="DRAFT">Черновик</option>
                          <option value="PUBLISHED">Опубликовано</option>
                          <option value="ARCHIVED">Архив</option>
                        </select>
                        <button
                          onClick={() => handleDeleteArticle(article.id)}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50 transition-colors"
                          title="Удалить"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Пагинация */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-[#171717]/60 dark:text-[#ededed]/60">
            Страница {currentPage} из {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-[#171717] dark:text-[#ededed] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Предыдущая
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-[#171717] dark:text-[#ededed] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Следующая
            </button>
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
