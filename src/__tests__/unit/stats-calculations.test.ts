/**
 * Тесты для проверки корректности расчетов в статистике
 */

describe('Statistics Calculations', () => {
  describe('Основные расчеты', () => {
    it('должен корректно суммировать депозиты', () => {
      const deposits = [
        { amount: 100, bonusAmount: 5 },
        { amount: 200, bonusAmount: 10 },
        { amount: 300, bonusAmount: 15 },
      ];

      const totalAmount = deposits.reduce((sum, d) => sum + d.amount, 0);
      const totalBonus = deposits.reduce((sum, d) => sum + d.bonusAmount, 0);

      expect(totalAmount).toBe(600);
      expect(totalBonus).toBe(30);
    });

    it('должен корректно рассчитывать рабочие часы', () => {
      const shifts = [
        {
          actualStart: new Date('2025-01-15T06:00:00Z'),
          actualEnd: new Date('2025-01-15T14:00:00Z'),
        },
        {
          actualStart: new Date('2025-01-16T06:00:00Z'),
          actualEnd: new Date('2025-01-16T12:00:00Z'),
        },
      ];

      const calculateWorkHours = (shifts: any[]) => {
        return shifts.reduce((total, shift) => {
          if (shift.actualStart && shift.actualEnd) {
            const start = new Date(shift.actualStart);
            const end = new Date(shift.actualEnd);
            return total + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
          }
          return total;
        }, 0);
      };

      const totalHours = calculateWorkHours(shifts);
      expect(totalHours).toBe(14); // 8 + 6 часов
    });

    it('должен корректно рассчитывать заработок', () => {
      const hourlyRate = 2.0;
      const hoursWorked = 8;
      const bonuses = 50;

      const baseSalary = hoursWorked * hourlyRate;
      const totalEarnings = baseSalary + bonuses;

      expect(baseSalary).toBe(16);
      expect(totalEarnings).toBe(66);
    });

    it('должен корректно рассчитывать среднюю почасовую оплату', () => {
      const totalEarnings = 160;
      const totalHours = 8;

      const avgPerHour = totalHours > 0 ? totalEarnings / totalHours : 0;
      expect(avgPerHour).toBe(20);

      // Проверяем деление на ноль
      const avgPerHourZero = 0 > 0 ? totalEarnings / 0 : 0;
      expect(avgPerHourZero).toBe(0);
    });
  });

  describe('Прогресс к целям', () => {
    it('должен корректно рассчитывать процент выполнения', () => {
      const currentValue = 750;
      const targetValue = 1000;

      const percentage = Math.min((currentValue / targetValue) * 100, 100);
      expect(percentage).toBe(75);
    });

    it('должен ограничивать процент максимальным значением 100%', () => {
      const currentValue = 1200;
      const targetValue = 1000;

      const percentage = Math.min((currentValue / targetValue) * 100, 100);
      expect(percentage).toBe(100);
    });

    it('должен обрабатывать нулевую цель', () => {
      const currentValue = 500;
      const targetValue = 0;

      const percentage = targetValue > 0 ? Math.min((currentValue / targetValue) * 100, 100) : 0;
      expect(percentage).toBe(0);
    });
  });

  describe('Бонусная система', () => {
    const bonusGrid = [
      { minAmount: 0, maxAmount: 1000, percentage: 25 },
      { minAmount: 1000, maxAmount: 5000, percentage: 30 },
      { minAmount: 5000, maxAmount: null, percentage: 35 },
    ];

    it('должен найти правильный уровень бонуса', () => {
      const depositAmount = 2500;

      const applicableGrid = bonusGrid.find(grid => 
        depositAmount >= grid.minAmount && 
        (!grid.maxAmount || depositAmount <= grid.maxAmount)
      );

      expect(applicableGrid).toBeDefined();
      expect(applicableGrid?.percentage).toBe(30);
    });

    it('должен рассчитать бонус для высокого уровня', () => {
      const depositAmount = 10000;

      const applicableGrid = bonusGrid.find(grid => 
        depositAmount >= grid.minAmount && 
        (!grid.maxAmount || depositAmount <= grid.maxAmount)
      );

      expect(applicableGrid).toBeDefined();
      expect(applicableGrid?.percentage).toBe(35);
    });

    it('должен рассчитать процентный бонус', () => {
      const depositAmount = 2000;
      const bonusPercentage = 30;

      const bonusAmount = (depositAmount * bonusPercentage) / 100;
      expect(bonusAmount).toBe(600);
    });
  });

  describe('Месячные планы', () => {
    const monthlyBonuses = [
      { minAmount: 10000, bonusPercent: 5, name: 'Bronze' },
      { minAmount: 20000, bonusPercent: 8, name: 'Silver' },
      { minAmount: 30000, bonusPercent: 12, name: 'Gold' },
    ];

    it('должен найти подходящий месячный план', () => {
      const currentVolume = 15000;

      const applicableBonus = monthlyBonuses.find(bonus => 
        currentVolume >= bonus.minAmount
      );

      expect(applicableBonus).toBeDefined();
      expect(applicableBonus?.name).toBe('Bronze');
      expect(applicableBonus?.bonusPercent).toBe(5);
    });

    it('должен найти следующий месячный план', () => {
      const currentVolume = 15000;

      const nextBonus = monthlyBonuses.find(bonus => 
        currentVolume < bonus.minAmount
      );

      expect(nextBonus).toBeDefined();
      expect(nextBonus?.name).toBe('Silver');
      expect(nextBonus?.minAmount).toBe(20000);
    });

    it('должен не найти план для очень низкого объема', () => {
      const currentVolume = 5000;

      const applicableBonus = monthlyBonuses.find(bonus => 
        currentVolume >= bonus.minAmount
      );

      expect(applicableBonus).toBeUndefined();
    });
  });

  describe('Прогнозирование', () => {
    it('должен рассчитать прогноз на месяц', () => {
      const currentDate = new Date('2025-01-15T12:00:00Z');
      const daysInMonth = 31;
      const daysPassed = 15;
      const currentEarnings = 750;

      const avgDailyEarnings = currentEarnings / daysPassed;
      const projectedMonthlyEarnings = avgDailyEarnings * daysInMonth;

      expect(avgDailyEarnings).toBe(50);
      expect(projectedMonthlyEarnings).toBe(1550);
    });

    it('должен рассчитать оставшиеся дни месяца', () => {
      const currentDate = new Date('2025-01-15T12:00:00Z');
      const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
      const remainingDays = Math.max(0, daysInMonth - currentDate.getDate());

      expect(daysInMonth).toBe(31);
      expect(remainingDays).toBe(16);
    });

    it('должен рассчитать дневную цель', () => {
      const monthlyGoal = 2000;
      const currentEarnings = 750;
      const remainingDays = 16;

      const dailyTarget = remainingDays > 0 ? (monthlyGoal - currentEarnings) / remainingDays : 0;
      expect(dailyTarget).toBe(78.125);
    });
  });

  describe('Валидация данных', () => {
    it('должен обрабатывать некорректные числовые значения', () => {
      const invalidValues = [null, undefined, NaN, ''];
      
      invalidValues.forEach(value => {
        const safeValue = Number(value) || 0;
        expect(typeof safeValue).toBe('number');
        expect(isNaN(safeValue)).toBe(false);
      });
    });

    it('должен обрабатывать некорректные даты', () => {
      const invalidDates = [null, undefined, '', 'invalid-date'];
      
      invalidDates.forEach(dateValue => {
        const date = dateValue ? new Date(dateValue) : null;
        if (date && !isNaN(date.getTime())) {
          expect(date instanceof Date).toBe(true);
        } else {
          expect(date === null || isNaN(date.getTime())).toBe(true);
        }
      });
    });

    it('должен безопасно обрабатывать пустые массивы', () => {
      const emptyDeposits: any[] = [];
      
      const totalAmount = emptyDeposits.reduce((sum, d) => sum + (d.amount || 0), 0);
      const count = emptyDeposits.length;
      
      expect(totalAmount).toBe(0);
      expect(count).toBe(0);
    });
  });

  describe('Форматирование', () => {
    it('должен корректно форматировать валюту', () => {
      const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        }).format(amount);
      };

      expect(formatCurrency(1000)).toBe('$1,000');
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
      expect(formatCurrency(0)).toBe('$0');
    });

    it('должен корректно форматировать проценты', () => {
      const formatPercent = (value: number) => {
        return `${value.toFixed(1)}%`;
      };

      expect(formatPercent(75.5)).toBe('75.5%');
      expect(formatPercent(100)).toBe('100.0%');
      expect(formatPercent(0)).toBe('0.0%');
    });

    it('должен корректно форматировать числа с разделителями', () => {
      const formatNumber = (value: number) => {
        return value.toLocaleString();
      };

      expect(formatNumber(1000)).toBe('1,000');
      expect(formatNumber(1234567)).toBe('1,234,567');
      expect(formatNumber(0)).toBe('0');
    });
  });
});
