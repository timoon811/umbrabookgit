"use client";

import { useState, useEffect } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";

interface CoursePage {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  category: string;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
  content?: string | null;
}

interface CoursePageProps {
  params: {
    slug: string;
  };
}

export default function CoursePage({ params }: CoursePageProps) {
  const [course, setCourse] = useState<CoursePage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [slug, setSlug] = useState<string>('');

  useEffect(() => {
    if (params.slug) {
      setSlug(params.slug);
      fetchCourse(params.slug);
    }
  }, [params.slug]);

  const fetchCourse = async (courseSlug: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/courses/${courseSlug}`);
      
      if (response.ok) {
        const data = await response.json();
        setCourse(data.course);
      } else if (response.status === 404) {
        notFound();
      } else {
        setError('Ошибка загрузки курса');
      }
    } catch (error) {
      setError('Ошибка сети');
    } finally {
      setLoading(false);
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

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      'general': '📚',
      'beginner': '🚀',
      'intermediate': '🔧',
      'advanced': '⚡',
      'certification': '🏆',
      'api': '🔗',
      'security': '🔒',
      'analytics': '📊',
    };
    return icons[category] || '📖';
  };

  const getEstimatedTime = (category: string) => {
    switch (category) {
      case 'beginner': return '4-6 часов';
      case 'intermediate': return '6-8 часов';
      case 'advanced': return '8-12 часов';
      case 'certification': return '10-15 часов';
      default: return '4-8 часов';
    }
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
      <div className="prose prose-zinc dark:prose-invert max-w-none">
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

  if (!course) {
    return null;
  }

  return (
    <div className="prose prose-zinc dark:prose-invert max-w-none">
      {/* Хлебные крошки */}
      <nav className="mb-8">
        <ol className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
          <li>
            <Link href="/courses" className="hover:text-gray-600 dark:hover:text-gray-400">
              Курсы
            </Link>
          </li>
          <li>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </li>
          <li className="text-gray-900 dark:text-white font-medium">
            {course.title}
          </li>
        </ol>
      </nav>

      {/* Заголовок курса */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(course.category)}`}>
            {getCategoryLabel(course.category)}
          </span>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">
            {new Date(course.createdAt).getFullYear()}
          </span>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          {course.title}
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-4xl">
          {course.description || 'Описание курса пока не добавлено'}
        </p>
      </div>

      {/* Основная информация о курсе */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* Левая колонка - основное содержимое */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-black/5 dark:border-white/10 p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              О курсе
            </h2>
            <div className="prose prose-gray dark:prose-invert max-w-none">
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {course.description || 'Подробное описание курса будет добавлено в ближайшее время. Этот курс поможет вам освоить ключевые концепции и практические навыки работы с платформой.'}
              </p>
            </div>
          </div>

          {/* Программа курса */}
          <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-black/5 dark:border-white/10 p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Программа курса
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="w-8 h-8 bg-gray-100 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400 rounded-full flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    Введение в платформу
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    Базовые концепции и архитектура Umbra Platform
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="w-8 h-8 bg-gray-100 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400 rounded-full flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    Практические примеры
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    Создание первой интеграции и работа с API
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="w-8 h-8 bg-gray-100 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400 rounded-full flex items-center justify-center text-sm font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    Продвинутые темы
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    Оптимизация и масштабирование решений
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Правая колонка - информация о курсе */}
        <div className="space-y-6">
          {/* Карточка с информацией */}
          <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-black/5 dark:border-white/10 p-6">
            <div className="text-center mb-6">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-gray-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
                <div className="text-white text-3xl">{getCategoryIcon(course.category)}</div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {getCategoryLabel(course.category)}
              </h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Уровень:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {course.category === 'beginner' ? 'Начинающий' : 
                   course.category === 'intermediate' ? 'Средний' : 
                   course.category === 'advanced' ? 'Продвинутый' : 'Любой'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Время:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {getEstimatedTime(course.category)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Дата создания:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {new Date(course.createdAt).toLocaleDateString('ru-RU')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Статус:</span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  course.isPublished 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                }`}>
                  {course.isPublished ? 'Опубликован' : 'Черновик'}
                </span>
              </div>
            </div>
          </div>

          {/* Кнопка начала курса */}
          <div className="bg-gradient-to-r from-gray-600 to-purple-600 rounded-xl p-6 text-center">
            <h3 className="text-white text-lg font-semibold mb-4">
              Готовы начать обучение?
            </h3>
            <button className="w-full bg-white text-gray-600 font-semibold py-3 px-6 rounded-lg hover:bg-gray-100 transition-colors">
              Начать курс
            </button>
            <p className="text-gray-100 text-sm mt-3">
              Доступ к курсу бесплатный
            </p>
          </div>

          {/* Рейтинг */}
          <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-black/5 dark:border-white/10 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
              Рейтинг курса
            </h3>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">4.8</span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              На основе 127 отзывов
            </p>
          </div>
        </div>
      </div>

      {/* Похожие курсы */}
      <div className="bg-gray-50 dark:bg-gray-800/30 rounded-xl p-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Похожие курсы
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-[#0a0a0a] rounded-lg border border-black/5 dark:border-white/10 p-4">
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-900/30 rounded-lg flex items-center justify-center mb-3">
              <span className="text-xl">🔧</span>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              API и интеграции
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
              Изучите работу с API и создание интеграций
            </p>
            <Link href="/courses/api-integration" className="text-gray-600 dark:text-gray-400 text-sm font-medium hover:underline">
              Подробнее →
            </Link>
          </div>
          <div className="bg-white dark:bg-[#0a0a0a] rounded-lg border border-black/5 dark:border-white/10 p-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-3">
              <span className="text-xl">🚀</span>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Быстрый старт
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
              Основы платформы для новичков
            </p>
            <Link href="/courses/quick-start" className="text-gray-600 dark:text-gray-400 text-sm font-medium hover:underline">
              Подробнее →
            </Link>
          </div>
          <div className="bg-white dark:bg-[#0a0a0a] rounded-lg border border-black/5 dark:border-white/10 p-4">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-3">
              <span className="text-xl">📊</span>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Аналитика и отчеты
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
              Создание дашбордов и анализ данных
            </p>
            <Link href="/courses/analytics" className="text-gray-600 dark:text-gray-400 text-sm font-medium hover:underline">
              Подробнее →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
