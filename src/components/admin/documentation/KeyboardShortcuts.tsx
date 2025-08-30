"use client";

import { useEffect } from 'react';

interface KeyboardShortcutsProps {
  onShortcut: (action: string, data?: any) => void;
}

export default function KeyboardShortcuts({ onShortcut }: KeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      
      // Проверяем, находимся ли мы в поле ввода
      const isInInputField = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
      const isInDocumentationEditor = target.closest('[data-documentation-editor]') !== null;

      // ДЕБАГ: Логируем нажатие пробела
      if (e.key === ' ') {
        console.log('🔍 SPACEBAR DEBUG:', {
          key: e.key,
          target: target.tagName,
          isInInputField,
          isInDocumentationEditor,
          targetElement: target,
          parentElements: {
            parent: target.parentElement?.tagName,
            grandParent: target.parentElement?.parentElement?.tagName,
            hasDataDocEditor: target.closest('[data-documentation-editor]') !== null,
            hasSortableHandle: target.closest('[data-sortable-handle]') !== null
          }
        });
      }

      // Ctrl/Cmd + комбинации - работают только в редакторе блоков документации
      if (e.ctrlKey || e.metaKey) {
        // Разрешаем только в textarea/input редактора документации
        if (!isInInputField || !isInDocumentationEditor) return;
        
        switch (e.key) {
          case 'b':
            e.preventDefault();
            onShortcut('bold');
            break;
          case 'i':
            e.preventDefault();
            onShortcut('italic');
            break;
          case 'u':
            e.preventDefault();
            onShortcut('underline');
            break;
          case 'k':
            e.preventDefault();
            onShortcut('link');
            break;
          case 's':
            e.preventDefault();
            onShortcut('save');
            break;
          case 'z':
            if (e.shiftKey) {
              e.preventDefault();
              onShortcut('redo');
            } else {
              e.preventDefault();
              onShortcut('undo');
            }
            break;
          case '1':
            e.preventDefault();
            onShortcut('heading', { level: 1 });
            break;
          case '2':
            e.preventDefault();
            onShortcut('heading', { level: 2 });
            break;
          case '3':
            e.preventDefault();
            onShortcut('heading', { level: 3 });
            break;
          case '`':
            e.preventDefault();
            onShortcut('code');
            break;
        }
        return; // Выходим, чтобы не обрабатывать другие клавиши
      }

      // Обычные клавиши (Tab, Enter) - только для textarea/input В РЕДАКТОРЕ документации
      if (!isInInputField || !isInDocumentationEditor) return;
      
      switch (e.key) {
        case 'Tab':
          // Проверяем, находимся ли мы в списке
          const value = (target as HTMLTextAreaElement | HTMLInputElement).value;
          const cursorPos = (target as HTMLTextAreaElement | HTMLInputElement).selectionStart;
          const lineStart = value.lastIndexOf('\n', cursorPos - 1) + 1;
          const currentLine = value.substring(lineStart, cursorPos);
          
          if (currentLine.match(/^[-*]\s/) || currentLine.match(/^\d+\.\s/)) {
            e.preventDefault();
            if (e.shiftKey) {
              onShortcut('outdent');
            } else {
              onShortcut('indent');
            }
          }
          break;
        case 'Enter':
          const valueEnter = (target as HTMLTextAreaElement | HTMLInputElement).value;
          const cursorPosEnter = (target as HTMLTextAreaElement | HTMLInputElement).selectionStart;
          const lineStartEnter = valueEnter.lastIndexOf('\n', cursorPosEnter - 1) + 1;
          const currentLineEnter = valueEnter.substring(lineStartEnter, cursorPosEnter);
          
          // Автопродолжение списков
          const listMatch = currentLineEnter.match(/^([-*]\s|(\d+)\.\s)/);
          if (listMatch) {
            e.preventDefault();
            if (currentLineEnter.trim() === listMatch[0].trim()) {
              // Пустой элемент списка - выходим из списка
              onShortcut('exitList');
            } else {
              // Продолжаем список
              const nextNumber = listMatch[2] ? parseInt(listMatch[2]) + 1 : null;
              const prefix = nextNumber ? `${nextNumber}. ` : listMatch[1];
              onShortcut('continueList', { prefix });
            }
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onShortcut]);

  return null; // Этот компонент не рендерит ничего
}

// Хелпер для отображения подсказок по горячим клавишам
export function ShortcutsHelp({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  // Обработка клавиши Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  // Обработка клика вне модального окна
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('shortcuts-overlay')) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Ctrl/Cmd + B', action: 'Жирный текст (**текст**)' },
    { key: 'Ctrl/Cmd + I', action: 'Курсив (*текст*)' },
    { key: 'Ctrl/Cmd + U', action: 'Подчеркивание (__текст__)' },
    { key: 'Ctrl/Cmd + K', action: 'Добавить ссылку' },
    { key: 'Ctrl/Cmd + `', action: 'Код (`код`)' },
    { key: 'Ctrl/Cmd + S', action: 'Сохранить (автосохранение)' },
    { key: 'Ctrl/Cmd + Z', action: 'Отменить последнее изменение' },
    { key: 'Ctrl/Cmd + Shift + Z', action: 'Повторить отмененное изменение' },
    { key: 'Ctrl/Cmd + 1,2,3', action: 'Заголовки H1, H2, H3' },
    { key: 'Tab', action: 'Увеличить отступ в списке' },
    { key: 'Shift + Tab', action: 'Уменьшить отступ в списке' },
    { key: 'Enter', action: 'Продолжить список' },
    { key: '/', action: 'Открыть меню блоков' },
    { key: 'Esc', action: 'Закрыть меню' },
    { key: '?', action: 'Показать эту справку' }
  ];

  return (
    <div className="shortcuts-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-h-96 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Горячие клавиши
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>
        
        <div className="space-y-3">
          {shortcuts.map((shortcut, index) => (
            <div key={index} className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {shortcut.action}
              </span>
              <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded font-mono">
                {shortcut.key}
              </kbd>
            </div>
          ))}
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Нажмите <kbd className="px-1 bg-gray-100 dark:bg-gray-700 rounded">?</kbd> чтобы открыть эту справку
          </p>
        </div>
      </div>
    </div>
  );
}
