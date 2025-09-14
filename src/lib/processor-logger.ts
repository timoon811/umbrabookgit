import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export type ProcessorActionType = 
  | 'SHIFT_START'
  | 'SHIFT_END';

interface LogActionParams {
  processorId: string;
  action: ProcessorActionType;
  description: string;
  metadata?: Record<string, any>;
  request?: NextRequest;
}

export class ProcessorLogger {
  static async logAction(params: LogActionParams) {
    try {
      const { processorId, action, description, metadata, request } = params;
      
      // Извлекаем IP и User-Agent из запроса
      let ipAddress: string | undefined;
      let userAgent: string | undefined;
      
      if (request) {
        ipAddress = request.ip || 
                   request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   undefined;
        userAgent = request.headers.get('user-agent') || undefined;
      }

      await prisma.processor_action_logs.create({
        data: {
          processorId,
          action,
          description,
          metadata: metadata ? JSON.stringify(metadata) : null,
          ipAddress,
          userAgent,
        }
      });

      console.log(`📝 Logged action: ${action} for processor ${processorId} - ${description}`);
    } catch (error) {
      console.error('❌ Failed to log processor action:', error);
      // Не выбрасываем ошибку, чтобы не нарушить основной поток
    }
  }

  // Удобные методы для частых действий
  static async logShiftStart(processorId: string, shiftType: string, request?: NextRequest) {
    await this.logAction({
      processorId,
      action: 'SHIFT_START',
      description: `Начал ${this.getShiftTypeName(shiftType)} смену`,
      metadata: { shiftType },
      request
    });
  }

  static async logShiftEnd(processorId: string, shiftType: string, duration: number, request?: NextRequest, autoEnded = false) {
    const durationMinutes = Math.round(duration / 60000);
    const baseDescription = `${autoEnded ? 'Автоматически завершена' : 'Завершил'} ${this.getShiftTypeName(shiftType)} смену`;
    const description = `${baseDescription} (продолжительность: ${durationMinutes} мин)${autoEnded ? ' - автозавершение системой' : ''}`;
    
    await this.logAction({
      processorId,
      action: 'SHIFT_END',
      description,
      metadata: { shiftType, duration, autoEnded },
      request
    });
  }

  // Вспомогательный метод для получения названия смены
  private static getShiftTypeName(shiftType: string): string {
    switch (shiftType) {
      case 'MORNING': return 'утреннюю';
      case 'DAY': return 'дневную';
      case 'NIGHT': return 'ночную';
      default: return shiftType.toLowerCase();
    }
  }
}
