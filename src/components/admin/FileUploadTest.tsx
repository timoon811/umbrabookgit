"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { useToast } from '@/components/Toast';
import FileUploader from './FileUploader';

export default function FileUploadTest() {
  const { showSuccess, showError } = useToast();
  const [uploadedFiles, setUploadedFiles] = useState<Array<{
    name: string;
    url: string;
    type: string;
    timestamp: string;
  }>>([]);

  const handleFileUpload = (fileUrl: string, fileName: string, fileType: string) => {
    setUploadedFiles(prev => [{
      name: fileName,
      url: fileUrl,
      type: fileType,
      timestamp: new Date().toLocaleString('ru-RU')
    }, ...prev]);
    
    showSuccess('Файл загружен', `${fileName} успешно загружен`);
  };

  const testImageLoad = (url: string) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => reject(false);
      img.src = url;
    });
  };

  const checkFileAccess = async (url: string) => {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      return false;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-[#171717]/5 dark:border-[#ededed]/10 p-6">
        <h3 className="text-lg font-semibold text-[#171717] dark:text-[#ededed] mb-4">
          Тест загрузки файлов
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-[#171717] dark:text-[#ededed] mb-3">
              Загрузка изображений
            </h4>
            <FileUploader
              type="image"
              accept="image/*"
              onUpload={handleFileUpload}
              className="mb-4"
            />
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-[#171717] dark:text-[#ededed] mb-3">
              Загрузка файлов
            </h4>
            <FileUploader
              type="file"
              accept="*/*"
              onUpload={handleFileUpload}
              className="mb-4"
            />
          </div>
        </div>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-[#171717]/5 dark:border-[#ededed]/10 p-6">
          <h3 className="text-lg font-semibold text-[#171717] dark:text-[#ededed] mb-4">
            Загруженные файлы ({uploadedFiles.length})
          </h3>
          
          <div className="space-y-4">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="border border-[#171717]/10 dark:border-[#ededed]/10 rounded-lg p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-[#171717] dark:text-[#ededed]">
                        {file.name}
                      </span>
                      <span className="text-xs px-2 py-1 rounded bg-[#171717]/5 dark:bg-[#ededed]/10 text-[#171717]/60 dark:text-[#ededed]/60">
                        {file.type}
                      </span>
                    </div>
                    <div className="text-xs text-[#171717]/60 dark:text-[#ededed]/60 mb-2">
                      Загружен: {file.timestamp}
                    </div>
                    <div className="text-xs font-mono text-[#171717]/80 dark:text-[#ededed]/80 bg-[#171717]/5 dark:bg-[#ededed]/5 rounded p-2 break-all">
                      {file.url}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        const accessible = await checkFileAccess(file.url);
                        if (accessible) {
                          showSuccess('Доступ есть', 'Файл доступен по HTTP');
                        } else {
                          showError('Нет доступа', 'Файл недоступен по HTTP');
                        }
                      }}
                      className="text-xs px-3 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50"
                    >
                      Проверить доступ
                    </button>
                    
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs px-3 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50"
                    >
                      Открыть
                    </a>
                  </div>
                </div>
                
                {file.type.startsWith('image/') && (
                  <div className="mt-4">
                    <div className="text-xs text-[#171717]/60 dark:text-[#ededed]/60 mb-2">
                      Предварительный просмотр:
                    </div>
                    <Image
                      src={file.url}
                      alt={file.name}
                      width={200}
                      height={192}
                      className="max-w-full h-auto max-h-48 rounded border border-[#171717]/10 dark:border-[#ededed]/10"
                      onLoad={() => {
                        console.log('Изображение загружено успешно:', file.url);
                      }}
                      onError={() => {
                        console.error('Ошибка загрузки изображения:', file.url);
                        showError('Ошибка изображения', 'Не удалось загрузить изображение');
                      }}
                      unoptimized={true}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
