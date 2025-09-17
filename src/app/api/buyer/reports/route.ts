import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from '@/lib/api-auth';

interface GeneratedReport {
  id: string;
  name: string;
  type: string;
  period: string;
  generatedAt: Date;
  status: 'generating' | 'ready' | 'error';
  fileSize: string;
  downloadUrl?: string;
}

export async function GET(request: NextRequest) {
  try {
  

    const authResult = await requireAuth(request);
  
    if ('error' in authResult) {
    return authResult.error;
  }
  
  const { user } = authResult;


    // Имитация данных сгенерированных отчетов
    const mockReports: GeneratedReport[] = [
      {
        id: "1",
        name: "Месячный отчет по производительности",
        type: "Производительность",
        period: "Сентябрь 2025",
        generatedAt: new Date("2025-09-15T10:30:00"),
        status: "ready",
        fileSize: "2.4 MB",
        downloadUrl: "/downloads/monthly_performance_sep2025.xlsx"
      },
      {
        id: "2", 
        name: "Финансовый отчет за неделю",
        type: "Финансовый",
        period: "9-15 сент 2025",
        generatedAt: new Date("2025-09-15T14:20:00"),
        status: "ready",
        fileSize: "1.8 MB",
        downloadUrl: "/downloads/weekly_financial_sep2025.xlsx"
      },
      {
        id: "3",
        name: "Расчет бонусов за период",
        type: "Бонусы",
        period: "1-15 сент 2025",
        generatedAt: new Date("2025-09-15T16:45:00"),
        status: "generating",
        fileSize: "-"
      },
      {
        id: "4",
        name: "Сравнение проектов",
        type: "Аналитика",
        period: "Август 2025",
        generatedAt: new Date("2025-09-13T09:15:00"),
        status: "ready",
        fileSize: "3.1 MB",
        downloadUrl: "/downloads/project_comparison_aug2025.pdf"
      },
      {
        id: "5",
        name: "Детальный отчет по ROAS",
        type: "Производительность", 
        period: "1-10 сент 2025",
        generatedAt: new Date("2025-09-12T18:30:00"),
        status: "error",
        fileSize: "-"
      }
    ];

    // Применение фильтров
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const type = url.searchParams.get('type');
    const limit = parseInt(url.searchParams.get('limit') || '10');

    let filteredReports = [...mockReports];

    // Фильтр по статусу
    if (status && status !== 'all') {
      filteredReports = filteredReports.filter(report => report.status === status);
    }

    // Фильтр по типу
    if (type && type !== 'all') {
      filteredReports = filteredReports.filter(report => report.type === type);
    }

    // Сортировка по дате (новые первыми)
    filteredReports.sort((a, b) => 
      new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
    );

    // Лимит результатов
    if (limit > 0) {
      filteredReports = filteredReports.slice(0, limit);
    }

    return NextResponse.json({
      reports: filteredReports,
      total: filteredReports.length,
      summary: {
        ready: mockReports.filter(r => r.status === 'ready').length,
        generating: mockReports.filter(r => r.status === 'generating').length,
        error: mockReports.filter(r => r.status === 'error').length,
        totalSize: mockReports
          .filter(r => r.status === 'ready')
          .reduce((total, r) => total + parseFloat(r.fileSize.replace(' MB', '')), 0)
          .toFixed(1) + ' MB'
      }
    });
  } catch (error) {
    console.error("Error fetching reports:", error);
    return NextResponse.json(
      { error: "Ошибка загрузки отчетов" },
      { status: 500 }
    );
  }
}

