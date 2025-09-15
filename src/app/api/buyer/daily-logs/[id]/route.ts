import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    const logId = params.id;
    
    // Валидация данных
    if (!data.projectId || !data.date) {
      return NextResponse.json(
        { error: "Проект и дата обязательны" },
        { status: 400 }
      );
    }

    // Проверяем, что дневник можно редактировать (не LOCKED)
    // В реальном проекте здесь проверка из БД
    
    // Расчет итоговых значений
    const totalDeposits = (data.ftdAmount || 0) + (data.redAmount || 0);
    const totalCount = (data.ftdCount || 0) + (data.redCount || 0);
    const averageCheck = totalCount > 0 ? totalDeposits / totalCount : 0;

    // Имитация обновления дневника
    const updatedLog = {
      id: logId,
      buyerId: "buyer1",
      projectId: data.projectId,
      date: new Date(data.date),
      spend: data.spend || 0,
      ftdCount: data.ftdCount || 0,
      ftdAmount: data.ftdAmount || 0,
      redCount: data.redCount || 0,
      redAmount: data.redAmount || 0,
      totalDeposits: totalDeposits,
      averageCheck: averageCheck,
      registrations: data.registrations || 0,
      clicks: data.clicks || 0,
      notes: data.notes || '',
      status: "DRAFT", // Возвращаем в черновик при редактировании
      updatedAt: new Date()
    };

    return NextResponse.json(
      { log: updatedLog, message: "Дневник обновлен успешно" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating daily log:", error);
    return NextResponse.json(
      { error: "Ошибка обновления дневника" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const logId = params.id;
    
    // Проверяем, что дневник можно удалить (только DRAFT)
    // В реальном проекте здесь проверка из БД
    
    return NextResponse.json(
      { message: "Дневник удален успешно" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting daily log:", error);
    return NextResponse.json(
      { error: "Ошибка удаления дневника" },
      { status: 500 }
    );
  }
}

