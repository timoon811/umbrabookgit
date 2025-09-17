import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from '@/lib/api-auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
  const authResult = await requireAuth(request);
  
    if ('error' in authResult) {
    return authResult.error;
  }
  
  const { user } = authResult;


    const logId = (await params).id;
    
    // Проверяем, что дневник существует и в статусе DRAFT
    // В реальном проекте здесь проверка из БД
    
    // Валидация полей (все обязательные поля должны быть заполнены)
    // В реальном проекте получаем дневник из БД и проверяем
    
    // Имитация отправки дневника на проверку
    const updatedLog = {
      id: logId,
      status: "SUBMITTED",
      updatedAt: new Date()
    };

    return NextResponse.json(
      { log: updatedLog, message: "Дневник отправлен на проверку" },
      { status: 200 }
    );
  
  } catch (error) {
    console.error("Error submitting daily log:", error);
    return NextResponse.json(
      { error: "Ошибка отправки дневника" },
      { status: 500 }
    );
  }
}

