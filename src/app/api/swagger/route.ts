import { NextRequest, NextResponse } from 'next/server';
import { swaggerSpec } from '@/lib/swagger';
import { requireAuth } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  // Проверяем авторизацию - swagger документация требует авторизации
  const authResult = await requireAuth(request);
  if ('error' in authResult) {
    return authResult.error;
  }

  return NextResponse.json(swaggerSpec);
}
