"use client";

import React, { useState, useRef } from 'react';
import { useToast } from '@/components/Toast';
import { formatFileSize, getUploadApiUrl } from '@/lib/file-utils';

interface FileUploaderProps {
  onUpload: (fileUrl: string, fileName: string, fileType: string) => void;
  accept?: string;
  maxSize?: number;
  type?: 'image' | 'file';
  className?: string;
  children?: React.ReactNode;
}

interface UploadedFile {
  name: string;
  size: number;
  type: string;
  url: string;
  filename: string;
}

export default function FileUploader({
  onUpload,
  accept = '*/*',
  maxSize = 10 * 1024 * 1024, // 10MB
  type = 'file',
  className = '',
  children
}: FileUploaderProps) {
  const { showError, showSuccess } = useToast();
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);



  const uploadFile = async (file: File) => {
    if (file.size > maxSize) {
      showError('Файл слишком большой', `Максимальный размер: ${formatFileSize(maxSize)}`);
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const response = await fetch(getUploadApiUrl(), {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Специальная обработка ошибок аутентификации
        if (response.status === 401) {
          throw new Error('Не авторизован. Пожалуйста, войдите в систему.');
        }
        
        if (response.status === 403) {
          throw new Error('Недостаточно прав. Требуются права администратора.');
        }
        
        throw new Error(errorData.error || 'Ошибка загрузки файла');
      }

      const data = await response.json();
      const uploadedFile: UploadedFile = data.file;

      onUpload(uploadedFile.url, uploadedFile.name, uploadedFile.type);
      
      // Очищаем input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error: any) {
      console.error('Ошибка загрузки:', error);
      showError('Ошибка загрузки', error.message || 'Произошла ошибка при загрузке файла');
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  // Если переданы custom children, рендерим их с менеджерами
  if (children) {
    return (
      <div 
        className={className}
        onClick={openFileDialog}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {children}
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />
      </div>
    );
  }

  // Дефолтный UI
  return (
    <div
      className={`relative border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer ${
        dragOver 
          ? 'border-gray-900 bg-gray-50 dark:border-gray-300 dark:bg-gray-700/50' 
          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
      } ${uploading ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      onClick={!uploading ? openFileDialog : undefined}
      onDrop={!uploading ? handleDrop : undefined}
      onDragOver={!uploading ? handleDragOver : undefined}
      onDragLeave={!uploading ? handleDragLeave : undefined}
    >
      <div className="text-center">
        {uploading ? (
          <>
            <div className="w-8 h-8 mx-auto mb-3 border-2 border-gray-300 dark:border-gray-600 border-t-gray-900 dark:border-t-gray-200 rounded-full animate-spin"></div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Загрузка файла...</p>
          </>
        ) : (
          <>
            <div className="text-4xl mb-3">
              {type === 'image' ? '🖼' : '📎'}
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
              {type === 'image' ? 'Загрузить изображение' : 'Загрузить файл'}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Перетащите файл сюда или кликните для выбора
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Максимальный размер: {formatFileSize(maxSize)}
            </p>
          </>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />
    </div>
  );
}
