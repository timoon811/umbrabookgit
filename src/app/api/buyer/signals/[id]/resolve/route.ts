import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const signalId = params.id;
    
    // В реальном проекте здесь будет обновление в БД
    // Проверяем, что сигнал существует и принадлежит текущему пользователю
    
    const resolvedSignal = {
      id: signalId,
      status: "RESOLVED",
      resolvedAt: new Date(),
      resolvedBy: "buyer1", // В реальном проекте из сессии
      updatedAt: new Date()
    };

    return NextResponse.json(
      { signal: resolvedSignal, message: "Сигнал отмечен как решенный" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error resolving signal:", error);
    return NextResponse.json(
      { error: "Ошибка при решении сигнала" },
      { status: 500 }
    );
  }
}

