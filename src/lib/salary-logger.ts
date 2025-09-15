import { prisma } from "./prisma";

export interface EarningsLogData {
  processorId: string;
  shiftId?: string;
  depositId?: string;
  salaryRequestId?: string;
  type: 'BASE_SALARY' | 'DEPOSIT_COMMISSION' | 'SHIFT_BONUS' | 'MONTHLY_BONUS' | 'ACHIEVEMENT_BONUS' | 'OVERTIME_BONUS' | 'MANUAL_ADJUSTMENT';
  description: string;
  amount: number;
  baseAmount?: number;
  percentage?: number;
  calculationDetails?: string;
  metadata?: Record<string, any>;
  period?: Date;
}

export interface SalaryRequestLogData {
  salaryRequestId: string;
  processorId: string;
  action: string;
  status: string;
  details?: string;
  amount?: number;
  adminId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export class SalaryLogger {
  /**
   * Логирует начисление заработка
   */
  static async logEarnings(data: EarningsLogData) {
    try {
      const log = await prisma.salary_earnings_log.create({
        data: {
          processorId: data.processorId,
          shiftId: data.shiftId,
          depositId: data.depositId,
          salaryRequestId: data.salaryRequestId,
          type: data.type,
          description: data.description,
          amount: data.amount,
          baseAmount: data.baseAmount,
          percentage: data.percentage,
          calculationDetails: data.calculationDetails,
          metadata: data.metadata ? JSON.stringify(data.metadata) : null,
          period: data.period,
          processedAt: new Date(),
          isIncludedInSalary: false,
        },
      });

      console.log(`[EARNINGS] Logged earnings for processor ${data.processorId}: ${data.type} - $${data.amount} - ${data.description}`);
      return log;
    } catch (error) {
      console.error("Ошибка при логировании заработка:", error);
      throw error;
    }
  }

  /**
   * Логирует действия с зарплатными запросами
   */
  static async logSalaryRequestAction(data: SalaryRequestLogData) {
    try {
      const log = await prisma.salary_request_log.create({
        data: {
          salaryRequestId: data.salaryRequestId,
          processorId: data.processorId,
          action: data.action,
          status: data.status,
          details: data.details,
          amount: data.amount,
          adminId: data.adminId,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
        },
      });

      console.log(`[SALARY_REQUEST] Logged salary request action: ${data.action} for processor ${data.processorId}`);
      return log;
    } catch (error) {
      console.error("Ошибка при логировании действия с зарплатным запросом:", error);
      throw error;
    }
  }

  /**
   * Логирует заработок от депозита
   */
  static async logDepositEarnings(
    processorId: string,
    depositId: string,
    shiftId: string,
    amount: number,
    depositAmount: number,
    commissionRate: number,
    bonusAmount: number
  ) {
    const logs = [];

    // Логируем комиссию от депозита
    if (amount > 0) {
      logs.push(await this.logEarnings({
        processorId,
        depositId,
        shiftId,
        type: 'DEPOSIT_COMMISSION',
        description: `Комиссия от депозита $${depositAmount}`,
        amount: amount - bonusAmount,
        baseAmount: depositAmount,
        percentage: commissionRate,
        calculationDetails: `$${depositAmount} * ${commissionRate}% = $${(amount - bonusAmount).toFixed(2)}`,
        metadata: {
          depositAmount,
          commissionRate,
          bonusAmount,
        },
      }));
    }

    // Логируем бонус от депозита (если есть)
    if (bonusAmount > 0) {
      logs.push(await this.logEarnings({
        processorId,
        depositId,
        shiftId,
        type: 'SHIFT_BONUS',
        description: `Бонус за объем депозитов в смене`,
        amount: bonusAmount,
        baseAmount: depositAmount,
        calculationDetails: `Бонус за достижение объема депозитов: $${bonusAmount.toFixed(2)}`,
        metadata: {
          depositAmount,
          bonusAmount,
        },
      }));
    }

    return logs;
  }

  /**
   * Логирует часовую оплату за смену
   */
  static async logShiftHourlyPay(
    processorId: string,
    shiftId: string,
    hours: number,
    hourlyRate: number,
    amount: number
  ) {
    return await this.logEarnings({
      processorId,
      shiftId,
      type: 'BASE_SALARY',
      description: `Часовая оплата за смену (${hours.toFixed(1)} часов)`,
      amount,
      baseAmount: hourlyRate,
      percentage: hours,
      calculationDetails: `${hours.toFixed(1)} часов * $${hourlyRate}/час = $${amount.toFixed(2)}`,
      metadata: {
        hours,
        hourlyRate,
      },
    });
  }

  /**
   * Логирует месячный бонус
   */
  static async logMonthlyBonus(
    processorId: string,
    monthlyVolume: number,
    bonusPercent: number,
    bonusAmount: number,
    bonusName: string,
    period: Date
  ) {
    return await this.logEarnings({
      processorId,
      type: 'MONTHLY_BONUS',
      description: `Месячный бонус "${bonusName}" за объем $${monthlyVolume.toLocaleString()}`,
      amount: bonusAmount,
      baseAmount: monthlyVolume,
      percentage: bonusPercent,
      period,
      calculationDetails: `$${monthlyVolume.toLocaleString()} * ${bonusPercent}% = $${bonusAmount.toFixed(2)}`,
      metadata: {
        bonusName,
        monthlyVolume,
        bonusPercent,
      },
    });
  }

  /**
   * Получает детализацию заработков за период
   */
  static async getEarningsBreakdown(
    processorId: string,
    startDate: Date,
    endDate: Date
  ) {
    const earnings = await prisma.salary_earnings_log.findMany({
      where: {
        processorId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        shift: {
          select: {
            id: true,
            shiftType: true,
            shiftDate: true,
          },
        },
        deposit: {
          select: {
            id: true,
            amount: true,
            currency: true,
            playerId: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Группируем по типам
    const breakdown = earnings.reduce((acc, earning) => {
      const type = earning.type;
      if (!acc[type]) {
        acc[type] = {
          type,
          totalAmount: 0,
          count: 0,
          items: [],
        };
      }
      
      acc[type].totalAmount += earning.amount;
      acc[type].count += 1;
      acc[type].items.push(earning);
      
      return acc;
    }, {} as Record<string, any>);

    return {
      breakdown,
      totalEarnings: earnings.reduce((sum, e) => sum + e.amount, 0),
      totalEntries: earnings.length,
      periodStart: startDate,
      periodEnd: endDate,
    };
  }

  /**
   * Помечает заработки как включенные в зарплатную выплату
   */
  static async markEarningsAsIncludedInSalary(
    processorId: string,
    periodStart: Date,
    periodEnd: Date,
    salaryRequestId: string
  ) {
    return await prisma.salary_earnings_log.updateMany({
      where: {
        processorId,
        createdAt: {
          gte: periodStart,
          lte: periodEnd,
        },
        isIncludedInSalary: false,
      },
      data: {
        isIncludedInSalary: true,
        salaryRequestId,
      },
    });
  }
}
