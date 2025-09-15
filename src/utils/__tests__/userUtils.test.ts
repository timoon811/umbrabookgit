/**
 * Тесты для утилит работы с пользователями
 */

import { getUserInitial, getDisplayName, maskUserName } from '../userUtils';

describe('userUtils', () => {
  describe('getUserInitial', () => {
    it('должен возвращать первый символ имени в верхнем регистре', () => {
      expect(getUserInitial('john')).toBe('J');
      expect(getUserInitial('Mary')).toBe('M');
      expect(getUserInitial('александр')).toBe('А');
    });

    it('должен обрабатывать имена с пробелами', () => {
      expect(getUserInitial('  john  ')).toBe('J');
      expect(getUserInitial(' Mary ')).toBe('M');
    });

    it('должен возвращать "?" для пустых/невалидных имен', () => {
      expect(getUserInitial('')).toBe('?');
      expect(getUserInitial('   ')).toBe('?');
      expect(getUserInitial(null)).toBe('?');
      expect(getUserInitial(undefined)).toBe('?');
    });

    it('должен обрабатывать все edge cases безопасно', () => {
      expect(getUserInitial(123 as any)).toBe('?');
      expect(getUserInitial({} as any)).toBe('?');
      expect(getUserInitial([] as any)).toBe('?');
      expect(getUserInitial(false as any)).toBe('?');
      expect(getUserInitial(0 as any)).toBe('?');
    });
  });

  describe('getDisplayName', () => {
    it('должен возвращать очищенное имя', () => {
      expect(getDisplayName('john')).toBe('john');
      expect(getDisplayName('  Mary  ')).toBe('Mary');
    });

    it('должен возвращать fallback для пустых имен', () => {
      expect(getDisplayName('')).toBe('Пользователь');
      expect(getDisplayName('   ')).toBe('Пользователь');
      expect(getDisplayName(null)).toBe('Пользователь');
      expect(getDisplayName(undefined)).toBe('Пользователь');
    });

    it('должен поддерживать кастомный fallback', () => {
      expect(getDisplayName('', 'Гость')).toBe('Гость');
      expect(getDisplayName(null, 'Анонимный')).toBe('Анонимный');
    });
  });

  describe('maskUserName', () => {
    it('должен маскировать длинные имена', () => {
      expect(maskUserName('john')).toBe('j**n');
      expect(maskUserName('alexander')).toBe('a*******r');
      expect(maskUserName('Мария')).toBe('М***я');
    });

    it('должен обрабатывать короткие имена', () => {
      expect(maskUserName('ab')).toBe('A*');
      expect(maskUserName('a')).toBe('A*');
    });

    it('должен возвращать "?*" для пустых имен', () => {
      expect(maskUserName('')).toBe('?*');
      expect(maskUserName('   ')).toBe('?*');
      expect(maskUserName(null)).toBe('?*');
      expect(maskUserName(undefined)).toBe('?*');
    });

    it('должен обрабатывать имена с пробелами', () => {
      expect(maskUserName('  john  ')).toBe('j**n');
      expect(maskUserName(' a ')).toBe('A*');
    });
  });
});
