"use client";

import React from 'react';
import FileUploadTest from '@/components/admin/FileUploadTest';

export default function UploadsTestPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#171717] dark:text-[#ededed]">
            Тестирование загрузки файлов
          </h1>
          <p className="text-[#171717]/60 dark:text-[#ededed]/60 mt-2">
            Проверка корректности работы системы загрузки и отображения файлов
          </p>
        </div>
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="text-yellow-600 dark:text-yellow-400">⚠️</div>
          <div>
            <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">
              Тестовая страница
            </h3>
            <p className="text-xs text-yellow-700 dark:text-yellow-300">
              Эта страница предназначена для тестирования функциональности загрузки файлов. 
              Загруженные здесь файлы будут сохранены в системе.
            </p>
          </div>
        </div>
      </div>

      <FileUploadTest />

      <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-[#171717]/5 dark:border-[#ededed]/10 p-6">
        <h3 className="text-lg font-semibold text-[#171717] dark:text-[#ededed] mb-4">
          Информация о системе
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-[#171717] dark:text-[#ededed] mb-3">
              Настройки загрузки
            </h4>
            <div className="space-y-2 text-xs text-[#171717]/60 dark:text-[#ededed]/60">
              <div>• Максимальный размер файла: 10 MB</div>
              <div>• Поддерживаемые форматы изображений: JPEG, PNG, GIF, WebP, SVG</div>
              <div>• Поддерживаемые форматы файлов: PDF, TXT, DOC, XLS, ZIP, MP3, MP4</div>
              <div>• Папка загрузки: /uploads/images или /uploads/files</div>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-[#171717] dark:text-[#ededed] mb-3">
              Диагностика
            </h4>
            <div className="space-y-2 text-xs text-[#171717]/60 dark:text-[#ededed]/60">
              <div>• Среда: {process.env.NODE_ENV || 'development'}</div>
              <div>• User Agent: {typeof window !== 'undefined' ? navigator.userAgent.slice(0, 50) + '...' : 'SSR'}</div>
              <div>• Текущий домен: {typeof window !== 'undefined' ? window.location.origin : 'SSR'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
