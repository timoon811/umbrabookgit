"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface CourseFormData {
  title: string;
  description: string;
  slug: string;
  category: string;
  isPublished: boolean;
}

export default function NewCoursePage() {
  const router = useRouter();
  const [formData, setFormData] = useState<CourseFormData>({
    title: "",
    description: "",
    slug: "",
    category: "general",
    isPublished: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: generateSlug(title)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/courses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const course = await response.json();
        router.push(`/admin/courses/${course.id}`);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Ошибка при создании курса");
      }
    } catch (error) {
      setError("Ошибка сети");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#171717] dark:text-[#ededed]">
            Создать новый курс
          </h1>
          <p className="text-[#171717]/60 dark:text-[#ededed]/60 mt-2">
            Заполните информацию о новом курсе
          </p>
        </div>
        <Link
          href="/admin/courses"
          className="px-4 py-2 text-sm font-medium text-[#171717] dark:text-[#ededed] bg-[#171717]/5 dark:bg-[#ededed]/10 rounded-lg hover:bg-[#171717]/10 dark:hover:bg-[#ededed]/20 transition-colors"
        >
          ← Назад к курсам
        </Link>
      </div>

      {/* Форма создания курса */}
      <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-[#171717]/5 dark:border-[#ededed]/10 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Название курса */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-[#171717] dark:text-[#ededed] mb-2">
              Название курса *
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Введите название курса"
              className="w-full px-4 py-3 border border-[#171717]/10 dark:border-[#ededed]/10 rounded-lg bg-transparent text-[#171717] dark:text-[#ededed] placeholder-[#171717]/40 dark:placeholder-[#ededed]/40 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              required
            />
          </div>

          {/* Описание курса */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-[#171717] dark:text-[#ededed] mb-2">
              Описание курса
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Введите описание курса"
              rows={4}
              className="w-full px-4 py-3 border border-[#171717]/10 dark:border-[#ededed]/10 rounded-lg bg-transparent text-[#171717] dark:text-[#ededed] placeholder-[#171717]/40 dark:placeholder-[#ededed]/40 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent resize-vertical"
            />
          </div>

          {/* Slug курса */}
          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-[#171717] dark:text-[#ededed] mb-2">
              URL курса (slug) *
            </label>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-[#171717]/60 dark:text-[#ededed]/60">
                /courses/
              </span>
              <input
                type="text"
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                placeholder="url-kursa"
                className="flex-1 px-4 py-3 border border-[#171717]/10 dark:border-[#ededed]/10 rounded-lg bg-transparent text-[#171717] dark:text-[#ededed] placeholder-[#171717]/40 dark:placeholder-[#ededed]/40 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                required
              />
            </div>
            <p className="text-xs text-[#171717]/60 dark:text-[#ededed]/60 mt-1">
              URL будет автоматически сгенерирован из названия, но вы можете изменить его вручную
            </p>
          </div>

          {/* Категория курса */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-[#171717] dark:text-[#ededed] mb-2">
              Категория курса
            </label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-4 py-3 border border-[#171717]/10 dark:border-[#ededed]/10 rounded-lg bg-transparent text-[#171717] dark:text-[#ededed] focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
            >
              <option value="general">Общие</option>
              <option value="beginner">Для начинающих</option>
              <option value="intermediate">Средний уровень</option>
              <option value="advanced">Продвинутый уровень</option>
              <option value="certification">Сертификация</option>
              <option value="api">API и интеграции</option>
              <option value="security">Безопасность</option>
              <option value="analytics">Аналитика и отчеты</option>
            </select>
          </div>

          {/* Статус публикации */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="isPublished"
              checked={formData.isPublished}
              onChange={(e) => setFormData(prev => ({ ...prev, isPublished: e.target.checked }))}
              className="w-4 h-4 text-gray-600 bg-transparent border-[#171717]/20 dark:border-[#ededed]/20 rounded focus:ring-gray-500 focus:ring-2"
            />
            <label htmlFor="isPublished" className="text-sm font-medium text-[#171717] dark:text-[#ededed]">
              Опубликовать курс сразу
            </label>
          </div>

          {/* Ошибка */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-red-800 dark:text-red-200">{error}</span>
              </div>
            </div>
          )}

          {/* Кнопки действий */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-[#171717]/10 dark:border-[#ededed]/10">
            <Link
              href="/admin/courses"
              className="px-6 py-3 text-sm font-medium text-[#171717] dark:text-[#ededed] bg-[#171717]/5 dark:bg-[#ededed]/10 rounded-lg hover:bg-[#171717]/10 dark:hover:bg-[#ededed]/20 transition-colors"
            >
              Отмена
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 rounded-lg transition-colors flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Создание...</span>
                </>
              ) : (
                <span>Создать курс</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


