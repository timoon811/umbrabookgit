import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from '@/lib/api-auth';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: 'performance' | 'financial' | 'bonus' | 'custom';
  category: string;
  fields: string[];
  isDefault: boolean;
}

export async function GET(request: NextRequest) {
  try {
  

    const authResult = await requireAuth(request);
  
    if ('error' in authResult) {
    return authResult.error;
  }
  
  const { user } = authResult;


    // Имитация шаблонов отчетов
    const mockTemplates: ReportTemplate[] = [
      {
        id: "1",
        name: "Ежедневная производительность",
        description: "Отчет по ключевым показателям производительности за день",
        type: "performance",
        category: "Стандартные",
        fields: ["Spend", "Revenue", "ROAS", "Deposits", "FTD Count", "RED Count", "Conversion Rate"],
        isDefault: true
      },
      {
        id: "2", 
        name: "Недельный финансовый сводный",
        description: "Подробная финансовая сводка за неделю с разбивкой по проектам",
        type: "financial",
        category: "Стандартные",
        fields: ["Total Spend", "Total Revenue", "Profit", "ROAS", "Project Breakdown", "Shared Costs", "Net Profit"],
        isDefault: true
      },
      {
        id: "3",
        name: "Месячный расчет бонусов",
        description: "Детальный расчет бонусов по всем активным схемам",
        type: "bonus", 
        category: "Мотивация",
        fields: ["Bonus Schemes", "Calculated Amounts", "Performance Metrics", "Tier Progress", "Payout Schedule"],
        isDefault: true
      },
      {
        id: "4",
        name: "Сравнительный анализ проектов",
        description: "Сравнение эффективности всех проектов за период",
        type: "performance",
        category: "Аналитика",
        fields: ["Project Names", "ROAS Comparison", "Profit Margins", "Conversion Rates", "Growth Trends", "Recommendations"],
        isDefault: false
      },
      {
        id: "5",
        name: "Подробный ROAS анализ",
        description: "Глубокий анализ ROAS с разбивкой по источникам трафика",
        type: "performance",
        category: "Аналитика", 
        fields: ["Traffic Sources", "Daily ROAS", "Campaign Performance", "Geo Performance", "Device Breakdown", "Time Analysis"],
        isDefault: false
      },
      {
        id: "6",
        name: "Общие расходы и аллокации",
        description: "Отчет по общим расходам и их распределению",
        type: "financial",
        category: "Расходы",
        fields: ["Shared Costs", "Allocations", "Cost Per Project", "Usage Statistics", "Optimization Recommendations"],
        isDefault: false
      },
      {
        id: "7",
        name: "Анализ сигналов и алертов",
        description: "Статистика по сигналам, частота возникновения и время решения",
        type: "custom",
        category: "Мониторинг",
        fields: ["Signal Types", "Frequency", "Resolution Time", "Critical Events", "Trends", "Prevention Recommendations"],
        isDefault: false
      },
      {
        id: "8",
        name: "Полный месячный отчет",
        description: "Комплексный отчет включающий все аспекты деятельности за месяц",
        type: "custom",
        category: "Комплексные",
        fields: ["All Performance Metrics", "Financial Summary", "Bonus Calculations", "Project Analysis", "Trend Analysis", "Executive Summary"],
        isDefault: true
      }
    ];

    // Применение фильтров
    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    const category = url.searchParams.get('category');
    const defaultOnly = url.searchParams.get('defaultOnly') === 'true';

    let filteredTemplates = [...mockTemplates];

    // Фильтр по типу
    if (type && type !== 'all') {
      filteredTemplates = filteredTemplates.filter(template => template.type === type);
    }

    // Фильтр по категории
    if (category && category !== 'all') {
      filteredTemplates = filteredTemplates.filter(template => template.category === category);
    }

    // Только шаблоны по умолчанию
    if (defaultOnly) {
      filteredTemplates = filteredTemplates.filter(template => template.isDefault);
    }

    return NextResponse.json({
      templates: filteredTemplates,
      total: filteredTemplates.length,
      categories: [...new Set(mockTemplates.map(t => t.category))],
      types: {
        performance: mockTemplates.filter(t => t.type === 'performance').length,
        financial: mockTemplates.filter(t => t.type === 'financial').length,
        bonus: mockTemplates.filter(t => t.type === 'bonus').length,
        custom: mockTemplates.filter(t => t.type === 'custom').length
      }
    });
  } catch (error) {
    console.error("Error fetching report templates:", error);
    return NextResponse.json(
      { error: "Ошибка загрузки шаблонов отчетов" },
      { status: 500 }
    );
  }
}

