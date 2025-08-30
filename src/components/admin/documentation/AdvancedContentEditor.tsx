"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { DocumentationPage, DocumentationSection } from '@/types/documentation';
import KeyboardShortcuts, { ShortcutsHelp } from './KeyboardShortcuts';
import BlockMenu, { useBlockMenuPosition } from './BlockMenu';
import ConfirmModal from '@/components/modals/ConfirmModal';
import FileUploader from '@/components/admin/FileUploader';

export interface Block {
  id: string;
  type: string;
  content: string;
  metadata?: {
    alignment?: 'left' | 'center' | 'right';
    color?: string;
    backgroundColor?: string;
    url?: string;
    alt?: string;
    caption?: string;
    language?: string;
    fontSize?: 'small' | 'normal' | 'large' | 'xlarge';
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    strikethrough?: boolean;
    highlight?: boolean;
    highlightColor?: string;
    linkUrl?: string;
    linkTitle?: string;
    internalPageId?: string;
    youtubeId?: string;
    videoUrl?: string;
    isCallout?: boolean;
    calloutType?: 'info' | 'warning' | 'error' | 'success';
  };
}

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
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 });
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [showBlockMenu, setShowBlockMenu] = useState(false);
  const [blockMenuPosition, setBlockMenuPosition] = useState({ top: 0, left: 0 });
  const [pendingBlockId, setPendingBlockId] = useState<string | null>(null);
  const [undoStack, setUndoStack] = useState<Block[][]>([]);
  const [redoStack, setRedoStack] = useState<Block[][]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isManualSaving, setIsManualSaving] = useState(false);
  
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
      if (markdown !== selectedPage.content) {
        setHasUnsavedChanges(true);
      }
    }
  }, [blocks, selectedPage?.id, selectedPage?.content, isInitialLoad]);



  const createEmptyBlock = (): Block => ({
    id: generateId(),
    type: 'paragraph',
    content: '',
    metadata: {}
  });

  const generateId = () => `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Парсинг Markdown в блоки
  const parseMarkdownToBlocks = (markdown: string): Block[] => {
    const lines = markdown.split('\n');
    const blocks: Block[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // YouTube ссылки
      const youtubeMatch = line.match(/^https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
      if (youtubeMatch) {
        blocks.push({
          id: generateId(),
          type: 'youtube',
          content: line,
          metadata: { youtubeId: youtubeMatch[1] }
        });
        continue;
      }

      // Заголовки
      if (line.startsWith('# ')) {
        blocks.push({
          id: generateId(),
          type: 'heading1',
          content: line.substring(2),
          metadata: {}
        });
        continue;
      }

      if (line.startsWith('## ')) {
        blocks.push({
          id: generateId(),
          type: 'heading2',
          content: line.substring(3),
          metadata: {}
        });
        continue;
      }

      if (line.startsWith('### ')) {
        blocks.push({
          id: generateId(),
          type: 'heading3',
          content: line.substring(4),
          metadata: {}
        });
        continue;
      }

      // Код блоки
      if (line.startsWith('```')) {
        const language = line.substring(3).trim() || 'text';
        const codeLines = [];
        i++; // Пропускаем строку с открывающими ```
        
        while (i < lines.length && !lines[i].trim().startsWith('```')) {
          codeLines.push(lines[i]);
          i++;
        }
        
        blocks.push({
          id: generateId(),
          type: 'code',
          content: codeLines.join('\n'),
          metadata: { language }
        });
        continue;
      }

      // Цитаты
      if (line.startsWith('> ')) {
        blocks.push({
          id: generateId(),
          type: 'quote',
          content: line.substring(2),
          metadata: {}
        });
        continue;
      }

      // Изображения
      const imageMatch = line.match(/!\[([^\]]*)\]\(([^)]+)\)/);
      if (imageMatch) {
        blocks.push({
          id: generateId(),
          type: 'image',
          content: imageMatch[2],
          metadata: { url: imageMatch[2], alt: imageMatch[1], caption: imageMatch[1] }
        });
        continue;
      }

      // Файлы (ссылки на файлы)
      const fileMatch = line.match(/\[📎\s*([^\]]+)\]\(([^)]+)\)/);
      if (fileMatch) {
        blocks.push({
          id: generateId(),
          type: 'file',
          content: fileMatch[2],
          metadata: { url: fileMatch[2], name: fileMatch[1] }
        });
        continue;
      }

      // Списки
      if (line.match(/^[-*] /)) {
        blocks.push({
          id: generateId(),
          type: 'list',
          content: line.substring(2),
          metadata: {}
        });
        continue;
      }

      if (line.match(/^\d+\. /)) {
        blocks.push({
          id: generateId(),
          type: 'numbered-list',
          content: line.replace(/^\d+\. /, ''),
          metadata: {}
        });
        continue;
      }

      // Обычный текст
      if (line.trim()) {
        blocks.push({
          id: generateId(),
          type: 'paragraph',
          content: line,
          metadata: {}
        });
      }
    }

    return blocks.length > 0 ? blocks : [createEmptyBlock()];
  };

  // Конвертация блоков в Markdown
  const convertBlocksToMarkdown = (blocks: Block[]): string => {
    return blocks.map(block => {
      switch (block.type) {
        case 'heading1':
          return `# ${block.content}`;
        case 'heading2':
          return `## ${block.content}`;
        case 'heading3':
          return `### ${block.content}`;
        case 'quote':
          return `> ${block.content}`;
        case 'code':
          return `\`\`\`${block.metadata?.language || 'text'}\n${block.content}\n\`\`\``;
        case 'list':
          return `- ${block.content}`;
        case 'numbered-list':
          return `1. ${block.content}`;
        case 'image':
          return `![${block.metadata?.alt || ''}](${block.metadata?.url || block.content})`;
        case 'file':
          return `[📎 ${block.metadata?.name || 'Файл'}](${block.metadata?.url || block.content})`;
        case 'youtube':
          return block.content;
        case 'internal-link':
          return `[${block.content}](/docs/${block.metadata?.internalPageId})`;
        case 'external-link':
          return `[${block.content}](${block.metadata?.linkUrl})`;
        case 'callout':
          const calloutType = block.metadata?.calloutType || 'info';
          return `> **${calloutType.toUpperCase()}**: ${block.content}`;
        case 'divider':
          return '---';
        default:
          return block.content;
      }
    }).join('\n\n');
  };

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

  // Обработка выделения текста
  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      setSelectedText(selection.toString());
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setToolbarPosition({
        top: rect.top - 60,
        left: rect.left + (rect.width / 2)
      });
      setShowToolbar(true);
    } else {
      setShowToolbar(false);
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

  // Обработчик горячих клавиш
  const handleShortcut = (action: string, data?: { level?: number; prefix?: string }) => {
    const activeElement = document.activeElement as HTMLTextAreaElement | HTMLInputElement;
    
    switch (action) {
      case 'bold':
        applyTextFormatting(activeElement, '**', '**');
        break;
      case 'italic':
        applyTextFormatting(activeElement, '*', '*');
        break;
      case 'underline':
        applyTextFormatting(activeElement, '__', '__');
        break;
      case 'strikethrough':
        applyTextFormatting(activeElement, '~~', '~~');
        break;
      case 'code':
        applyTextFormatting(activeElement, '`', '`');
        break;
      case 'link':
        if (activeElement && activeElement.selectionStart !== activeElement.selectionEnd) {
          setSelectedText(activeElement.value.substring(activeElement.selectionStart || 0, activeElement.selectionEnd || 0));
        }
        setShowLinkModal(true);
        break;
      case 'save':
        // Автосохранение уже работает
        break;
      case 'heading':
        if (activeBlockId && data?.level) {
          updateBlock(activeBlockId, { type: `heading${data.level}` });
        }
        break;
      case 'undo':
        performUndo();
        break;
      case 'redo':
        performRedo();
        break;
      case 'continueList':
        if (activeBlockId && data?.prefix) {
          continueList(activeBlockId, data.prefix);
        }
        break;
      case 'exitList':
        if (activeBlockId) {
          exitList(activeBlockId);
        }
        break;
      case 'indent':
        if (activeBlockId) {
          indentListItem(activeBlockId);
        }
        break;
      case 'outdent':
        if (activeBlockId) {
          outdentListItem(activeBlockId);
        }
        break;
      default:
        console.log('Unhandled shortcut:', action, data);
    }
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

  // Применение форматирования текста
  const applyTextFormatting = (element: HTMLTextAreaElement | HTMLInputElement | null, prefix: string, suffix: string) => {
    if (!element || !activeBlockId) return;

    const start = element.selectionStart || 0;
    const end = element.selectionEnd || 0;
    const selectedText = element.value.substring(start, end);
    
    let newText: string;
    let newCursorPos: number;

    if (selectedText) {
      // Есть выделенный текст - оборачиваем его
      newText = element.value.substring(0, start) + prefix + selectedText + suffix + element.value.substring(end);
      newCursorPos = end + prefix.length + suffix.length;
    } else {
      // Нет выделенного текста - вставляем маркеры и ставим курсор между ними
      newText = element.value.substring(0, start) + prefix + suffix + element.value.substring(end);
      newCursorPos = start + prefix.length;
    }

    // Обновляем блок
    updateBlock(activeBlockId, { content: newText });
    
    // Устанавливаем позицию курсора через короткий таймаут
    setTimeout(() => {
      element.focus();
      element.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // Обработчик команды "/"" для вызова меню блоков
  const handleSlashCommand = (e: React.KeyboardEvent, blockId: string) => {
    if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const target = e.target as HTMLTextAreaElement | HTMLInputElement;
      const cursorPos = target.selectionStart || 0;
      
      // Проверяем, что "/" в начале строки или после пробела
      const textBeforeCursor = target.value.substring(0, cursorPos);
      const lastChar = textBeforeCursor[textBeforeCursor.length - 1];
      
      if (textBeforeCursor.length === 0 || lastChar === '\n' || /\s/.test(lastChar)) {
        e.preventDefault();
        
        // Получаем позицию элемента для размещения меню
        const position = getMenuPosition(target);
        
        setBlockMenuPosition(position);
        setPendingBlockId(blockId);
        setShowBlockMenu(true);
      }
    }
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
    if (!selectedPage?.id || !hasUnsavedChanges) return;

    setIsManualSaving(true);
    try {
      const currentContent = convertBlocksToMarkdown(blocks);
      const updatedPage = {
        ...selectedPage,
        content: currentContent
      };

      // Обновляем контент
      onUpdateContent(currentContent);
      
      // Принудительно сохраняем
      if (onForceSave) {
        const saveResult = await onForceSave(updatedPage);
        if (saveResult) {
          setHasUnsavedChanges(false);
        }
      }
    } catch (error) {
      console.error('Ошибка при ручном сохранении:', error);
    } finally {
      setIsManualSaving(false);
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

  // Обработчик нажатия клавиши ? для показа справки
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
        const target = e.target as HTMLElement;
        // Только если НЕ в поле ввода или НЕ в редакторе документации
        const isInInputField = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
        const isInDocumentationEditor = target.closest('[data-documentation-editor]') !== null;
        
        if (!isInInputField || !isInDocumentationEditor) {
          e.preventDefault();
          setShowShortcutsHelp(true);
        }
      }
      
      // Закрытие меню по Escape
      if (e.key === 'Escape') {
        if (showBlockMenu) {
          setShowBlockMenu(false);
          setPendingBlockId(null);
        } else if (showShortcutsHelp) {
          setShowShortcutsHelp(false);
        } else if (showDeleteConfirm) {
          setShowDeleteConfirm(false);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showBlockMenu, showShortcutsHelp, showDeleteConfirm]);

  const renderToolbar = () => {
    if (!showToolbar) return null;

    return (
      <div 
        className="fixed z-50 bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700 px-2 py-1 flex items-center gap-1"
        style={{ 
          top: toolbarPosition.top, 
          left: toolbarPosition.left - 100,
          transform: 'translateY(-100%)'
        }}
      >
        <button
          onClick={() => handleShortcut('bold')}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          title="Жирный (Ctrl+B)"
        >
          <strong>B</strong>
        </button>
        <button
          onClick={() => handleShortcut('italic')}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded italic"
          title="Курсив (Ctrl+I)"
        >
          I
        </button>
        <button
          onClick={() => handleShortcut('underline')}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded underline"
          title="Подчеркивание (Ctrl+U)"
        >
          U
        </button>
        <button
          onClick={() => handleShortcut('strikethrough')}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded line-through"
          title="Зачеркивание"
        >
          S
        </button>
        <button
          onClick={() => handleShortcut('code')}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded font-mono text-xs"
          title="Код"
        >
          &lt;/&gt;
        </button>
        <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1"></div>
        <button
          onClick={() => performUndo()}
          disabled={undoStack.length === 0}
          className={`p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded ${undoStack.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
          title="Отменить (Ctrl+Z)"
        >
          ↶
        </button>
        <button
          onClick={() => performRedo()}
          disabled={redoStack.length === 0}
          className={`p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded ${redoStack.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
          title="Повторить (Ctrl+Shift+Z)"
        >
          ↷
        </button>
        <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1"></div>
        <button
          onClick={() => setShowLinkModal(true)}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-700 dark:text-gray-300"
          title="Добавить ссылку (Ctrl+K)"
        >
          🔗
        </button>
        <button
          onClick={() => setShowInternalLinkModal(true)}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-700 dark:text-gray-300"
          title="Внутренняя ссылка"
        >
          📄
        </button>
      </div>
    );
  };

  const renderBlock = (block: Block) => {
    const isActive = activeBlockId === block.id;

    return (
      <div key={block.id} className="group relative mb-4">
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
            onSlashCommand={handleSlashCommand}
            sections={sections}
          />
        </div>

        {/* Кнопки управления блоком */}
        {isActive && (
          <div className="absolute -left-12 top-0 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => addBlock('paragraph', block.id)}
              className="w-8 h-8 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded flex items-center justify-center text-xs"
              title="Добавить блок"
            >
              +
            </button>
            {blocks.length > 1 && (
              <button
                onClick={() => deleteBlock(block.id)}
                className="w-8 h-8 bg-red-100 dark:bg-red-900 hover:bg-red-200 dark:hover:bg-red-800 rounded flex items-center justify-center text-xs text-red-600 dark:text-red-400"
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
              className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700 p-2 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-105"
              title="Изменить тип блока (или нажмите /)"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-neutral-700 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
            Выберите страницу
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Кликните на страницу в левом меню, чтобы начать редактирование
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-900" data-documentation-editor="true">
      {/* Шапка редактора */}
      <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className={`w-2.5 h-2.5 rounded-full ${
              selectedPage.isPublished ? 'bg-green-500' : 'bg-yellow-500'
            }`} />
            <div className="flex-1 space-y-2">
              {/* Редактируемый заголовок */}
              <input
                type="text"
                value={selectedPage.title}
                onChange={(e) => {
                  // Обновляем локальное состояние немедленно
                  if (onUpdateTitle) {
                    onUpdateTitle(e.target.value);
                  }
                }}
                className="text-xl font-semibold text-gray-900 dark:text-white bg-transparent border-none outline-none w-full focus:ring-0 focus:bg-gray-50 dark:focus:bg-gray-800 rounded px-1 py-1"
                placeholder="Заголовок страницы..."
              />
              {/* Редактируемое описание */}
              <input
                type="text"
                value={selectedPage.description || ''}
                onChange={(e) => {
                  // Обновляем локальное состояние немедленно
                  if (onUpdateDescription) {
                    onUpdateDescription(e.target.value);
                  }
                }}
                className="text-sm text-gray-600 dark:text-gray-400 bg-transparent border-none outline-none w-full focus:ring-0 focus:bg-gray-50 dark:focus:bg-gray-800 rounded px-1 py-1"
                placeholder="Описание страницы (необязательно)..."
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Кнопка ручного сохранения */}
            <button
              onClick={handleManualSave}
              disabled={!hasUnsavedChanges || isManualSaving}
              className={`flex items-center gap-2 px-4 py-2 text-sm rounded-md transition-colors ${
                hasUnsavedChanges && !isManualSaving
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
              title={hasUnsavedChanges ? "Сохранить изменения" : "Нет изменений для сохранения"}
            >
              {isManualSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Сохранение...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Сохранить
                </>
              )}
            </button>

            {/* Индикатор статуса */}
            <div className="flex items-center gap-2 text-sm">
              {hasUnsavedChanges ? (
                <>
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  <span className="text-orange-600 dark:text-orange-400">Есть изменения</span>
                </>
              ) : (
                <>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-green-600 dark:text-green-400">Сохранено</span>
                </>
              )}
            </div>
            
            {/* Кнопка публикации/скрытия */}
            {onTogglePublication && (
              <button
                onClick={() => onTogglePublication(selectedPage.id)}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors ${
                  selectedPage.isPublished
                    ? 'text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-200 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                    : 'text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200 hover:bg-green-50 dark:hover:bg-green-900/20'
                }`}
                title={selectedPage.isPublished ? "Скрыть страницу" : "Опубликовать страницу"}
              >
                {selectedPage.isPublished ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                    Скрыть
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Опубликовать
                  </>
                )}
              </button>
            )}

            {/* Кнопка справки */}
            <button
              onClick={() => setShowShortcutsHelp(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md transition-colors"
              title="Горячие клавиши"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              ?
            </button>

            {onDeletePage && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                title="Удалить страницу"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Удалить
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Основной редактор */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div onMouseUp={handleTextSelection}>
            {blocks.map((block) => renderBlock(block))}
          </div>
          
          {/* Кнопка добавления нового блока */}
          <button
            onClick={() => addBlock('paragraph')}
            className="w-full mt-4 p-3 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            + Добавить блок
          </button>
        </div>
      </div>

      {/* Плавающая панель инструментов */}
      {renderToolbar()}

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

      {/* Новое улучшенное меню блоков */}
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

      {/* Компоненты горячих клавиш */}
      <KeyboardShortcuts onShortcut={handleShortcut} />
      <ShortcutsHelp 
        isOpen={showShortcutsHelp} 
        onClose={() => setShowShortcutsHelp(false)} 
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
}: {
  block: Block;
  isActive: boolean;
  onUpdate: (updates: Partial<Block>) => void;
  onTextSelection: () => void;
  onSlashCommand?: (e: React.KeyboardEvent, blockId: string) => void;
  sections?: DocumentationSection[];
}) {
  const updateContent = (content: string) => {
    onUpdate({ content });
  };

  const updateMetadata = (metadata: Partial<Block['metadata']>) => {
    onUpdate({ metadata: { ...block.metadata, ...metadata } });
  };

  const baseInputProps = {
    value: block.content,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => updateContent(e.target.value),
    onMouseUp: onTextSelection,
    onKeyDown: (e: React.KeyboardEvent) => onSlashCommand?.(e, block.id),
    className: "w-full bg-transparent border-none outline-none resize-none focus:ring-0"
  };

  switch (block.type) {
    case 'heading1':
      return (
        <input 
          {...baseInputProps}
          placeholder="Заголовок 1"
          className={`${baseInputProps.className} text-3xl font-bold text-gray-900 dark:text-white py-2`}
        />
      );

    case 'heading2':
      return (
        <input 
          {...baseInputProps}
          placeholder="Заголовок 2"
          className={`${baseInputProps.className} text-2xl font-semibold text-gray-900 dark:text-white py-2`}
        />
      );

    case 'heading3':
      return (
        <input 
          {...baseInputProps}
          placeholder="Заголовок 3"
          className={`${baseInputProps.className} text-xl font-medium text-gray-900 dark:text-white py-1`}
        />
      );

    case 'quote':
      return (
        <div className="border-l-4 border-gray-400 dark:border-gray-500 pl-4 bg-gray-50 dark:bg-gray-800/50 rounded-r-lg">
          <textarea 
            {...baseInputProps}
            placeholder="Цитата..."
            className={`${baseInputProps.className} text-gray-700 dark:text-gray-300 italic py-3 min-h-[80px]`}
          />
        </div>
      );

    case 'list':
      return (
        <div className="flex items-start gap-3">
          <span className="text-gray-400 mt-1">•</span>
          <textarea 
            {...baseInputProps}
            placeholder="Элемент списка..."
            className={`${baseInputProps.className} text-gray-900 dark:text-white flex-1 min-h-[24px]`}
          />
        </div>
      );

    case 'numbered-list':
      return (
        <div className="flex items-start gap-3">
          <span className="text-gray-400 mt-1">1.</span>
          <textarea 
            {...baseInputProps}
            placeholder="Элемент списка..."
            className={`${baseInputProps.className} text-gray-900 dark:text-white flex-1 min-h-[24px]`}
          />
        </div>
      );

    case 'code':
      return (
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg border">
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700">
            <select
              value={block.metadata?.language || 'text'}
              onChange={(e) => updateMetadata({ language: e.target.value })}
              className="text-sm bg-transparent border-none outline-none text-gray-600 dark:text-gray-400"
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
            {...baseInputProps}
            placeholder="Код..."
            className={`${baseInputProps.className} font-mono text-sm text-gray-900 dark:text-gray-100 p-4 min-h-[120px]`}
          />
        </div>
      );

    case 'image':
      return (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          {block.metadata?.url ? (
            <div>
              <img 
                src={block.metadata.url} 
                alt={block.metadata.alt || ''}
                className="max-w-full h-auto rounded-lg"
              />
              <input
                type="text"
                value={block.metadata.caption || ''}
                onChange={(e) => updateMetadata({ caption: e.target.value })}
                placeholder="Подпись к изображению (необязательно)"
                className="w-full mt-3 text-sm text-gray-600 dark:text-gray-400 bg-transparent border-none outline-none"
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
                <hr className="flex-1 border-gray-300 dark:border-gray-600" />
                <span className="text-xs text-gray-500 dark:text-gray-400">или</span>
                <hr className="flex-1 border-gray-300 dark:border-gray-600" />
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
                  className="w-full text-center bg-transparent border border-gray-300 dark:border-gray-600 rounded px-3 py-2 outline-none focus:border-gray-900 dark:focus:border-gray-300 text-gray-600 dark:text-gray-400"
                />
              </div>
            </div>
          )}
        </div>
      );

    case 'file':
      const getFileIcon = (fileName: string, fileType?: string) => {
        if (fileType?.startsWith('image/')) return '🖼';
        if (fileType?.includes('pdf')) return '📄';
        if (fileType?.includes('word') || fileType?.includes('document')) return '📝';
        if (fileType?.includes('excel') || fileType?.includes('spreadsheet')) return '📊';
        if (fileType?.includes('powerpoint') || fileType?.includes('presentation')) return '📽';
        if (fileType?.includes('zip') || fileType?.includes('rar') || fileType?.includes('7z')) return '🗜';
        if (fileType?.includes('audio')) return '🎵';
        if (fileType?.includes('video')) return '🎬';
        if (fileName?.endsWith('.txt')) return '📋';
        if (fileName?.endsWith('.json')) return '📋';
        if (fileName?.endsWith('.csv')) return '📊';
        return '📎';
      };

      return (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          {block.metadata?.url ? (
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-2xl">
                {getFileIcon(block.metadata.name || '', block.metadata.type)}
              </div>
              <div className="flex-1 min-w-0">
                <input
                  type="text"
                  value={block.metadata.name || ''}
                  onChange={(e) => updateMetadata({ name: e.target.value })}
                  placeholder="Название файла"
                  className="w-full font-medium text-gray-900 dark:text-white bg-transparent border-none outline-none"
                />
                {block.metadata.size && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Размер: {(block.metadata.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={block.metadata.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-200"
                  title="Открыть файл"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
                <button
                  onClick={() => updateMetadata({ url: '', name: '', size: undefined, type: undefined })}
                  className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
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
                <hr className="flex-1 border-gray-300 dark:border-gray-600" />
                <span className="text-xs text-gray-500 dark:text-gray-400">или</span>
                <hr className="flex-1 border-gray-300 dark:border-gray-600" />
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
              <div className="text-gray-400 mb-3 text-4xl">📺</div>
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
              <option value="info">💡 Информация</option>
              <option value="warning">⚠️ Предупреждение</option>
              <option value="error">❌ Ошибка</option>
              <option value="success">✅ Успех</option>
            </select>
          </div>
          <textarea 
            {...baseInputProps}
            placeholder="Содержимое выноски..."
            className={`${baseInputProps.className} min-h-[60px]`}
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
            {...baseInputProps}
            placeholder="Начните писать или введите / для команд..."
            className={`${baseInputProps.className} text-gray-900 dark:text-white min-h-[24px] leading-relaxed py-1`}
          />
          {!block.content && isActive && (
            <div className="absolute top-full left-0 mt-1 text-xs text-gray-400 dark:text-gray-500 pointer-events-none">
              Нажмите <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">/</kbd> для выбора типа блока
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
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Добавить ссылку</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Текст ссылки
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Введите текст ссылки"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="https://example.com"
            />
          </div>
        </div>
        
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
          >
            Отмена
          </button>
          <button
            onClick={() => onApply(url, title)}
            disabled={!url || !title}
            className="px-4 py-2 bg-gray-900 dark:bg-gray-200 text-white dark:text-gray-900 rounded-md hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
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
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-h-96">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Ссылка на страницу</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Текст ссылки
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Введите текст ссылки"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Поиск страниц
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-2"
              placeholder="Найти страницу..."
            />
            
            <div className="max-h-32 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md">
              {filteredPages.map(page => (
                <label key={page.id} className="flex items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                  <input
                    type="radio"
                    value={page.id}
                    checked={selectedPageId === page.id}
                    onChange={(e) => setSelectedPageId(e.target.value)}
                    className="mr-3"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{page.title}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{page.sectionName}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
          >
            Отмена
          </button>
          <button
            onClick={() => onApply(selectedPageId, title)}
            disabled={!selectedPageId || !title}
            className="px-4 py-2 bg-gray-900 dark:bg-gray-200 text-white dark:text-gray-900 rounded-md hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
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
