import { NextRequest, NextResponse } from 'next/server';
import { getDocsNav } from '@/lib/docs';
import { requireAuth } from '@/lib/api-auth';

// GET /api/docs/navigation - Получить навигацию документации
export async function GET(request: NextRequest) {
  try {
    // Проверяем авторизацию пользователя
    const authResult = await requireAuth(request);
    
    if ('error' in authResult) {
      return authResult.error;
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    console.log('📋 API /docs/navigation: Запрос навигации для проекта:', projectId);

    // Получаем навигацию для документации
    const nav = await getDocsNav('docs', projectId || undefined);
    
    console.log('📋 API /docs/navigation: Возвращаем навигацию, разделов:', nav.length);

    return NextResponse.json(nav);
  } catch (error) {
    console.error('❌ API /docs/navigation: Ошибка получения навигации:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
