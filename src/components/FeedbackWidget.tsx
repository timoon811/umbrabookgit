"use client";

import { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, MessageSquare, Send } from 'lucide-react';

interface FeedbackWidgetProps {
  pageId: string;
  pageTitle: string;
}

export default function FeedbackWidget({ pageId, pageTitle }: FeedbackWidgetProps) {
  const [isClient, setIsClient] = useState(false);

  // Проверяем, что мы на клиенте
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Показываем заглушку до загрузки клиента
  if (!isClient) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-8">
        <div className="text-center">
          <div className="w-8 h-8 mx-auto mb-4 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
          <p className="text-gray-500 dark:text-gray-400">Загрузка виджета...</p>
        </div>
      </div>
    );
  }

  // Простой виджет без сложной логики
  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-8">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Была ли эта страница полезной?
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Помогите нам улучшить документацию, оставив свой отзыв
        </p>
      </div>

      {/* Кнопки фидбека */}
      <div className="flex justify-center gap-4 mb-6">
        <button
          className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-2 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
        >
          <ThumbsUp className="w-5 h-5" />
          Да, полезно
        </button>
        
        <button
          className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-2 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
        >
          <ThumbsDown className="w-5 h-5" />
          Нет, не полезно
        </button>
      </div>

      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
        Функция отзывов скоро будет доступна
      </div>
    </div>
  );
}
