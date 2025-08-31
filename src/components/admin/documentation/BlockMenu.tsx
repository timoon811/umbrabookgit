"use client";

import { useState, useEffect, useRef } from 'react';
import { Block } from './AdvancedContentEditor';

interface BlockMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectType: (type: string) => void;
  position: { top: number; left: number };
  currentBlockType?: string;
}

interface BlockType {
  type: string;
  title: string;
  description: string;
  icon: string;
  shortcut?: string;
  category: 'basic' | 'media' | 'structure' | 'advanced';
}

const blockTypes: BlockType[] = [
  // Basic
  { type: 'paragraph', title: 'Текст', description: 'Обычный абзац текста', icon: '¶', category: 'basic' },
  { type: 'heading1', title: 'Заголовок 1', description: 'Крупный заголовок раздела', icon: 'H1', shortcut: 'Ctrl+1', category: 'basic' },
  { type: 'heading2', title: 'Заголовок 2', description: 'Заголовок подраздела', icon: 'H2', shortcut: 'Ctrl+2', category: 'basic' },
  { type: 'heading3', title: 'Заголовок 3', description: 'Малый заголовок', icon: 'H3', shortcut: 'Ctrl+3', category: 'basic' },
  
  // Structure
  { type: 'list', title: 'Список', description: 'Маркированный список', icon: '•', category: 'structure' },
  { type: 'numbered-list', title: 'Нумерованный список', description: 'Пронумерованный список', icon: '1.', category: 'structure' },
  { type: 'quote', title: 'Цитата', description: 'Выделенная цитата', icon: '❝', category: 'structure' },
  { type: 'callout', title: 'Выноска', description: 'Важная информация', icon: '💡', category: 'structure' },
  { type: 'divider', title: 'Разделитель', description: 'Горизонтальная линия', icon: '—', category: 'structure' },
  
  // Media
  { type: 'image', title: 'Изображение', description: 'Картинка или фото', icon: '🖼', category: 'media' },
  { type: 'file', title: 'Файл', description: 'Документ, архив или другой файл', icon: '📎', category: 'media' },
  { type: 'youtube', title: 'YouTube', description: 'Видео с YouTube', icon: '📺', category: 'media' },
  
  // Advanced
  { type: 'code', title: 'Код', description: 'Блок кода с подсветкой', icon: '</>', category: 'advanced' },
];

const categoryNames = {
  basic: 'Основные',
  structure: 'Структура',
  media: 'Медиа',
  advanced: 'Продвинутые'
};

export default function BlockMenu({ isOpen, onClose, onSelectType, position, currentBlockType }: BlockMenuProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Фильтрация блоков по поисковому запросу
  const filteredBlocks = blockTypes.filter(block =>
    block.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    block.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Группировка по категориям
  const groupedBlocks = filteredBlocks.reduce((acc, block) => {
    if (!acc[block.category]) {
      acc[block.category] = [];
    }
    acc[block.category].push(block);
    return acc;
  }, {} as Record<string, BlockType[]>);

  // Обработка клавиш
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => (prev + 1) % filteredBlocks.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => (prev - 1 + filteredBlocks.length) % filteredBlocks.length);
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredBlocks[selectedIndex]) {
            onSelectType(filteredBlocks[selectedIndex].type);
            onClose();
          }
          break;
        case 'Tab':
          e.preventDefault();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredBlocks, onSelectType, onClose]);

  // Автофокус на поле поиска
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Закрытие при клике вне меню
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  // Сброс поиска при открытии
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white dark:bg-gray-800 shadow-2xl rounded-lg border border-gray-200 dark:border-gray-700 w-80 sm:w-96 max-h-96 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200"
      style={{
        top: position.top,
        left: position.left
      }}
    >
      {/* Поиск */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <input
            ref={searchInputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Поиск блоков..."
            className="w-full px-3 py-2 pl-8 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-300 focus:border-transparent outline-none"
          />
          <svg className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Список блоков */}
      <div className="max-h-80 overflow-y-auto">
        {filteredBlocks.length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            Блоки не найдены
          </div>
        ) : (
          Object.entries(groupedBlocks).map(([category, blocks]) => (
            <div key={category} className="py-2">
              <div className="px-3 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {categoryNames[category as keyof typeof categoryNames]}
              </div>
              {blocks.map((block, blockIndex) => {
                const globalIndex = filteredBlocks.findIndex(b => b.type === block.type);
                const isSelected = globalIndex === selectedIndex;
                const isCurrent = block.type === currentBlockType;
                
                return (
                  <button
                    key={block.type}
                    onClick={() => {
                      onSelectType(block.type);
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(globalIndex)}
                    className={`w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                      isSelected ? 'bg-gray-100 dark:bg-gray-700' : ''
                    } ${isCurrent ? 'bg-green-50 dark:bg-green-900/20' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded text-sm">
                        {block.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900 dark:text-white text-sm">
                            {block.title}
                            {isCurrent && <span className="ml-2 text-xs text-green-600 dark:text-green-400">• Текущий</span>}
                          </span>
                          {block.shortcut && (
                            <span className="text-xs text-gray-400 font-mono">
                              {block.shortcut}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {block.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ))
        )}
      </div>

      {/* Подсказки */}
      <div className="p-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>↑↓ навигация • Enter выбор</span>
          <span>Esc закрыть</span>
        </div>
      </div>
    </div>
  );
}

// Хук для определения позиции меню (для fixed позиционирования)
export function useBlockMenuPosition() {
  const getMenuPosition = (element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const menuWidth = window.innerWidth > 640 ? 384 : 320; // адаптивная ширина
    const menuHeight = 400; // примерная высота меню
    const padding = 16;
    
    // Используем координаты относительно viewport (для fixed позиционирования)
    let left = rect.left;
    let top = rect.bottom + 8;
    
    // Проверяем, помещается ли меню справа
    if (left + menuWidth > window.innerWidth - padding) {
      left = Math.max(padding, window.innerWidth - menuWidth - padding);
    }
    
    // Для мобильных устройств центрируем по горизонтали
    if (window.innerWidth < 640) {
      left = Math.max(padding, (window.innerWidth - menuWidth) / 2);
    }
    
    // Проверяем, помещается ли меню снизу
    if (top + menuHeight > window.innerHeight - padding) {
      // Показываем меню сверху от элемента
      top = Math.max(padding, rect.top - menuHeight - 8);
    }
    
    // Убеждаемся, что меню не выходит за верхний край
    if (top < padding) {
      top = padding;
    }
    
    // Убеждаемся, что меню не выходит за левый край
    if (left < padding) {
      left = padding;
    }
    
    return { top, left };
  };
  
  return { getMenuPosition };
}
