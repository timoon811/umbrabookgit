"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";
import { useConfirmDialog } from "@/components/ConfirmDialog";
import Link from "next/link";

interface CourseData {
  id: string;
  title: string;
  description: string;
  slug: string;
  category: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CourseFormData {
  title: string;
  description: string;
  slug: string;
  category: string;
  isPublished: boolean;
}

export default function EditCoursePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const { confirmDanger } = useConfirmDialog();
  const [course, setCourse] = useState<CourseData | null>(null);
  const [formData, setFormData] = useState<CourseFormData>({
    title: "",
    description: "",
    slug: "",
    category: "general",
    isPublished: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCourse();
  }, [params.id]);

  const fetchCourse = async () => {
    try {
      const response = await fetch(`/api/admin/courses/${params.id}`);
      if (response.ok) {
        const courseData = await response.json();
        setCourse(courseData);
        setFormData({
          title: courseData.title,
          description: courseData.description || "",
          slug: courseData.slug,
          category: courseData.category || "general",
          isPublished: courseData.isPublished,
        });
      } else {
        setError("Курс не найден");
      }
    } catch (error) {
      setError("Ошибка загрузки курса");
    } finally {
      setLoading(false);
    }
  };

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
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/courses/${params.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updatedCourse = await response.json();
        setCourse(updatedCourse);
        setError(null);
        // Показываем уведомление об успехе
        showSuccess("Курс обновлен", "Изменения успешно сохранены");
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Ошибка при обновлении курса");
      }
    } catch (error) {
      setError("Ошибка сети");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = await confirmDanger(
      "Удалить курс?", 
      "Вы уверены, что хотите удалить этот курс? Это действие необратимо.",
      "Удалить"
    );
    
    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/courses/${params.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/admin/courses");
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Ошибка при удалении курса");
      }
    } catch (error) {
      setError("Ошибка сети");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-500"></div>
      </div>
    );
  }

  if (error && !course) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <div className="flex items-center">
            <svg className="w-6 h-6 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-lg font-medium text-red-800 dark:text-red-200">Ошибка загрузки</h3>
              <p className="text-red-600 dark:text-red-300">{error}</p>
            </div>
          </div>
        </div>
        <Link
          href="/admin/courses"
          className="px-4 py-2 text-sm font-medium text-[#171717] dark:text-[#ededed] bg-[#171717]/5 dark:bg-[#ededed]/10 rounded-lg hover:bg-[#171717]/10 dark:hover:bg-[#ededed]/20 transition-colors"
        >
          ← Назад к курсам
        </Link>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center text-gray-500">Курс не найден</div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#171717] dark:text-[#ededed]">
            Редактировать курс
          </h1>
          <p className="text-[#171717]/60 dark:text-[#ededed]/60 mt-2">
            {course.title}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            href="/admin/courses"
            className="px-4 py-2 text-sm font-medium text-[#171717] dark:text-[#ededed] bg-[#171717]/5 dark:bg-[#ededed]/10 rounded-lg hover:bg-[#171717]/10 dark:hover:bg-[#ededed]/20 transition-colors"
          >
            ← Назад к курсам
          </Link>
          <Link
            href={`/admin/courses/${params.id}/editor`}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
          >
            📝 Редактор
          </Link>
          <button
            onClick={handleDelete}
            className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
          >
            Удалить курс
          </button>
        </div>
      </div>

      {/* Информация о курсе */}
      <div className="bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
        <div className="flex items-center space-x-2 text-sm text-gray-800 dark:text-gray-200">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            Создан: {new Date(course.createdAt).toLocaleDateString('ru-RU')} | 
            Обновлен: {new Date(course.updatedAt).toLocaleDateString('ru-RU')} | 
            ID: {course.id}
          </span>
        </div>
      </div>

      {/* Форма редактирования курса */}
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
              Опубликован
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
              disabled={saving}
              className="px-6 py-3 text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 rounded-lg transition-colors flex items-center space-x-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Сохранение...</span>
                </>
              ) : (
                <span>Сохранить изменения</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


