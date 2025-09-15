import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Валидация данных
    if (!data.templateId) {
      return NextResponse.json(
        { error: "Шаблон отчета обязателен" },
        { status: 400 }
      );
    }

    // Валидация периода для кастомных дат
    if (data.period === 'custom') {
      if (!data.dateFrom || !data.dateTo) {
        return NextResponse.json(
          { error: "Для произвольного периода укажите даты начала и окончания" },
          { status: 400 }
        );
      }
      
      const fromDate = new Date(data.dateFrom);
      const toDate = new Date(data.dateTo);
      
      if (fromDate >= toDate) {
        return NextResponse.json(
          { error: "Дата начала должна быть раньше даты окончания" },
          { status: 400 }
        );
      }
    }

    // Имитация постановки отчета в очередь на генерацию
    const reportId = Date.now().toString();
    
    // В реальном проекте здесь будет:
    // 1. Сохранение задачи в очередь (Redis Queue, Bull, etc.)
    // 2. Запуск фонового процесса генерации
    // 3. Создание записи в БД со статусом "generating"
    
    const reportRequest = {
      id: reportId,
      templateId: data.templateId,
      period: data.period,
      dateFrom: data.dateFrom,
      dateTo: data.dateTo,
      format: data.format || 'excel',
      includeCharts: data.includeCharts || false,
      groupBy: data.groupBy || 'project',
      projects: data.projects || [],
      status: 'generating',
      createdAt: new Date(),
      estimatedCompletionTime: new Date(Date.now() + 5 * 60 * 1000) // +5 минут
    };

    // Имитация времени генерации в зависимости от сложности
    let estimatedMinutes = 2;
    
    switch (data.format) {
      case 'pdf':
        estimatedMinutes += 2;
        break;
      case 'excel':
        estimatedMinutes += 1;
        break;
    }
    
    if (data.includeCharts) {
      estimatedMinutes += 3;
    }
    
    if (data.period === 'custom') {
      const fromDate = new Date(data.dateFrom);
      const toDate = new Date(data.dateTo);
      const daysDiff = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff > 30) {
        estimatedMinutes += Math.floor(daysDiff / 10);
      }
    }

    return NextResponse.json(
      { 
        reportRequest,
        message: "Отчет поставлен в очередь на генерацию",
        estimatedMinutes,
        checkStatusUrl: `/api/buyer/reports/${reportId}/status`
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error generating report:", error);
    return NextResponse.json(
      { error: "Ошибка постановки отчета в очередь" },
      { status: 500 }
    );
  }
}

