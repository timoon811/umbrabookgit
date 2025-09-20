"use client";

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

import { DocumentationPage, DocumentationSection } from '@/types/documentation';
import { Block } from '@/types/editor';
import { parseMarkdownToBlocks, convertBlocksToMarkdown, createEmptyBlock, generateId, extractYouTubeId } from '@/lib/block-utils';
import BlockMenu, { useBlockMenuPosition } from './BlockMenu';
import ConfirmModal from '@/components/modals/ConfirmModal';
import FileUploader from '@/components/admin/FileUploader';
import { normalizeFileUrl, isImageFile } from '@/lib/file-utils';

interface AdvancedContentEditorProps {
  selectedPage: DocumentationPage | null;
  onUpdateContent: (content: string) => void;
  onUpdateTitle?: (title: string) => void;
  onUpdateDescription?: (description: string) => void;
  onDeletePage?: (pageId: string) => void;
  onTogglePublication?: (pageId: string) => void;
  onForceSave?: (page: DocumentationPage) => Promise<boolean>;
  saving: boolean;
  sections?: DocumentationSection[]; // Для внутренних ссылок
}

export default function AdvancedContentEditor({
  selectedPage,
  onUpdateContent,
  onUpdateTitle,
  onUpdateDescription,
  onDeletePage,
  onTogglePublication,
  onForceSave,
  saving,
  sections = []
}: AdvancedContentEditorProps) {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [showToolbar, setShowToolbar] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showInternalLinkModal, setShowInternalLinkModal] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0, width: 0 });
  const [selectionInfo, setSelectionInfo] = useState<{
    element: HTMLTextAreaElement | HTMLInputElement | null;
    start: number;
    end: number;
  } | null>(null);

  const [showBlockMenu, setShowBlockMenu] = useState(false);
  const [blockMenuPosition, setBlockMenuPosition] = useState({ top: 0, left: 0 });
  const [pendingBlockId, setPendingBlockId] = useState<string | null>(null);
  const [undoStack, setUndoStack] = useState<Block[][]>([]);
  const [redoStack, setRedoStack] = useState<Block[][]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isManualSaving, setIsManualSaving] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Состояния для дополнительной панели форматирования
  const [showAdvancedToolbar, setShowAdvancedToolbar] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ top: 0, left: 0 });
  const [fontSize, setFontSize] = useState<'small' | 'normal' | 'large' | 'xlarge'>('normal');
  const [textColor, setTextColor] = useState('#000000');
  const [highlightColor, setHighlightColor] = useState('#ffff00');
  
  const { getMenuPosition } = useBlockMenuPosition();

  // Инициализация блоков из контента страницы с защитой от race conditions
  useEffect(() => {
    if (!selectedPage) {
      setBlocks([createEmptyBlock()]);
      setIsInitialLoad(false);
      return;
    }

    setIsInitialLoad(true);
    
    // Добавляем небольшую задержку для предотвращения race conditions
    const initTimer = setTimeout(() => {
      if (selectedPage?.content) {
        try {
          const parsedBlocks = parseMarkdownToBlocks(selectedPage.content);
          setBlocks(parsedBlocks.length > 0 ? parsedBlocks : [createEmptyBlock()]);
        } catch (error) {
          console.error('Ошибка парсинга контента:', error);
          setBlocks([createEmptyBlock()]);
        }
      } else {
        setBlocks([createEmptyBlock()]);
      }
      
      // Устанавливаем флаг завершения загрузки
      setTimeout(() => setIsInitialLoad(false), 200);
    }, 50);

    return () => clearTimeout(initTimer);
  }, [selectedPage?.id]);

  // Отслеживание изменений без автосохранения
  useEffect(() => {
    if (!isInitialLoad && blocks.length > 0 && selectedPage?.id) {
      const markdown = convertBlocksToMarkdown(blocks);
      
      // Проверяем, изменился ли контент
      const hasContentChanged = markdown !== selectedPage.content;
      const hasTitleChanged = selectedPage.title !== selectedPage.title; // Здесь должна быть логика для заголовка
      const hasDescriptionChanged = selectedPage.description !== selectedPage.description; // И для описания
      
      console.log('🔍 Проверка изменений:', {
        hasContentChanged,
        currentContentLength: markdown.length,
        originalContentLength: selectedPage.content?.length || 0,
        isInitialLoad,
        hasUnsavedChanges
      });
      
      if (hasContentChanged) {
        if (!hasUnsavedChanges) {
          console.log('✏️ Обнаружены несохраненные изменения');
          setHasUnsavedChanges(true);
        }
      } else {
        if (hasUnsavedChanges) {
          console.log('💾 Изменения синхронизированы');
          setHasUnsavedChanges(false);
        }
      }
    }
  }, [blocks, selectedPage?.id, selectedPage?.content, isInitialLoad, hasUnsavedChanges]);






  // Сохранение состояния для undo
  const saveStateForUndo = () => {
    setUndoStack(prev => {
      const newStack = [...prev, JSON.parse(JSON.stringify(blocks))];
      // Ограничиваем размер стека до 50 операций
      return newStack.slice(-50);
    });
    setRedoStack([]); // Очищаем redo stack при новом изменении
  };

  // Обновление блока
  const updateBlock = (blockId: string, updates: Partial<Block>) => {
    saveStateForUndo();
    setBlocks(prev => prev.map(block => 
      block.id === blockId 
        ? { ...block, ...updates }
        : block
    ));
  };

  // Функция undo
  const performUndo = () => {
    if (undoStack.length === 0) return;
    
    const currentState = JSON.parse(JSON.stringify(blocks));
    const previousState = undoStack[undoStack.length - 1];
    
    setRedoStack(prev => [...prev, currentState]);
    setUndoStack(prev => prev.slice(0, -1));
    setBlocks(previousState);
  };

  // Функция redo
  const performRedo = () => {
    if (redoStack.length === 0) return;
    
    const currentState = JSON.parse(JSON.stringify(blocks));
    const nextState = redoStack[redoStack.length - 1];
    
    setUndoStack(prev => [...prev, currentState]);
    setRedoStack(prev => prev.slice(0, -1));
    setBlocks(nextState);
  };

  // Добавление нового блока
  const addBlock = (type: string, afterId?: string) => {
    saveStateForUndo();
    const newBlock: Block = {
      id: generateId(),
      type,
      content: '',
      metadata: {}
    };

    if (afterId) {
      const index = blocks.findIndex(b => b.id === afterId);
      const newBlocks = [...blocks];
      newBlocks.splice(index + 1, 0, newBlock);
      setBlocks(newBlocks);
    } else {
      setBlocks(prev => [...prev, newBlock]);
    }

    setActiveBlockId(newBlock.id);
  };

  // Удаление блока
  const deleteBlock = (blockId: string) => {
    saveStateForUndo();
    if (blocks.length === 1) {
      // Если это последний блок, заменяем на пустой
      setBlocks([createEmptyBlock()]);
    } else {
      setBlocks(prev => prev.filter(block => block.id !== blockId));
    }
  };

  // Обработка выделения текста - новый подход с позиционированием над блоком
  const handleTextSelection = () => {
    const selection = window.getSelection();
    const activeElement = document.activeElement as HTMLTextAreaElement | HTMLInputElement;
    
    // Проверяем выделение в textarea/input
    if (activeElement && 
        (activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'INPUT') &&
        activeElement.selectionStart !== activeElement.selectionEnd &&
        activeBlockId) {
      
      const start = activeElement.selectionStart || 0;
      const end = activeElement.selectionEnd || 0;
      const selectedText = activeElement.value.substring(start, end);
      
      if (selectedText.trim()) {
        setSelectedText(selectedText);
        setSelectionInfo({
          element: activeElement,
          start,
          end
        });
        
        // Находим активный блок в DOM для позиционирования панели
        const activeBlockElement = document.querySelector(`[data-block-id="${activeBlockId}"]`);
        if (activeBlockElement) {
          const rect = activeBlockElement.getBoundingClientRect();
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
          
          // Позиционируем панель сверху блока во всю его ширину
          setToolbarPosition({
            top: rect.top + scrollTop - 60, // 60px высота панели + отступ
            left: rect.left + scrollLeft,
            width: rect.width
          });
          setShowToolbar(true);
        }
      } else {
        setShowToolbar(false);
        setSelectionInfo(null);
      }
    } else if (selection && selection.toString().trim() && activeBlockId) {
      // Обратная совместимость для обычного выделения
      setSelectedText(selection.toString());
      
      // Находим активный блок в DOM
      const activeBlockElement = document.querySelector(`[data-block-id="${activeBlockId}"]`);
      if (activeBlockElement) {
        const rect = activeBlockElement.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
        
        // Позиционируем панель сверху блока во всю его ширину
        setToolbarPosition({
          top: rect.top + scrollTop - 60, // 60px высота панели + отступ
          left: rect.left + scrollLeft,
          width: rect.width
        });
        setShowToolbar(true);
      }
    } else {
      setShowToolbar(false);
      setSelectionInfo(null);
    }
  };

  // Получение всех страниц для внутренних ссылок
  const getAllPages = () => {
    const pages: Array<{id: string, title: string, sectionName: string}> = [];
    sections.forEach(section => {
      section.pages?.forEach((page) => {
        pages.push({
          id: page.id,
          title: page.title,
          sectionName: section.name
        });
      });
    });
    return pages;
  };



  // Функции для работы со списками
  const continueList = (blockId: string, prefix: string) => {
    const activeElement = document.activeElement as HTMLTextAreaElement | HTMLInputElement;
    if (!activeElement) return;

    const cursorPos = activeElement.selectionStart || 0;
    const newText = activeElement.value.substring(0, cursorPos) + '\n' + prefix + activeElement.value.substring(cursorPos);
    
    updateBlock(blockId, { content: newText });
    
    setTimeout(() => {
      activeElement.focus();
      const newCursorPos = cursorPos + 1 + prefix.length;
      activeElement.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const exitList = (blockId: string) => {
    const activeElement = document.activeElement as HTMLTextAreaElement | HTMLInputElement;
    if (!activeElement) return;

    const cursorPos = activeElement.selectionStart || 0;
    const textBeforeCursor = activeElement.value.substring(0, cursorPos);
    const textAfterCursor = activeElement.value.substring(cursorPos);
    
    // Удаляем маркер списка из текущей строки
    const lines = textBeforeCursor.split('\n');
    const lastLine = lines[lines.length - 1];
    const cleanedLine = lastLine.replace(/^[-*]\s|^\d+\.\s/, '');
    lines[lines.length - 1] = cleanedLine;
    
    const newText = lines.join('\n') + textAfterCursor;
    updateBlock(blockId, { content: newText });
    
    setTimeout(() => {
      activeElement.focus();
      const newCursorPos = cursorPos - (lastLine.length - cleanedLine.length);
      activeElement.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const indentListItem = (blockId: string) => {
    const activeElement = document.activeElement as HTMLTextAreaElement | HTMLInputElement;
    if (!activeElement) return;

    const cursorPos = activeElement.selectionStart || 0;
    const textBeforeCursor = activeElement.value.substring(0, cursorPos);
    const textAfterCursor = activeElement.value.substring(cursorPos);
    
    const lines = textBeforeCursor.split('\n');
    const lineIndex = lines.length - 1;
    const currentLine = lines[lineIndex];
    
    // Добавляем отступ
    if (currentLine.match(/^[-*]\s/) || currentLine.match(/^\d+\.\s/)) {
      lines[lineIndex] = '  ' + currentLine;
      const newText = lines.join('\n') + textAfterCursor;
      updateBlock(blockId, { content: newText });
      
      setTimeout(() => {
        activeElement.focus();
        activeElement.setSelectionRange(cursorPos + 2, cursorPos + 2);
      }, 0);
    }
  };

  const outdentListItem = (blockId: string) => {
    const activeElement = document.activeElement as HTMLTextAreaElement | HTMLInputElement;
    if (!activeElement) return;

    const cursorPos = activeElement.selectionStart || 0;
    const textBeforeCursor = activeElement.value.substring(0, cursorPos);
    const textAfterCursor = activeElement.value.substring(cursorPos);
    
    const lines = textBeforeCursor.split('\n');
    const lineIndex = lines.length - 1;
    const currentLine = lines[lineIndex];
    
    // Убираем отступ
    if (currentLine.startsWith('  ')) {
      lines[lineIndex] = currentLine.substring(2);
      const newText = lines.join('\n') + textAfterCursor;
      updateBlock(blockId, { content: newText });
      
      setTimeout(() => {
        activeElement.focus();
        activeElement.setSelectionRange(cursorPos - 2, cursorPos - 2);
      }, 0);
    }
  };

    // ИСПРАВЛЕНО: Применение форматирования только к выделенному тексту
  const applyTextFormatting = (ignoredElement: any, prefix: string, suffix: string) => {
    if (!activeBlockId || !selectionInfo) {
      return;
    }

    const { element, start, end } = selectionInfo;
    if (!element) {
      return;
    }

    // Сохраняем текущую позицию курсора
    const cursorPosition = element.selectionStart || 0;
    const selectedText = element.value.substring(start, end);

    // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Применяем форматирование только к выделенному тексту
    let newText: string;
    let newCursorStart: number;
    let newCursorEnd: number;

    if (selectedText.length > 0) {
      // Есть выделенный текст - оборачиваем только его
      const beforeSelection = element.value.substring(0, start);
      const afterSelection = element.value.substring(end);
      const formattedText = prefix + selectedText + suffix;
      
      newText = beforeSelection + formattedText + afterSelection;
      newCursorStart = start + prefix.length;
      newCursorEnd = start + prefix.length + selectedText.length;
    } else {
      // Нет выделенного текста - вставляем маркеры и ставим курсор между ними
      const beforeCursor = element.value.substring(0, cursorPosition);
      const afterCursor = element.value.substring(cursorPosition);
      
      newText = beforeCursor + prefix + suffix + afterCursor;
      newCursorStart = cursorPosition + prefix.length;
      newCursorEnd = newCursorStart;
    }

    // Обновляем значение через React события для правильного обновления состояния
    const event = new Event('input', { bubbles: true });
    Object.defineProperty(event, 'target', {
      writable: false,
      value: { ...element, value: newText }
    });
    
    // Обновляем блок в состоянии
    updateBlock(activeBlockId, { content: newText });
    
    // ИСПРАВЛЕНО: Используем requestAnimationFrame для корректного обновления DOM
    requestAnimationFrame(() => {
      // Восстанавливаем значение в элементе
      element.value = newText;
      
      // Устанавливаем правильное выделение
      element.focus();
      element.setSelectionRange(newCursorStart, newCursorEnd);
      
      // Скрываем панель инструментов
      setShowToolbar(false);
      setSelectionInfo(null);
    });
  };

  // Функция для очистки всего форматирования блока
  const clearAllFormatting = () => {
    if (!activeBlockId) return;

    // Найдем активный блок в DOM
    const activeBlockElement = document.querySelector(`[data-block-id="${activeBlockId}"]`);
    if (!activeBlockElement) return;

    // Найдем поле ввода в активном блоке
    const inputElement = activeBlockElement.querySelector('textarea, input') as HTMLTextAreaElement | HTMLInputElement;
    if (!inputElement) return;

    // Очищаем весь текст от markdown форматирования
    let cleanText = inputElement.value
      // Удаляем жирный текст
      .replace(/\*\*(.*?)\*\*/g, '$1')
      // Удаляем курсив
      .replace(/\*(.*?)\*/g, '$1')
      // Удаляем подчеркивание
      .replace(/__(.*?)__/g, '$1')
      // Удаляем зачеркивание
      .replace(/~~(.*?)~~/g, '$1')
      // Удаляем код
      .replace(/`(.*?)`/g, '$1')
      // Удаляем ссылки, оставляя только текст
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // Удаляем внутренние ссылки
      .replace(/\[\[([^\]]+)\]\]/g, '$1');

    // Очищаем метаданные форматирования
    const cleanMetadata = {
      alignment: 'left' as const
    };

    // Обновляем блок
    updateBlock(activeBlockId, { 
      content: cleanText,
      metadata: cleanMetadata
    });

    // Обновляем значение в поле ввода
    requestAnimationFrame(() => {
      inputElement.value = cleanText;
      inputElement.focus();
      
      // Скрываем панель инструментов
      setShowToolbar(false);
      setSelectionInfo(null);
    });
  };

  // Обработчик клавиш для команд и навигации - только специальные команды
  const handleKeyDown = (e: React.KeyboardEvent, blockId: string) => {
    const target = e.target as HTMLTextAreaElement | HTMLInputElement;
    const cursorPos = target.selectionStart || 0;
    
    // НЕ обрабатываем обычные символьные клавиши - позволяем нормальный ввод
    // Обрабатываем только специальные команды
    
    // Обработка команды "/" для вызова меню блоков - только в начале строки или после пробела
    if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const textBeforeCursor = target.value.substring(0, cursorPos);
      const lastChar = textBeforeCursor[textBeforeCursor.length - 1];
      
      // Открываем меню только если / в начале строки или после пробела/переноса
      if (textBeforeCursor.length === 0 || lastChar === '\n' || /\s/.test(lastChar)) {
        e.preventDefault();
        
        // Получаем позицию элемента для размещения меню
        const position = getMenuPosition(target);
        
        setBlockMenuPosition(position);
        setPendingBlockId(blockId);
        setShowBlockMenu(true);
      }
      // Иначе позволяем нормальный ввод символа "/"
      return;
    }

    // Обработка Enter только для списков - создание новых элементов
    if (e.key === 'Enter') {
      const block = blocks.find(b => b.id === blockId);
      if (!block) return;

      // Для заголовков (heading1, heading2, heading3) - создаем новый параграф
      if (block.type === 'heading1' || block.type === 'heading2' || block.type === 'heading3') {
        e.preventDefault();
        const currentIndex = blocks.findIndex(b => b.id === blockId);
        
        const newBlock = {
          ...createEmptyBlock(),
          type: 'paragraph'
        };
        
        // Вставляем после текущего заголовка
        const newBlocks = [...blocks];
        newBlocks.splice(currentIndex + 1, 0, newBlock);
        setBlocks(newBlocks);
        
        // Фокусируемся на новом блоке
        setTimeout(() => {
          setActiveBlockId(newBlock.id);
          const newBlockElement = document.querySelector(`[data-block-id="${newBlock.id}"] textarea, [data-block-id="${newBlock.id}"] input`);
          if (newBlockElement) {
            (newBlockElement as HTMLElement).focus();
          }
        }, 100);
        return;
      }

      // Только для списков создаем новые элементы, для остальных блоков разрешаем обычные переносы строк
      if (block.type === 'numbered-list' || block.type === 'list') {
        // Проверяем, если текущая строка пуста, выходим из списка
        const lines = target.value.split('\n');
        const currentLineIndex = target.value.substring(0, cursorPos).split('\n').length - 1;
        const currentLine = lines[currentLineIndex] || '';
        
        if (currentLine.trim() === '') {
          // Пустая строка - выходим из списка
          e.preventDefault();
          updateBlock(blockId, { type: 'paragraph' });
          return;
        }

        // Создаем новый элемент списка
        e.preventDefault();
        const currentIndex = blocks.findIndex(b => b.id === blockId);
        
        const newBlock = {
          ...createEmptyBlock(),
          type: block.type
        };
        
        // Вставляем после текущего элемента
        const newBlocks = [...blocks];
        newBlocks.splice(currentIndex + 1, 0, newBlock);
        setBlocks(newBlocks);
        
        // Фокусируемся на новом блоке
        setTimeout(() => {
          setActiveBlockId(newBlock.id);
          const newBlockElement = document.querySelector(`[data-block-id="${newBlock.id}"] textarea, [data-block-id="${newBlock.id}"] input`);
          if (newBlockElement) {
            (newBlockElement as HTMLElement).focus();
          }
        }, 100);
        return;
      }
      
      // Для всех остальных блоков (paragraph, quote, code, callout) разрешаем обычные переносы строк
      // НЕ перехватываем Enter, позволяем стандартное поведение для многострочного контента
      return;
    }
    
    // Для всех остальных клавиш - НЕ перехватываем, позволяем нормальный ввод
  };

  // Обработчик выбора типа блока из меню
  const handleBlockTypeSelect = (type: string) => {
    if (pendingBlockId) {
      updateBlock(pendingBlockId, { type });
      setPendingBlockId(null);
    }
    setShowBlockMenu(false);
  };

  // Функция ручного сохранения
  const handleManualSave = async () => {
    console.log('🔄 Начинаем ручное сохранение:', {
      hasSelectedPage: !!selectedPage?.id,
      hasUnsavedChanges,
      isManualSaving,
      blocksCount: blocks.length
    });

    // Добавляем дополнительные проверки
    if (!selectedPage?.id) {
      console.warn('⚠️ Нет выбранной страницы для сохранения');
      return;
    }

    if (!hasUnsavedChanges) {
      console.log('ℹ️ Нет несохраненных изменений');
      return;
    }

    if (isManualSaving) {
      console.log('ℹ️ Сохранение уже в процессе');
      return;
    }

    setIsManualSaving(true);
    
    // Устанавливаем таймаут для предотвращения зависания
    const emergencyTimeout = setTimeout(() => {
      console.warn('⚠️ Принудительное завершение сохранения по таймауту');
      setIsManualSaving(false);
    }, 30000); // 30 секунд
    
    try {
      const currentContent = convertBlocksToMarkdown(blocks);
      console.log('📝 Контент подготовлен для сохранения, длина:', currentContent.length);
      
      const updatedPage = {
        ...selectedPage,
        content: currentContent
      };

      // Обновляем контент
      onUpdateContent(currentContent);
      console.log('✅ Контент обновлен через onUpdateContent');
      
      // Принудительно сохраняем
      if (onForceSave) {
        console.log('💾 Вызываем onForceSave...');
        const saveResult = await onForceSave(updatedPage);
        console.log('💾 Результат onForceSave:', saveResult);
        
        if (saveResult) {
          setHasUnsavedChanges(false);
          console.log('✅ Сохранение успешно завершено');
        } else {
          console.warn('⚠️ onForceSave вернул false');
        }
      } else {
        console.warn('⚠️ onForceSave не определен');
        // Если onForceSave не определен, все равно сбрасываем флаг
        setHasUnsavedChanges(false);
      }
    } catch (error) {
      console.error('❌ Ошибка при ручном сохранении:', error);
      // Можно добавить уведомление пользователю об ошибке
      if (typeof window !== 'undefined' && window.alert) {
        window.alert('Ошибка сохранения: ' + (error instanceof Error ? error.message : 'Неизвестная ошибка'));
      }
    } finally {
      clearTimeout(emergencyTimeout);
      setIsManualSaving(false);
      console.log('🏁 Ручное сохранение завершено');
    }
  };

  // Обработчик выхода со страницы - надежное принудительное сохранение
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (selectedPage?.id && hasUnsavedChanges && !saving) {
        // Принудительно сохраняем перед выходом с помощью sendBeacon
        const currentContent = convertBlocksToMarkdown(blocks);
        
        // Проверяем, изменился ли контент
        if (currentContent !== selectedPage.content) {
          try {
            // Используем Blob с правильным MIME типом для sendBeacon
            const data = new FormData();
            data.append('content', currentContent);
            data.append('title', selectedPage.title);
            data.append('description', selectedPage.description || '');
            
            // sendBeacon автоматически отправляет данные даже при закрытии страницы
            const sent = navigator.sendBeacon(
              `/api/admin/documentation/${selectedPage.id}`, 
              data
            );
            
            if (!sent) {
              console.warn('Не удалось отправить данные через sendBeacon');
            }
          } catch (error) {
            console.error('Ошибка при отправке данных через sendBeacon:', error);
          }
          
          // Показываем предупреждение пользователю
          e.preventDefault();
          e.returnValue = 'У вас есть несохраненные изменения. Вы уверены, что хотите покинуть страницу?';
          return e.returnValue;
        }
      }
    };

    const handleVisibilityChange = async () => {
      // Сохраняем при смене вкладки/минимизации окна
      if (document.visibilityState === 'hidden' && selectedPage?.id && hasUnsavedChanges && onForceSave) {
        const currentContent = convertBlocksToMarkdown(blocks);
        if (currentContent !== selectedPage.content) {
          const updatedPage = { ...selectedPage, content: currentContent };
          await onForceSave(updatedPage);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [selectedPage, blocks, hasUnsavedChanges, onForceSave, saving]);

  // Обработчик клавиши Escape для закрытия меню
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Закрытие меню по Escape
      if (e.key === 'Escape') {
        if (showBlockMenu) {
          setShowBlockMenu(false);
          setPendingBlockId(null);
        } else if (showDeleteConfirm) {
          setShowDeleteConfirm(false);
        } else if (showContextMenu) {
          setShowContextMenu(false);
        } else if (showToolbar) {
          setShowToolbar(false);
        }
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Закрываем блочное меню при клике вне его
      if (showBlockMenu) {
        if (!target.closest('.fixed[style*="z-index: 50"], .fixed[class*="z-50"]')) {
          setShowBlockMenu(false);
          setPendingBlockId(null);
        }
      }
      
      // Закрываем контекстное меню при клике вне его
      if (showContextMenu) {
        if (!target.closest('.fixed')) {
          setShowContextMenu(false);
        }
      }
      
      // Закрываем панель инструментов при клике вне выделения
      if (showToolbar) {
        const selection = window.getSelection();
        if (!selection || selection.toString().trim() === '') {
          setShowToolbar(false);
        }
      }
    };

    // Обработчик прокрутки для обновления позиции панели инструментов
    const handleScroll = () => {
      if (showToolbar && activeBlockId) {
        // При скролле обновляем позицию панели, если есть выделенный текст
        const selection = window.getSelection();
        if (selection && selection.toString().trim()) {
          handleTextSelection();
        } else {
          setShowToolbar(false);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('click', handleClickOutside);
    window.addEventListener('scroll', handleScroll);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('click', handleClickOutside);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [showBlockMenu, showDeleteConfirm, showContextMenu, showToolbar]);

  const renderToolbar = () => {
    if (!showToolbar || !activeBlockId) return null;

    return (
      <div
        className="absolute z-50 shadow-xl rounded-lg px-3 py-2 animate-in fade-in slide-in-from-top-2 duration-200"
        style={{
          top: toolbarPosition.top,
          left: toolbarPosition.left,
          width: toolbarPosition.width,
          transform: 'translateZ(0)', // Включаем аппаратное ускорение
          backgroundColor: 'var(--editor-bg)',
          border: '1px solid var(--editor-border)'
        }}
      >
        {/* Компактная однострочная панель инструментов */}
        <div className="flex items-center justify-between gap-1">
          {/* Левая группа - форматирование текста */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => applyTextFormatting(null, '**', '**')}
              className="p-1.5 rounded transition-colors editor-button-hover"
              style={{ color: 'var(--editor-text)' }}
              title="Жирный"
            >
              <strong className="text-sm">B</strong>
            </button>
            <button
              onClick={() => applyTextFormatting(null, '*', '*')}
              className="p-1.5 editor-button-hover rounded italic transition-colors"
              title="Курсив"
            >
              <span className="text-sm">I</span>
            </button>
            <button
              onClick={() => applyTextFormatting(null, '__', '__')}
              className="p-1.5 editor-button-hover rounded underline transition-colors"
              title="Подчеркивание"
            >
              <span className="text-sm">U</span>
            </button>
            <button
              onClick={() => applyTextFormatting(null, '~~', '~~')}
              className="p-1.5 editor-button-hover rounded line-through transition-colors"
              title="Зачеркивание"
            >
              <span className="text-sm">S</span>
            </button>
            
            <div className="w-px h-4 mx-1" style={{ backgroundColor: 'var(--editor-border)' }}></div>
            
            <button
              onClick={clearAllFormatting}
              className="p-1.5 editor-button-hover rounded transition-colors text-red-500 hover:text-red-600"
              title="Очистить всё форматирование"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
            
            <div className="w-px h-4 mx-1" style={{ backgroundColor: 'var(--editor-border)' }}></div>
            
            <button
              onClick={() => applyTextFormatting(null, '`', '`')}
              className="p-1.5 editor-button-hover rounded font-mono text-xs transition-colors"
              title="Код"
            >
              &lt;/&gt;
            </button>
            <button
              onClick={() => applyTextFormatting(null, '==', '==')}
              className="p-1.5 editor-button-hover rounded transition-colors"
              title="Выделить текст"
            >
              <div className="w-3 h-3 bg-yellow-300 rounded"></div>
            </button>
          </div>

          {/* Центральная группа - заголовки и ссылки */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                if (activeBlockId) {
                  updateBlock(activeBlockId, { type: 'heading1' });
                  setShowToolbar(false);
                }
              }}
              className="px-2 py-1 editor-button-hover rounded text-xs font-bold transition-colors"
              title="Заголовок 1"
            >
              H1
            </button>
            <button
              onClick={() => {
                if (activeBlockId) {
                  updateBlock(activeBlockId, { type: 'heading2' });
                  setShowToolbar(false);
                }
              }}
              className="px-2 py-1 editor-button-hover rounded text-xs font-semibold transition-colors"
              title="Заголовок 2"
            >
              H2
            </button>
            <button
              onClick={() => {
                if (activeBlockId) {
                  updateBlock(activeBlockId, { type: 'heading3' });
                  setShowToolbar(false);
                }
              }}
              className="px-2 py-1 editor-button-hover rounded text-xs font-medium transition-colors"
              title="Заголовок 3"
            >
              H3
            </button>
            
            <div className="w-px h-4 mx-1" style={{ backgroundColor: 'var(--editor-border)' }}></div>
            
            <button
              onClick={() => setShowLinkModal(true)}
              className="p-1.5 editor-button-hover rounded transition-colors"
              title="Добавить ссылку"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </button>
            <button
              onClick={() => setShowInternalLinkModal(true)}
              className="p-1.5 editor-button-hover rounded transition-colors"
              title="Внутренняя ссылка"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>
          </div>

          {/* Правая группа - действия */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => performUndo()}
              disabled={undoStack.length === 0}
              className={`p-1.5 editor-button-hover rounded transition-colors ${undoStack.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Отменить"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 10l6-6m-6 6l6 6" />
              </svg>
            </button>
            <button
              onClick={() => performRedo()}
              disabled={redoStack.length === 0}
              className={`p-1.5 editor-button-hover rounded transition-colors ${redoStack.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Повторить"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H3m18 0l-6-6m6 6l-6 6" />
              </svg>
            </button>
            
            <div className="w-px h-4 mx-1" style={{ backgroundColor: 'var(--editor-border)' }}></div>
            
            <button
              onClick={() => setShowToolbar(false)}
              className="p-1.5 editor-button-hover rounded transition-colors"
              title="Закрыть панель"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderBlock = (block: Block, blockIndex: number) => {
    const isActive = activeBlockId === block.id;

    return (
      <div key={block.id} className="group relative mb-4" data-block-id={block.id}>
        {/* Блок контента */}
        <div 
          className={`relative ${isActive ? 'ring-2 ring-gray-400 dark:ring-gray-500 rounded-lg' : ''}`}
          onClick={() => setActiveBlockId(block.id)}
        >
          <BlockRenderer
            block={block}
            isActive={isActive}
            onUpdate={(updates) => updateBlock(block.id, updates)}
            onTextSelection={handleTextSelection}
            onSlashCommand={handleKeyDown}
            blockIndex={blockIndex}
            allBlocks={blocks}
            sections={sections}
          />
        </div>

        {/* Кнопки управления блоком */}
        {isActive && (
          <div className="absolute -left-12 top-0 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => addBlock('paragraph', block.id)}
              className="w-8 h-8 rounded flex items-center justify-center text-xs"
              style={{
                backgroundColor: 'var(--editor-accent)',
                color: 'var(--editor-text)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--editor-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--editor-accent)'}
              title="Добавить блок"
            >
              +
            </button>
            {blocks.length > 1 && (
              <button
                onClick={() => deleteBlock(block.id)}
                className="w-8 h-8 rounded flex items-center justify-center text-xs"
                style={{ color: '#dc2626' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                title="Удалить блок"
              >
                ×
              </button>
            )}
          </div>
        )}

        {/* Улучшенное меню типов блоков */}
        {isActive && (
          <div className="absolute -right-2 top-0 z-40">
            <button
              onClick={(e) => {
                const position = getMenuPosition(e.currentTarget);
                setBlockMenuPosition(position);
                setPendingBlockId(block.id);
                setShowBlockMenu(true);
              }}
              className="shadow-lg rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-105"
              style={{
                backgroundColor: 'var(--editor-bg)',
                border: '1px solid var(--editor-border)'
              }}
              title="Изменить тип блока (или нажмите /)"
            >
              <svg className="w-5 h-5" style={{ color: 'var(--editor-text)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
              </svg>
            </button>
          </div>
        )}
      </div>
    );
  };



  if (!selectedPage) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: 'var(--editor-bg)' }}>
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--editor-accent)' }}>
            <svg className="w-8 h-8" style={{ color: 'var(--editor-secondary-text)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-medium mb-2" style={{ color: 'var(--editor-text)' }}>
            Выберите страницу
          </h3>
          <p style={{ color: 'var(--editor-secondary-text)' }}>
            Кликните на страницу в левом меню, чтобы начать редактирование
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col" style={{ backgroundColor: 'var(--editor-bg)' }} data-documentation-editor="true">
      {/* Шапка редактора */}
      <div className="border-b px-3 sm:px-4 lg:px-6 py-3 sm:py-4" style={{ borderColor: 'var(--editor-border)' }}>
        {/* Строка с полями ввода */}
        <div className="flex items-start gap-2 sm:gap-3 mb-3">
          <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
            selectedPage.isPublished ? 'bg-green-500' : 'bg-yellow-500'
          }`} />
          <div className="flex-1 min-w-0 space-y-2">
            {/* Редактируемый заголовок */}
            <input
              type="text"
              value={selectedPage.title}
              onChange={(e) => {
                if (onUpdateTitle) {
                  onUpdateTitle(e.target.value);
                }
              }}
              className="text-lg font-semibold bg-transparent border-none outline-none w-full  rounded px-1 py-0.5 transition-colors"
              style={{
                color: 'var(--editor-text)',
                backgroundColor: 'transparent'
              }}
              placeholder="Заголовок страницы..."
            />
            {/* Редактируемое описание */}
            <input
              type="text"
              value={selectedPage.description || ''}
              onChange={(e) => {
                if (onUpdateDescription) {
                  onUpdateDescription(e.target.value);
                }
              }}
              className="text-xs bg-transparent border-none outline-none w-full  rounded px-1 py-0.5 transition-colors"
              style={{
                color: 'var(--editor-secondary-text)',
                backgroundColor: 'transparent'
              }}
              placeholder="Описание страницы..."
            />
          </div>
        </div>
        
        {/* Строка с кнопками управления */}
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          {/* Индикатор статуса */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded text-xs" style={{ backgroundColor: 'var(--editor-accent)' }}>
            <div className={`w-1.5 h-1.5 rounded-full ${hasUnsavedChanges ? 'bg-orange-500' : 'bg-green-500'}`}></div>
            <span className={`font-medium ${hasUnsavedChanges ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}`}>
              {hasUnsavedChanges ? 'Изменения' : 'Сохранено'}
            </span>
          </div>

          {/* Кнопки управления */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Кнопка ручного сохранения */}
            <button
              onClick={handleManualSave}
              disabled={!hasUnsavedChanges || isManualSaving}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-all ${
                hasUnsavedChanges && !isManualSaving
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm border border-blue-700'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed border border-gray-300 dark:border-gray-600'
              }`}
              title={
                isManualSaving 
                  ? "Сохранение в процессе..." 
                  : hasUnsavedChanges 
                    ? "Сохранить изменения" 
                    : "Нет изменений для сохранения"
              }
              style={{ minWidth: '80px' }}
            >
              {isManualSaving ? (
                <>
                  <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span className="hidden sm:inline">Сохранение...</span>
                </>
              ) : (
                <>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="hidden sm:inline">Сохранить</span>
                </>
              )}
            </button>

            {/* Кнопка экстренного сохранения (только если обычная кнопка не работает) */}
            {isManualSaving && (
              <button
                onClick={() => {
                  console.log('🆘 Экстренное прерывание сохранения');
                  setIsManualSaving(false);
                  setHasUnsavedChanges(true);
                }}
                className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium rounded transition-all bg-red-600 hover:bg-red-700 text-white border border-red-700"
                title="Прервать зависшее сохранение"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="hidden sm:inline">Стоп</span>
              </button>
            )}
            
            {/* Кнопка публикации/скрытия */}
            {onTogglePublication && (
              <button
                onClick={() => onTogglePublication(selectedPage.id)}
                className={`flex items-center gap-1 px-2 py-1.5 text-xs font-medium rounded transition-all ${
                  selectedPage.isPublished
                    ? 'text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400'
                    : 'text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400'
                }`}
                title={selectedPage.isPublished ? "Скрыть страницу" : "Опубликовать страницу"}
              >
                {selectedPage.isPublished ? (
                  <>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                    Скрыть
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Опубликовать
                  </>
                )}
              </button>
            )}




            {/* Кнопка удаления */}
            {onDeletePage && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center justify-center w-6 h-6 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 rounded transition-colors"
                title="Удалить страницу"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Основной редактор */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 relative">
          <div onMouseUp={handleTextSelection}>
            {blocks.map((block, index) => renderBlock(block, index))}
          </div>
          
          {/* Кнопка добавления нового блока */}
          <button
            onClick={() => addBlock('paragraph')}
            className="w-full mt-4 p-3 border-2 border-dashed rounded-lg transition-colors"
            style={{
              borderColor: 'var(--editor-border)',
              color: 'var(--editor-secondary-text)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--editor-text)';
              e.currentTarget.style.color = 'var(--editor-text)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--editor-border)';
              e.currentTarget.style.color = 'var(--editor-secondary-text)';
            }}
          >
            + Добавить блок
          </button>
        </div>
      </div>

      {/* Плавающая панель инструментов */}
      {renderToolbar()}

      {/* Контекстное меню */}
      {showContextMenu && (
        <div
          className="fixed z-50 shadow-lg rounded-lg py-2 min-w-[200px]"
          style={{
            top: Math.min(contextMenuPosition.top, window.innerHeight - 200),
            left: Math.min(contextMenuPosition.left, window.innerWidth - 220),
            backgroundColor: 'var(--editor-bg)',
            border: '1px solid var(--editor-border)'
          }}
          onMouseLeave={() => setShowContextMenu(false)}
        >
          <button
            onClick={() => {
              applyTextFormatting(null, '**', '**');
              setShowContextMenu(false);
            }}
            className="w-full px-4 py-2 text-left flex items-center gap-3"
            style={{ color: 'var(--editor-text)' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--editor-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <strong className="text-sm">B</strong>
            <span className="text-sm">Сделать жирным</span>
          </button>
          <button
            onClick={() => {
              applyTextFormatting(null, '*', '*');
              setShowContextMenu(false);
            }}
            className="w-full px-4 py-2 text-left flex items-center gap-3"
            style={{ color: 'var(--editor-text)' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--editor-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <span className="text-sm italic">I</span>
            <span className="text-sm">Курсив</span>
          </button>
          <button
            onClick={() => {
              applyTextFormatting(null, '__', '__');
              setShowContextMenu(false);
            }}
            className="w-full px-4 py-2 text-left flex items-center gap-3"
            style={{ color: 'var(--editor-text)' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--editor-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <span className="text-sm underline">U</span>
            <span className="text-sm">Подчеркнутый</span>
          </button>
          <hr className="my-1" style={{ borderColor: 'var(--editor-border)' }} />
          <button
            onClick={() => {
              setShowLinkModal(true);
              setShowContextMenu(false);
            }}
            className="w-full px-4 py-2 text-left flex items-center gap-3"
            style={{ color: 'var(--editor-text)' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--editor-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <span className="text-sm">Добавить ссылку</span>
          </button>
          <button
            onClick={() => {
              applyTextFormatting(null, '`', '`');
              setShowContextMenu(false);
            }}
            className="w-full px-4 py-2 text-left flex items-center gap-3"
            style={{ color: 'var(--editor-text)' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--editor-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <span className="text-xs font-mono">&lt;/&gt;</span>
            <span className="text-sm">Код</span>
          </button>
        </div>
      )}

      {/* Модальные окна */}
      <LinkModal 
        isOpen={showLinkModal}
        onClose={() => setShowLinkModal(false)}
        selectedText={selectedText}
        onApply={() => {
          // Логика применения ссылки
          setShowLinkModal(false);
        }}
      />

      <InternalLinkModal
        isOpen={showInternalLinkModal}
        onClose={() => setShowInternalLinkModal(false)}
        selectedText={selectedText}
        pages={getAllPages()}
        onApply={() => {
          // Логика применения внутренней ссылки
          setShowInternalLinkModal(false);
        }}
      />

      {/* Улучшенное меню блоков - позиционируется абсолютно */}
      <BlockMenu
        isOpen={showBlockMenu}
        onClose={() => {
          setShowBlockMenu(false);
          setPendingBlockId(null);
        }}
        onSelectType={handleBlockTypeSelect}
        position={blockMenuPosition}
        currentBlockType={pendingBlockId ? blocks.find(b => b.id === pendingBlockId)?.type : undefined}
      />



      {/* Модальное окно подтверждения удаления */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          if (onDeletePage) {
            onDeletePage(selectedPage.id);
          }
        }}
        title="Удалить страницу документации?"
        message={`Вы уверены, что хотите удалить страницу "${selectedPage.title}"? Это действие нельзя отменить. Все содержимое страницы будет безвозвратно утеряно.`}
        type="danger"
        actionType="delete-page"
        confirmText="Удалить страницу"
        cancelText="Отменить"
      />

    </div>
  );
}

// Компонент для рендеринга отдельного блока
function BlockRenderer({ 
  block, 
  isActive, 
  onUpdate, 
  onTextSelection,
  onSlashCommand,
  blockIndex,
  allBlocks,
}: {
  block: Block;
  isActive: boolean;
  onUpdate: (updates: Partial<Block>) => void;
  onTextSelection: () => void;
  onSlashCommand?: (e: React.KeyboardEvent, blockId: string) => void;
  sections?: DocumentationSection[];
  blockIndex: number;
  allBlocks: Block[];
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Функция для вычисления номера элемента нумерованного списка
  const getListItemNumber = (): number => {
    let number = 1;
    
    // Идем назад от текущего элемента, считаем элементы нумерованного списка
    for (let i = blockIndex - 1; i >= 0; i--) {
      const prevBlock = allBlocks[i];
      if (prevBlock.type === 'numbered-list') {
        number++;
      } else {
        // Если встретили блок другого типа, прерываем подсчет
        break;
      }
    }
    
    return number;
  };

  // Автоматическое изменение размера при загрузке и изменении контента
  useEffect(() => {
    if (textareaRef.current && autoResize.current) {
      // Используем requestAnimationFrame для лучшей производительности
      const frameId = requestAnimationFrame(() => {
        if (textareaRef.current && autoResize.current) {
          autoResize.current(textareaRef.current);
        }
      });
      
      return () => cancelAnimationFrame(frameId);
    }
  }, [block.content]);

  // Наблюдатель за изменениями размера для responsive поведения
  useEffect(() => {
    if (!textareaRef.current) return;

    const element = textareaRef.current;
    
    // Инициализируем размер при монтировании
    if (autoResize.current) {
      autoResize.current(element);
    }

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === element && autoResize.current) {
          // Используем debouncing для избежания избыточных вызовов
          setTimeout(() => {
            if (autoResize.current && element.isConnected) {
              autoResize.current(element);
            }
          }, 10);
        }
      }
    });

    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
      // Очищаем timeout при размонтировании
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, []);
  const updateContent = (content: string) => {
    onUpdate({ content });
  };

  const updateMetadata = (metadata: Partial<Block['metadata']>) => {
    onUpdate({ metadata: { ...block.metadata, ...metadata } });
  };

  // Улучшенная функция для автоматического изменения размера textarea
  // Убираем ограничения по максимальной высоте для полной адаптивности
  const autoResize = useRef<((element: HTMLTextAreaElement) => void) | null>(null);
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  if (!autoResize.current) {
    // Создаем функцию с debouncing для лучшей производительности
    autoResize.current = (element: HTMLTextAreaElement) => {
      requestAnimationFrame(() => {
        // Сохраняем текущую позицию курсора
        const cursorPosition = element.selectionStart;
        
        // Скрываем scrollbar для точного расчета размера
        const originalOverflow = element.style.overflow;
        element.style.overflow = 'hidden';
        
        // Сбрасываем высоту для точного расчета
        element.style.height = 'auto';
        
        // Рассчитываем нужную высоту с учетом padding и border
        const computed = window.getComputedStyle(element);
        const paddingTop = parseInt(computed.paddingTop, 10);
        const paddingBottom = parseInt(computed.paddingBottom, 10);
        const borderTop = parseInt(computed.borderTopWidth, 10);
        const borderBottom = parseInt(computed.borderBottomWidth, 10);
        const lineHeight = parseInt(computed.lineHeight, 10) || 20;
        
        // Минимальная высота = одна строка + padding + border
        const minHeight = lineHeight + paddingTop + paddingBottom + borderTop + borderBottom;
        
        // УБИРАЕМ максимальную высоту - блок должен расширяться без ограничений
        // Устанавливаем высоту точно под содержимое
        const newHeight = Math.max(element.scrollHeight, minHeight);
        element.style.height = newHeight + 'px';
        
        // Убираем скролл - блок должен полностью отображать весь контент
        element.style.overflowY = 'hidden';
        
        // Восстанавливаем overflow если он был изменен
        if (originalOverflow && originalOverflow !== 'hidden') {
          element.style.overflow = originalOverflow;
        }
        
        // Восстанавливаем позицию курсора
        element.setSelectionRange(cursorPosition, cursorPosition);
        
        // ИСПРАВЛЕНО: Убираем принудительный автоскролл к центру
        // Только обеспечиваем видимость курсора если он вышел за пределы экрана
        const rect = element.getBoundingClientRect();
        const isOutOfView = rect.bottom < 0 || rect.top > window.innerHeight;
        
        if (isOutOfView) {
          // Скроллим только до видимости, не к центру
          element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'nearest'  // ИЗМЕНЕНО: nearest вместо center
          });
        }
      });
    };
  }

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateContent(e.target.value);
    if (autoResize.current) {
      autoResize.current(e.target);
    }
  };

  // Обработчик контекстного меню
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    // Для сейчас просто предотвращаем стандартное меню
    // TODO: Добавить кастомное контекстное меню позже
  };

  const baseInputProps = {
    value: block.content || '',
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (e.target.tagName === 'TEXTAREA') {
        handleTextareaChange(e as React.ChangeEvent<HTMLTextAreaElement>);
      } else {
        updateContent(e.target.value);
      }
    },
    onMouseUp: onTextSelection,
    onKeyUp: onTextSelection, // Добавляем менеджер для клавиатуры
    onSelect: onTextSelection, // Добавляем специальный менеджер для выделения
    onKeyDown: (e: React.KeyboardEvent) => {
      // Обрабатываем только команду slash, всё остальное пропускаем
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        onSlashCommand?.(e, block.id);
      }
      // Для всех остальных клавиш НЕ вызываем preventDefault - позволяем нормальный ввод
    },
    onContextMenu: handleContextMenu,
    className: "w-full bg-transparent border-none outline-none resize-none focus:ring-0 overflow-hidden"
  };

  const baseTextareaProps = {
    ...baseInputProps,
    onInput: (e: React.FormEvent<HTMLTextAreaElement>) => {
      if (e.target && (e.target as HTMLElement).tagName === 'TEXTAREA' && autoResize.current) {
        // ИСПРАВЛЕНО: Используем debouncing для предотвращения избыточных вызовов autoResize
        clearTimeout(resizeTimeoutRef.current);
        resizeTimeoutRef.current = setTimeout(() => {
          if (autoResize.current && e.target) {
            autoResize.current(e.target as HTMLTextAreaElement);
          }
        }, 16); // ~60fps
      }
    }
  };

  switch (block.type) {
    case 'heading1':
      return (
        <input 
          {...baseInputProps}
          placeholder="Заголовок 1"
          className={`${baseInputProps.className} text-3xl font-bold py-2`}
          style={{ color: 'var(--editor-text)' }}
        />
      );

    case 'heading2':
      return (
        <input 
          {...baseInputProps}
          placeholder="Заголовок 2"
          className={`${baseInputProps.className} text-2xl font-semibold py-2`}
          style={{ color: 'var(--editor-text)' }}
        />
      );

    case 'heading3':
      return (
        <input 
          {...baseInputProps}
          placeholder="Заголовок 3"
          className={`${baseInputProps.className} text-xl font-medium py-1`}
          style={{ color: 'var(--editor-text)' }}
        />
      );

    case 'quote':
      return (
        <div className="border-l-4 pl-4 rounded-r-lg" style={{
          borderColor: 'var(--editor-border)',
          backgroundColor: 'var(--editor-accent)'
        }}>
          <textarea
            {...baseTextareaProps}
            ref={textareaRef}
            placeholder="Цитата..."
            className={`${baseInputProps.className} italic py-3`}
            style={{
              color: 'var(--editor-text)',
              overflow: 'hidden'
            }}
          />
        </div>
      );

    case 'list':
      return (
        <div className="flex items-start gap-3">
          <span className="flex-shrink-0" style={{ color: 'var(--editor-secondary-text)' }}>•</span>
          <textarea
            {...baseTextareaProps}
            ref={textareaRef}
            placeholder="Элемент списка..."
            className={`${baseInputProps.className} flex-1`}
            style={{
              color: 'var(--editor-text)',
              overflow: 'hidden'
            }}
          />
        </div>
      );

    case 'numbered-list':
      return (
        <div className="flex items-start gap-3">
          <span className="flex-shrink-0 min-w-0" style={{ color: 'var(--editor-secondary-text)' }}>{getListItemNumber()}.</span>
          <textarea
            {...baseTextareaProps}
            ref={textareaRef}
            placeholder="Элемент списка..."
            className={`${baseInputProps.className} flex-1`}
            style={{
              color: 'var(--editor-text)',
              overflow: 'hidden'
            }}
          />
        </div>
      );

    case 'code':
      return (
        <div className="rounded-lg border" style={{
          backgroundColor: 'var(--editor-code-bg)',
          borderColor: 'var(--editor-border)'
        }}>
          <div className="flex items-center justify-between px-4 py-2 border-b" style={{ borderColor: 'var(--editor-border)' }}>
            <select
              value={block.metadata?.language || 'text'}
              onChange={(e) => updateMetadata({ language: e.target.value })}
              className="text-sm bg-transparent border-none outline-none"
              style={{ color: 'var(--editor-secondary-text)' }}
            >
              <option value="text">Обычный текст</option>
              <option value="javascript">JavaScript</option>
              <option value="typescript">TypeScript</option>
              <option value="python">Python</option>
              <option value="html">HTML</option>
              <option value="css">CSS</option>
              <option value="json">JSON</option>
              <option value="bash">Bash</option>
              <option value="sql">SQL</option>
              <option value="php">PHP</option>
            </select>
          </div>
          <textarea 
            {...baseTextareaProps}
            ref={textareaRef}
            placeholder="Код..."
            className={`${baseInputProps.className} font-mono text-sm p-4`}
            style={{
              color: 'var(--editor-text)',
              overflow: 'hidden'
            }}
          />
        </div>
      );

    case 'image':
      return (
        <div className="border rounded-lg p-4" style={{ borderColor: 'var(--editor-border)' }}>
          {block.metadata?.url ? (
            <div>
              <Image 
                src={block.metadata.url} 
                alt={block.metadata.alt || ''}
                width={800}
                height={600}
                className="max-w-full h-auto rounded-lg"
                unoptimized={true}
              />
              <input
                type="text"
                value={block.metadata.caption || ''}
                onChange={(e) => updateMetadata({ caption: e.target.value })}
                placeholder="Подпись к изображению (необязательно)"
                className="w-full mt-3 text-sm bg-transparent border-none outline-none"
                style={{ color: 'var(--editor-secondary-text)' }}
              />
              <button
                onClick={() => updateMetadata({ url: '' })}
                className="mt-2 text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                Удалить изображение
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Загрузка файла */}
              <FileUploader
                type="image"
                accept="image/*"
                onUpload={(url, name, fileType) => {
                  updateContent(url);
                  updateMetadata({ 
                    url: url, 
                    alt: name,
                    caption: name
                  });
                }}
                className="mb-4"
              />
              
              {/* Разделитель */}
              <div className="flex items-center gap-3">
                <hr className="flex-1" style={{ borderColor: 'var(--editor-border)' }} />
                <span className="text-xs" style={{ color: 'var(--editor-secondary-text)' }}>или</span>
                <hr className="flex-1" style={{ borderColor: 'var(--editor-border)' }} />
              </div>
              
              {/* Поле для URL */}
              <div className="text-center">
                <input
                  type="url"
                  value={block.content}
                  onChange={(e) => {
                    updateContent(e.target.value);
                    updateMetadata({ url: e.target.value });
                  }}
                  placeholder="Или вставьте URL изображения..."
                  className="w-full text-center bg-transparent border rounded px-3 py-2 outline-none focus:border-gray-900 dark:focus:border-gray-300"
                  style={{
                    borderColor: 'var(--editor-border)',
                    color: 'var(--editor-secondary-text)'
                  }}
                />
              </div>
            </div>
          )}
        </div>
      );

    case 'file':
      const getFileIcon = (fileName: string, fileType?: string) => {
        if (fileType?.startsWith('image/')) return (
          <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
        if (fileType?.includes('pdf')) return (
          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
        if (fileType?.includes('word') || fileType?.includes('document')) return (
          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-5m-1.414-1.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        );
        if (fileType?.includes('excel') || fileType?.includes('spreadsheet')) return (
          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        );
        if (fileType?.includes('powerpoint') || fileType?.includes('presentation')) return (
          <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V3a1 1 0 011 1v9.5M7 4V3a1 1 0 00-1 1v9.5m0 0a2 2 0 002 2h8a2 2 0 002-2M7 4h10" />
          </svg>
        );
        if (fileType?.includes('zip') || fileType?.includes('rar') || fileType?.includes('7z')) return (
          <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        );
        if (fileType?.includes('audio')) return (
          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
        );
        if (fileType?.includes('video')) return (
          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        );
        if (fileName?.endsWith('.txt')) return (
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
        if (fileName?.endsWith('.json')) return (
          <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        );
        if (fileName?.endsWith('.csv')) return (
          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        );
        return (
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        );
      };

      return (
        <div className="border rounded-lg p-4" style={{ borderColor: 'var(--editor-border)' }}>
          {block.metadata?.url ? (
            <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--editor-accent)' }}>
              <div className="text-2xl">
                {getFileIcon(block.metadata.name || '', block.metadata.type)}
              </div>
              <div className="flex-1 min-w-0">
                <input
                  type="text"
                  value={block.metadata.name || ''}
                  onChange={(e) => updateMetadata({ name: e.target.value })}
                  placeholder="Название файла"
                  className="w-full font-medium bg-transparent border-none outline-none"
                  style={{ color: 'var(--editor-text)' }}
                />
                {block.metadata.size && (
                  <p className="text-xs mt-1" style={{ color: 'var(--editor-secondary-text)' }}>
                    Размер: {(block.metadata.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={block.metadata.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-gray-900 dark:hover:text-gray-200"
                  style={{ color: 'var(--editor-text)' }}
                  title="Открыть файл"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
                <button
                  onClick={() => updateMetadata({ url: '', name: '', size: undefined, type: undefined })}
                  className="hover:text-red-700 dark:hover:text-red-300"
                  style={{ color: '#dc2626' }}
                  title="Удалить файл"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Загрузка файла */}
              <FileUploader
                type="file"
                accept="*/*"
                onUpload={(url, name, fileType) => {
                  updateContent(url);
                  updateMetadata({ 
                    url: url, 
                    name: name,
                    type: fileType
                  });
                }}
              />
              
              {/* Разделитель */}
              <div className="flex items-center gap-3">
                <hr className="flex-1" style={{ borderColor: 'var(--editor-border)' }} />
                <span className="text-xs" style={{ color: 'var(--editor-secondary-text)' }}>или</span>
                <hr className="flex-1" style={{ borderColor: 'var(--editor-border)' }} />
              </div>
              
              {/* Поле для URL */}
              <div className="text-center">
                <input
                  type="url"
                  value={block.content}
                  onChange={(e) => {
                    updateContent(e.target.value);
                    updateMetadata({ url: e.target.value });
                  }}
                  placeholder="Или вставьте URL файла..."
                  className="w-full text-center bg-transparent border border-gray-300 dark:border-gray-600 rounded px-3 py-2 outline-none focus:border-gray-900 dark:focus:border-gray-300 text-gray-600 dark:text-gray-400"
                />
              </div>
            </div>
          )}
        </div>
      );

    case 'youtube':
      const youtubeId = block.metadata?.youtubeId || extractYouTubeId(block.content);
      return (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          {youtubeId ? (
            <div>
              <div className="relative aspect-video">
                <iframe
                  src={`https://www.youtube.com/embed/${youtubeId}`}
                  className="w-full h-full rounded-lg"
                  frameBorder="0"
                  allowFullScreen
                  title="YouTube video"
                />
              </div>
              <input
                type="text"
                value={block.metadata?.caption || ''}
                onChange={(e) => updateMetadata({ caption: e.target.value })}
                placeholder="Описание видео (необязательно)"
                className="w-full mt-3 text-sm text-gray-600 dark:text-gray-400 bg-transparent border-none outline-none"
              />
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-3">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <input
                type="url"
                value={block.content}
                onChange={(e) => {
                  updateContent(e.target.value);
                  const id = extractYouTubeId(e.target.value);
                  if (id) updateMetadata({ youtubeId: id });
                }}
                placeholder="Вставьте ссылку на YouTube видео..."
                className="w-full text-center bg-transparent border-none outline-none text-gray-600 dark:text-gray-400"
              />
            </div>
          )}
        </div>
      );

    case 'callout':
      const calloutStyles = {
        info: 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200',
        warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200',
        error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200',
        success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
      };
      const calloutType = block.metadata?.calloutType || 'info';
      
      return (
        <div className={`border rounded-lg p-4 ${calloutStyles[calloutType]}`}>
          <div className="flex items-center gap-2 mb-2">
            <select
              value={calloutType}
              onChange={(e) => updateMetadata({ calloutType: e.target.value as any })}
              className="bg-transparent border-none outline-none text-sm font-medium"
            >
              <option value="info">Информация</option>
              <option value="warning">Предупреждение</option>
              <option value="error">Ошибка</option>
              <option value="success">Успех</option>
            </select>
          </div>
          <textarea 
            {...baseTextareaProps}
            ref={textareaRef}
            placeholder="Содержимое выноски..."
            className={`${baseInputProps.className}`}
            style={{ overflow: 'hidden' }}
          />
        </div>
      );

    case 'divider':
      return (
        <div className="py-6">
          <hr className="border-gray-300 dark:border-gray-600" />
        </div>
      );

    default: // paragraph
      return (
        <div className="relative">
          <textarea 
            {...baseTextareaProps}
            ref={textareaRef}
            placeholder="Начните писать или введите / для команд..."
            className={`${baseInputProps.className} leading-relaxed py-1`}
            style={{
              color: 'var(--editor-text)',
              overflow: 'hidden'
            }}
          />

          {!block.content && isActive && (
            <div className="absolute top-full left-0 mt-1 text-xs pointer-events-none" style={{ color: 'var(--editor-secondary-text)' }}>
              Нажмите <kbd className="px-1.5 py-0.5 rounded text-xs" style={{ backgroundColor: 'var(--editor-accent)' }}>/</kbd> для выбора типа блока
            </div>
          )}
        </div>
      );
  }
}

// Модальное окно для добавления ссылки
function LinkModal({ 
  isOpen, 
  onClose, 
  selectedText, 
  onApply 
}: {
  isOpen: boolean;
  onClose: () => void;
  selectedText: string;
  onApply: (url: string, title: string) => void;
}) {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState(selectedText);

  useEffect(() => {
    if (isOpen) {
      setTitle(selectedText);
    }
  }, [isOpen, selectedText]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="rounded-lg p-6 w-96" style={{ backgroundColor: 'var(--editor-bg)' }}>
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--editor-text)' }}>Добавить ссылку</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--editor-text)' }}>
              Текст ссылки
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              style={{
                borderColor: 'var(--editor-border)',
                backgroundColor: 'var(--editor-bg)',
                color: 'var(--editor-text)'
              }}
              placeholder="Введите текст ссылки"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--editor-text)' }}>
              URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              style={{
                borderColor: 'var(--editor-border)',
                backgroundColor: 'var(--editor-bg)',
                color: 'var(--editor-text)'
              }}
              placeholder="https://example.com"
            />
          </div>
        </div>
        
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 hover:text-gray-900 dark:hover:text-gray-200" style={{ color: 'var(--editor-secondary-text)' }}
          >
            Отмена
          </button>
          <button
            onClick={() => onApply(url, title)}
            disabled={!url || !title}
            className="px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: 'var(--editor-text)',
              color: 'var(--editor-bg)'
            }}
            onMouseEnter={(e) => {
              if (!e.currentTarget.hasAttribute('disabled')) {
                e.currentTarget.style.backgroundColor = 'var(--editor-secondary-text)';
              }
            }}
            onMouseLeave={(e) => {
              if (!e.currentTarget.hasAttribute('disabled')) {
                e.currentTarget.style.backgroundColor = 'var(--editor-text)';
              }
            }}
          >
            Применить
          </button>
        </div>
      </div>
    </div>
  );
}

// Модальное окно для внутренних ссылок
function InternalLinkModal({ 
  isOpen, 
  onClose, 
  selectedText, 
  pages,
  onApply 
}: {
  isOpen: boolean;
  onClose: () => void;
  selectedText: string;
  pages: Array<{id: string, title: string, sectionName: string}>;
  onApply: (pageId: string, title: string) => void;
}) {
  const [selectedPageId, setSelectedPageId] = useState('');
  const [title, setTitle] = useState(selectedText);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPages = pages.filter(page => 
    page.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    page.sectionName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setTitle(selectedText);
    }
  }, [isOpen, selectedText]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="rounded-lg p-6 w-96 max-h-96" style={{ backgroundColor: 'var(--editor-bg)' }}>
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--editor-text)' }}>Ссылка на страницу</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--editor-text)' }}>
              Текст ссылки
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              style={{
                borderColor: 'var(--editor-border)',
                backgroundColor: 'var(--editor-bg)',
                color: 'var(--editor-text)'
              }}
              placeholder="Введите текст ссылки"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--editor-text)' }}>
              Поиск страниц
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border rounded-md mb-2"
              style={{
                borderColor: 'var(--editor-border)',
                backgroundColor: 'var(--editor-bg)',
                color: 'var(--editor-text)'
              }}
              placeholder="Найти страницу..."
            />
            
            <div className="max-h-32 overflow-y-auto border rounded-md" style={{ borderColor: 'var(--editor-border)' }}>
              {filteredPages.map(page => (
                <label key={page.id} className="flex items-center p-2 cursor-pointer editor-button-hover">
                  <input
                    type="radio"
                    value={page.id}
                    checked={selectedPageId === page.id}
                    onChange={(e) => setSelectedPageId(e.target.value)}
                    className="mr-3"
                  />
                  <div>
                    <div className="text-sm font-medium" style={{ color: 'var(--editor-text)' }}>{page.title}</div>
                    <div className="text-xs" style={{ color: 'var(--editor-secondary-text)' }}>{page.sectionName}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 hover:text-gray-900 dark:hover:text-gray-200" style={{ color: 'var(--editor-secondary-text)' }}
          >
            Отмена
          </button>
          <button
            onClick={() => onApply(selectedPageId, title)}
            disabled={!selectedPageId || !title}
            className="px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: 'var(--editor-text)',
              color: 'var(--editor-bg)'
            }}
            onMouseEnter={(e) => {
              if (!e.currentTarget.hasAttribute('disabled')) {
                e.currentTarget.style.backgroundColor = 'var(--editor-secondary-text)';
              }
            }}
            onMouseLeave={(e) => {
              if (!e.currentTarget.hasAttribute('disabled')) {
                e.currentTarget.style.backgroundColor = 'var(--editor-text)';
              }
            }}
          >
            Применить
          </button>
        </div>
      </div>
    </div>
  );
}

// Утилита для извлечения YouTube ID
function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}
