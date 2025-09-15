/**
 * Интеграционные тесты для предотвращения ошибок charAt в аватарах пользователей
 */

import { getUserInitial, getDisplayName, maskUserName } from '@/utils/userUtils';

describe('Интеграционные тесты аватаров пользователей', () => {
  describe('getUserInitial', () => {
    const testCases = [
      // Нормальные случаи
      { input: 'John', expected: 'J', description: 'обычное имя' },
      { input: 'Иван', expected: 'И', description: 'кириллическое имя' },
      { input: 'александр', expected: 'А', description: 'кириллическое имя в нижнем регистре' },
      { input: '张三', expected: '张', description: 'китайские символы' },
      
      // Краевые случаи
      { input: '', expected: '?', description: 'пустая строка' },
      { input: '   ', expected: '?', description: 'строка из пробелов' },
      { input: null, expected: '?', description: 'null' },
      { input: undefined, expected: '?', description: 'undefined' },
      { input: '  John  ', expected: 'J', description: 'имя с пробелами' },
      { input: 'a', expected: 'A', description: 'одна буква' },
      { input: 'Ab', expected: 'A', description: 'две буквы' },
      
      // Специальные символы
      { input: '123', expected: '1', description: 'начинается с цифры' },
      { input: '@john', expected: '@', description: 'начинается со спецсимвола' },
      { input: '-John', expected: '-', description: 'начинается с дефиса' },
    ];

    testCases.forEach(({ input, expected, description }) => {
      it(`должен правильно обработать ${description}: "${input}" -> "${expected}"`, () => {
        expect(getUserInitial(input as any)).toBe(expected);
      });
    });
  });

  describe('getDisplayName', () => {
    const testCases = [
      { input: 'John Doe', expected: 'John Doe', description: 'обычное имя' },
      { input: '  John Doe  ', expected: 'John Doe', description: 'имя с пробелами' },
      { input: '', expected: 'Пользователь', description: 'пустая строка' },
      { input: '   ', expected: 'Пользователь', description: 'строка из пробелов' },
      { input: null, expected: 'Пользователь', description: 'null' },
      { input: undefined, expected: 'Пользователь', description: 'undefined' },
    ];

    testCases.forEach(({ input, expected, description }) => {
      it(`должен правильно обработать ${description}: "${input}" -> "${expected}"`, () => {
        expect(getDisplayName(input as any)).toBe(expected);
      });
    });

    it('должен поддерживать кастомный fallback', () => {
      expect(getDisplayName('', 'Гость')).toBe('Гость');
      expect(getDisplayName(null, 'Анонимный')).toBe('Анонимный');
    });
  });

  describe('maskUserName', () => {
    const testCases = [
      { input: 'John', expected: 'J**n', description: 'короткое имя' },
      { input: 'Alexander', expected: 'A*******r', description: 'длинное имя' },
      { input: 'ab', expected: 'A*', description: 'очень короткое имя' },
      { input: 'a', expected: 'A*', description: 'одна буква' },
      { input: '', expected: '?*', description: 'пустая строка' },
      { input: '   ', expected: '?*', description: 'строка из пробелов' },
      { input: null, expected: '?*', description: 'null' },
      { input: undefined, expected: '?*', description: 'undefined' },
      { input: '  John  ', expected: 'J**n', description: 'имя с пробелами' },
    ];

    testCases.forEach(({ input, expected, description }) => {
      it(`должен правильно замаскировать ${description}: "${input}" -> "${expected}"`, () => {
        expect(maskUserName(input as any)).toBe(expected);
      });
    });
  });

  describe('Стресс-тесты', () => {
    it('должен обрабатывать множественные вызовы без ошибок', () => {
      const inputs = [null, undefined, '', '   ', 'John', 'Иван', '123', '@test'];
      
      for (let i = 0; i < 1000; i++) {
        inputs.forEach(input => {
          expect(() => getUserInitial(input as any)).not.toThrow();
          expect(() => getDisplayName(input as any)).not.toThrow();
          expect(() => maskUserName(input as any)).not.toThrow();
        });
      }
    });

    it('должен возвращать согласованные результаты', () => {
      const input = 'John Doe';
      
      for (let i = 0; i < 100; i++) {
        expect(getUserInitial(input)).toBe('J');
        expect(getDisplayName(input)).toBe('John Doe');
        expect(maskUserName(input)).toBe('J******e');
      }
    });
  });

  describe('Проверка типов данных из API', () => {
    it('должен обрабатывать данные как от нового API', () => {
      const userData = {
        name: 'John Doe',
        id: '1',
        email: 'john@example.com',
        role: 'USER'
      };
      
      expect(getUserInitial(userData.name)).toBe('J');
      expect(getDisplayName(userData.name)).toBe('John Doe');
    });

    it('должен обрабатывать данные с отсутствующим именем', () => {
      const userData = {
        id: '1',
        email: 'john@example.com',
        role: 'USER'
        // name отсутствует
      };
      
      expect(getUserInitial((userData as any).name)).toBe('?');
      expect(getDisplayName((userData as any).name)).toBe('Пользователь');
    });

    it('должен обрабатывать данные с пустым именем', () => {
      const userData = {
        name: '',
        id: '1',
        email: 'john@example.com',
        role: 'USER'
      };
      
      expect(getUserInitial(userData.name)).toBe('?');
      expect(getDisplayName(userData.name)).toBe('Пользователь');
    });
  });
});
