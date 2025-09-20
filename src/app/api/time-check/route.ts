import { NextRequest, NextResponse } from "next/server";
import { getSystemTime } from "@/lib/system-time";
import { getShiftTypeByTime } from "@/lib/time-utils";

/**
 * API для проверки времени на платформе
 * Упрощенная версия для диагностики системного времени
 */
export async function GET(request: NextRequest) {
  try {
    const systemTime = getSystemTime();
    const hour = systemTime.getHours();
    const minute = systemTime.getMinutes();
    
    // Определяем текущую смену
    const currentShift = getShiftTypeByTime(systemTime);
    
    // Информация о временной зоне сервера
    const timezoneInfo = {
      serverTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      serverOffset: systemTime.getTimezoneOffset(),
      moscowTime: systemTime.toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' }),
      utcTime: systemTime.toISOString()
    };
    
    return NextResponse.json({
      status: 'OK',
      systemTime: systemTime.toISOString(),
      serverTime: systemTime.toISOString(), // Для обратной совместимости
      currentHour: hour,
      currentMinute: minute,
      timeDisplay: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
      currentShift: currentShift,
      shiftSchedule: {
        MORNING: '06:00 - 14:00',
        DAY: '14:00 - 22:00', 
        NIGHT: '22:00 - 06:00'
      },
      timezoneInfo,
      debug: {
        nodeEnv: process.env.NODE_ENV,
        platform: process.platform,
        timezone: process.env.TZ || 'system_default',
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
