"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Course {
  id: string;
  title: string;
  description: string;
  slug: string;
  isPublished: boolean;
  category: string;
  createdAt: string;
  updatedAt: string;
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');

  useEffect(() => {
    fetchCourses();
  }, [filter]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const url = filter === 'all' 
        ? '/api/admin/courses' 
        : `/api/admin/courses?status=${filter}`;
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setCourses(data.courses || []);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Ошибка загрузки курсов');
      }
    } catch (error) {
      setError('Ошибка сети');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async (courseId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/courses/${courseId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isPublished: !currentStatus }),
      });

      if (response.ok) {
        // Обновляем локальное состояние
        setCourses(prev => prev.map(course => 
          course.id === courseId 
            ? { ...course, isPublished: !currentStatus }
            : course
        ));
      }
    } catch (error) {
      console.error('Ошибка при изменении статуса:', error);
    }
  };

  const handleDelete = async (courseId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот курс? Это действие необратимо.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/courses/${courseId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setCourses(prev => prev.filter(course => course.id !== courseId));
      }
    } catch (error) {
      console.error('Ошибка при удалении курса:', error);
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      'general': 'Общие',
      'beginner': 'Для начинающих',
      'intermediate': 'Средний уровень',
      'advanced': 'Продвинутый уровень',
      'certification': 'Сертификация',
      'api': 'API и интеграции',
      'security': 'Безопасность',
      'analytics': 'Аналитика и отчеты',
    };
    return labels[category] || category;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'general': 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
      'beginner': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      'intermediate': 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
      'advanced': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      'certification': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      'api': 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
      'security': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      'analytics': 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400',
    };
    return colors[category] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-500"></div>
      </div>
    );
  }

  if (error) {
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
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#171717] dark:text-[#ededed]">
            Управление курсами
          </h1>
          <p className="text-[#171717]/60 dark:text-[#ededed]/60 mt-2">
            Создавайте, редактируйте и управляйте курсами обучения
          </p>
        </div>
        <Link
          href="/admin/courses/new"
          className="px-6 py-3 text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Создать курс</span>
        </Link>
      </div>

      {/* Фильтры */}
      <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-[#171717]/5 dark:border-[#ededed]/10 p-4">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-[#171717] dark:text-[#ededed]">Фильтр:</span>
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                filter === 'all'
                  ? 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                  : 'bg-[#171717]/5 dark:bg-[#ededed]/10 text-[#171717] dark:text-[#ededed] hover:bg-[#171717]/10 dark:hover:bg-[#ededed]/20'
              }`}
            >
              Все курсы ({courses.length})
            </button>
            <button
              onClick={() => setFilter('published')}
              className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                filter === 'published'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-[#171717]/5 dark:bg-[#ededed]/10 text-[#171717] dark:text-[#ededed] hover:bg-[#171717]/10 dark:hover:bg-[#ededed]/20'
              }`}
            >
              Опубликованные ({courses.filter(c => c.isPublished).length})
            </button>
            <button
              onClick={() => setFilter('draft')}
              className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                filter === 'draft'
                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                  : 'bg-[#171717]/5 dark:bg-[#ededed]/10 text-[#171717] dark:text-[#ededed] hover:bg-[#171717]/10 dark:hover:bg-[#ededed]/20'
              }`}
            >
              Черновики ({courses.filter(c => !c.isPublished).length})
            </button>
          </div>
        </div>
      </div>

      {/* Список курсов */}
      {courses.length === 0 ? (
        <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-[#171717]/5 dark:border-[#ededed]/10 p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-[#171717]/10 dark:bg-[#ededed]/10 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-[#171717]/40 dark:text-[#ededed]/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-[#171717] dark:text-[#ededed] mb-2">
            Курсы не найдены
          </h3>
          <p className="text-[#171717]/60 dark:text-[#ededed]/60 mb-6">
            {filter === 'all' 
              ? 'Создайте первый курс для начала работы'
              : filter === 'published'
              ? 'Нет опубликованных курсов'
              : 'Нет черновиков курсов'
            }
          </p>
          <Link
            href="/admin/courses/new"
            className="px-6 py-3 text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
          >
            Создать курс
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div
              key={course.id}
              className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-[#171717]/5 dark:border-[#ededed]/10 overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Заголовок карточки */}
              <div className="p-6 border-b border-[#171717]/5 dark:border-[#ededed]/10">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-[#171717] dark:text-[#ededed] mb-2 line-clamp-2">
                      {course.title}
                    </h3>
                    <div className="flex items-center space-x-2 mb-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(course.category)}`}>
                        {getCategoryLabel(course.category)}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        course.isPublished
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}>
                        {course.isPublished ? 'Опубликован' : 'Черновик'}
                      </span>
                    </div>
                  </div>
                </div>
                
                {course.description && (
                  <p className="text-[#171717]/60 dark:text-[#ededed]/60 text-sm line-clamp-3">
                    {course.description}
                  </p>
                )}
              </div>

              {/* Информация о курсе */}
              <div className="p-6">
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-xs text-[#171717]/40 dark:text-[#ededed]/40">
                    <span>URL:</span>
                    <span className="font-mono">/courses/{course.slug}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-[#171717]/40 dark:text-[#ededed]/40">
                    <span>Создан:</span>
                    <span>{new Date(course.createdAt).toLocaleDateString('ru-RU')}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-[#171717]/40 dark:text-[#ededed]/40">
                    <span>Обновлен:</span>
                    <span>{new Date(course.updatedAt).toLocaleDateString('ru-RU')}</span>
                  </div>
                </div>

                {/* Действия */}
                <div className="flex items-center justify-between pt-4 border-t border-[#171717]/5 dark:border-[#ededed]/10">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleStatusToggle(course.id, course.isPublished)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                        course.isPublished
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-900/50'
                          : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                      }`}
                    >
                      {course.isPublished ? 'Снять с публикации' : 'Опубликовать'}
                    </button>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Link
                      href={`/admin/courses/${course.id}`}
                      className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/30 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-900/50 transition-colors"
                    >
                      Редактировать
                    </Link>
                    <button
                      onClick={() => handleDelete(course.id)}
                      className="px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
