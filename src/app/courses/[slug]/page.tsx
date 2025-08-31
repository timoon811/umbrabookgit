"use client";

import { useState, useEffect } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import DocumentationRenderer from "@/components/docs/DocumentationRenderer";

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
    <article className="max-w-none">
      {/* Хлебные крошки */}
      <nav className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-8">
        <Link href="/courses" className="hover:text-gray-900 dark:hover:text-gray-200 transition-colors">
          Курсы
        </Link>
        <span>/</span>
        <span className="text-gray-700 dark:text-gray-300">{course.title}</span>
      </nav>

      {/* Заголовок курса */}
      <header className="mb-12">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(course.category)}`}>
              {getCategoryLabel(course.category)}
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">
              {new Date(course.createdAt).getFullYear()}
            </span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
            {course.title}
          </h1>
          {course.description && (
            <p className="text-xl lg:text-2xl text-gray-600 dark:text-gray-300 leading-relaxed">
              {course.description}
            </p>
          )}
        </div>
      </header>

      {/* Содержимое курса */}
      <div id="course-content">
        {course.content ? (
          <DocumentationRenderer content={course.content} />
        ) : (
          <div className="text-center py-16">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Содержимое скоро будет добавлено</h3>
            <p className="text-gray-600 dark:text-gray-400">Материалы курса находятся в разработке</p>
          </div>
        )}
      </div>
    </article>
  );
}