import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const signalId = params.id;
    const { hours } = await request.json();
    
    if (!hours || hours <= 0) {
      return NextResponse.json(
        { error: "Некорректное время отсрочки" },
        { status: 400 }
      );
    }

    // В реальном проекте здесь будет обновление в БД
    const snoozeUntil = new Date();
    snoozeUntil.setHours(snoozeUntil.getHours() + hours);
    
    const snoozedSignal = {
      id: signalId,
      status: "SNOOZED",
      snoozeUntil: snoozeUntil,
      updatedAt: new Date()
    };

    return NextResponse.json(
      { 
        signal: snoozedSignal, 
        message: `Сигнал отложен на ${hours} ч.` 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error snoozing signal:", error);
    return NextResponse.json(
      { error: "Ошибка при откладывании сигнала" },
      { status: 500 }
    );
  }
}

