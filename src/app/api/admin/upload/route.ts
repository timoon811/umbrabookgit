import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { prisma } from '@/lib/prisma';

// Разрешенные типы файлов
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
const ALLOWED_FILE_TYPES = [
  // Изображения
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  // Документы
  'application/pdf', 'text/plain', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  // Архивы
  'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed',
  // Аудио/Видео
  'audio/mpeg', 'audio/wav', 'video/mp4', 'video/webm',
  // Другие
  'application/json', 'text/csv'
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

import { requireAdmin } from "@/lib/auth";
import { requireAdminAuth } from '@/lib/api-auth';

function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

function sanitizeFilename(filename: string): string {
  // Удаляем опасные символы и заменяем на безопасные
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .slice(0, 100); // Ограничиваем длину имени файла
}

export async function POST(request: NextRequest) {
  try {
  

    const authResult = await requireAdminAuth(request);
  
    if ('error' in authResult) {
    return authResult.error;
  }
  
  const { user } = authResult;


    // Проверяем права администратора
    await checkAdminAuth(request);

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // 'image' или 'file'

    if (!file) {
      return NextResponse.json(
        { error: 'Файл не найден' },
        { status: 400 }
      );
    }

    // Проверяем размер файла
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Файл слишком большой. Максимальный размер: 10MB' },
        { status: 400 }
      );
    }

    // Проверяем тип файла
    const allowedTypes = type === 'image' ? ALLOWED_IMAGE_TYPES : ALLOWED_FILE_TYPES;
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Неподдерживаемый тип файла' },
        { status: 400 }
      );
    }

    // Создаем безопасное имя файла
    const timestamp = Date.now();
    const extension = getFileExtension(file.name);
    const sanitizedName = sanitizeFilename(file.name.replace(/\.[^/.]+$/, ""));
    const filename = `${timestamp}_${sanitizedName}.${extension}`;

    // Определяем папку для загрузки
    const uploadDir = type === 'image' ? 'uploads/images' : 'uploads/files';
    
    // В production на Render, используем абсолютный путь /uploads
    const isProduction = process.env.NODE_ENV === 'production';
    const uploadsPath = isProduction 
      ? join('/uploads', uploadDir.replace('uploads/', ''))
      : join(process.cwd(), 'public', uploadDir);
    
    // Создаем директорию если она не существует
    try {
      await mkdir(uploadsPath, { recursive: true });
    } catch (error) {
      // Директория уже существует
    }

    // Сохраняем файл
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filePath = join(uploadsPath, filename);
    
    await writeFile(filePath, buffer);

    // Возвращаем информацию о файле
    const fileUrl = `/${uploadDir}/${filename}`;
    
    return NextResponse.json({
      success: true,
      file: {
        name: file.name,
        size: file.size,
        type: file.type,
        url: fileUrl,
        filename: filename
      }
    });

  } catch (error: any) {
    console.error('Ошибка загрузки файла:', error);
    
    // Обрабатываем ошибки аутентификации
    if (error.message === "Не авторизован") {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      );
    }
    
    if (error.message === "Недостаточно прав") {
      return NextResponse.json(
        { error: 'Недостаточно прав' },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Ошибка сервера при загрузке файла' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdminAuth(request);
    
    if ('error' in authResult) {
      return authResult.error;
    }
    
    const { user } = authResult;

    return NextResponse.json(
      { error: 'Method not allowed' },
      { status: 405 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
