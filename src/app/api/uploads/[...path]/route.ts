import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const pathArray = params.path;
    const filename = pathArray[pathArray.length - 1];
    const directory = pathArray.slice(0, -1).join('/');
    
    // Определяем полный путь к файлу
    const isProduction = process.env.NODE_ENV === 'production';
    let fullPath: string;
    
    if (isProduction) {
      // В production на Render используем абсолютный путь
      fullPath = join('/uploads', directory, filename);
    } else {
      // В development используем public папку
      fullPath = join(process.cwd(), 'public/uploads', directory, filename);
    }
    
    console.log('Attempting to serve file:', fullPath);

    // Проверяем существование файла
    if (!existsSync(fullPath)) {
      return NextResponse.json(
        { error: 'Файл не найден' },
        { status: 404 }
      );
    }

    // Читаем файл
    const file = await readFile(fullPath);
    
    // Определяем MIME тип по расширению
    const ext = filename.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'svg': 'image/svg+xml',
      'pdf': 'application/pdf',
      'txt': 'text/plain',
      'json': 'application/json',
      'csv': 'text/csv',
      'mp4': 'video/mp4',
      'webm': 'video/webm',
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
    };

    const contentType = mimeTypes[ext || ''] || 'application/octet-stream';

    // Возвращаем файл с правильными заголовками
    return new NextResponse(file, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Disposition': `inline; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error('Ошибка получения файла:', error);
    return NextResponse.json(
      { error: 'Ошибка сервера' },
      { status: 500 }
    );
  }
}
