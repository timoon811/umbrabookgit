import { NextRequest, NextResponse } from "next/server";
import { getUnifiedTime, validateTimeSync, TimeFormatter } from "@/lib/unified-time";

/**
 * API для проверки синхронизации времени на платформе
 * Помогает диагностировать проблемы с временем
 */
export async function GET(request: NextRequest) {
  try {
    // Получаем унифицированное время
    const unifiedTime = getUnifiedTime();
    
    // Проверяем синхронизацию
    const syncCheck = validateTimeSync();
    
    // Дополнительная информация о временных зонах
    const timezoneInfo = {
      serverTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      serverOffset: new Date().getTimezoneOffset(),
      moscowTime: new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' }),
      frankfurtTime: new Date().toLocaleString('de-DE', { timeZone: 'Europe/Berlin' }),
      utcTime: new Date().toISOString()
    };
    
    // Сравнение времени в разных форматах
    const timeComparison = {
      raw_new_Date: new Date().toISOString(),
      unified_utc: unifiedTime.utc.toISOString(),
      unified_utc3: unifiedTime.utc3.toISOString(),
      unified_moscow: unifiedTime.moscow,
      formatted_for_api: TimeFormatter.forAPI(unifiedTime),
      formatted_for_user: TimeFormatter.forUser(unifiedTime),
      formatted_for_logs: TimeFormatter.forLogs(unifiedTime)
    };
    
    return NextResponse.json({
      status: syncCheck.isValid ? 'OK' : 'WARNING',
      timestamp: unifiedTime.timestamp,
      unifiedTime,
      syncCheck,
      timezoneInfo,
      timeComparison,
      recommendations: syncCheck.recommendations,
      debug: {
        nodeEnv: process.env.NODE_ENV,
        platform: process.platform,
        timezone: process.env.TZ || 'not_set',
        renderRegion: process.env.RENDER_REGION || 'not_render'
      }
    });
    
  } catch (error) {
    console.error('Ошибка проверки времени:', error);
    return NextResponse.json(
      { error: "Ошибка проверки времени", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
