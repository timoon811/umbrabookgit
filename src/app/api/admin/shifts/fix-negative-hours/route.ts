import { checkAdminAuthUserId } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from '@/lib/api-auth';

// POST /api/admin/shifts/fix-negative-hours - Исправление некорректных записей смен
export async function POST(request: NextRequest) {
  try {
  

    const authResult = await requireAdminAuth(request);
  
    if ('error' in authResult) {
    return authResult.error;
  }
  
  const { user } = authResult;


    await checkAdminAuthUserId();

    console.log("[FIX_NEGATIVE_HOURS] Начинаем исправление некорректных записей смен...");

    // 1. Найти все смены с некорректным временем (используем raw query)
    const corruptedShifts = await prisma.$queryRaw`
      SELECT 
        ps.*,
        u.name as processor_name,
        u.email as processor_email
      FROM processor_shifts ps
      LEFT JOIN users u ON ps."processorId" = u.id
      WHERE ps."actualStart" IS NOT NULL 
        AND ps."actualEnd" IS NOT NULL 
        AND ps."actualEnd" <= ps."actualStart"
    `;

    console.log(`[FIX_NEGATIVE_HOURS] Найдено ${Array.isArray(corruptedShifts) ? corruptedShifts.length : 0} смен с некорректным временем`);

    // 2. Найти смены со статусом ACTIVE но с установленным actualEnd
    const activeWithEndShifts = await prisma.processor_shifts.findMany({
      where: {
        status: 'ACTIVE',
        actualEnd: { not: null }
      },
      include: {
        processor: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    console.log(`[FIX_NEGATIVE_HOURS] Найдено ${activeWithEndShifts.length} активных смен с некорректным actualEnd`);

    // 3. Найти смены с неразумной продолжительностью (более 24 часов)
    const longShifts = await prisma.$queryRaw`
      SELECT * FROM processor_shifts 
      WHERE "actualStart" IS NOT NULL 
        AND "actualEnd" IS NOT NULL 
        AND EXTRACT(EPOCH FROM ("actualEnd" - "actualStart")) / 3600.0 > 24
    `;

    console.log(`[FIX_NEGATIVE_HOURS] Найдено ${Array.isArray(longShifts) ? longShifts.length : 0} смен продолжительностью более 24 часов`);

    const results = {
      corruptedTimeFixed: 0,
      activeStatusFixed: 0,
      longShiftsFound: Array.isArray(longShifts) ? longShifts.length : 0,
      details: []
    };

    // Исправляем смены с некорректным временем
    for (const shift of Array.isArray(corruptedShifts) ? corruptedShifts : []) {
      try {
        console.log(`[FIX_NEGATIVE_HOURS] Исправляем смену ${shift.id} пользователя ${shift.processor_name}`);
        
        // Удаляем actualEnd и меняем статус
        await prisma.processor_shifts.update({
          where: { id: shift.id },
          data: {
            actualEnd: null,
            status: shift.status === 'COMPLETED' ? 'ACTIVE' : shift.status,
            notes: (shift.notes || '') + ' [Исправлено: удален некорректный actualEnd]'
          }
        });
        
        results.corruptedTimeFixed++;
        results.details.push({
          shiftId: shift.id,
          processorName: shift.processor_name,
          issue: 'Некорректное время (конец раньше начала)',
          action: 'Удален actualEnd, статус изменен'
        });
      } catch (error) {
        console.error(`[FIX_NEGATIVE_HOURS] Ошибка исправления смены ${shift.id}:`, error);
        results.details.push({
          shiftId: shift.id,
          processorName: shift.processor_name,
          issue: 'Ошибка исправления',
          action: 'Не удалось исправить'
        });
      }
    }

    // Исправляем активные смены с actualEnd
    for (const shift of activeWithEndShifts) {
      try {
        console.log(`[FIX_NEGATIVE_HOURS] Исправляем активную смену ${shift.id} с actualEnd`);
        
        await prisma.processor_shifts.update({
          where: { id: shift.id },
          data: {
            actualEnd: null,
            notes: (shift.notes || '') + ' [Исправлено: удален actualEnd из активной смены]'
          }
        });
        
        results.activeStatusFixed++;
        results.details.push({
          shiftId: shift.id,
          processorName: shift.processor.name,
          issue: 'Активная смена с actualEnd',
          action: 'Удален actualEnd'
        });
      } catch (error) {
        console.error(`[FIX_NEGATIVE_HOURS] Ошибка исправления активной смены ${shift.id}:`, error);
        results.details.push({
          shiftId: shift.id,
          processorName: shift.processor.name,
          issue: 'Ошибка исправления активной смены',
          action: 'Не удалось исправить'
        });
      }
    }

    console.log(`[FIX_NEGATIVE_HOURS] Исправление завершено:`);
    console.log(`  - Исправлено смен с некорректным временем: ${results.corruptedTimeFixed}`);
    console.log(`  - Исправлено активных смен: ${results.activeStatusFixed}`);
    console.log(`  - Найдено слишком длинных смен: ${results.longShiftsFound}`);

    return NextResponse.json({
      success: true,
      message: "Исправление некорректных записей смен завершено",
      results
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Неизвестная ошибка";
    console.error("Ошибка исправления некорректных смен:", error);
    return NextResponse.json(
      { 
        success: false,
        error: errorMessage 
      },
      { status: errorMessage === "Не авторизован" ? 401 : errorMessage === "Недостаточно прав" ? 403 : 500 }
    );
  }
}
