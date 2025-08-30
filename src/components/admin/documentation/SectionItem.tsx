import { useState, useEffect, useRef } from "react";
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { DocumentationSection, DocumentationPage, SectionItemProps } from '@/types/documentation';
import SortablePage from './SortablePage';

export default function SectionItem({
  section,
  onCreatePage,
  onToggleSectionVisibility,
  onUpdateSectionName,
  onUpdatePageName,
  onDeleteSection,
  selectedPage,
  onPageSelect
}: SectionItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(section.name);
  const [showMenu, setShowMenu] = useState(false);
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [pageEditName, setPageEditName] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);
  const pageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    if (editingPageId && pageInputRef.current) {
      pageInputRef.current.focus();
      pageInputRef.current.select();
    }
  }, [editingPageId]);

  const handleSaveName = async () => {
    if (editName.trim() && editName.trim() !== section.name) {
      await onUpdateSectionName(section.id, editName.trim());
    }
    setIsEditing(false);
    setShowMenu(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveName();
    } else if (e.key === 'Escape') {
      setEditName(section.name);
      setIsEditing(false);
      setShowMenu(false);
    }
  };

  const handleStartPageEdit = (page: DocumentationPage) => {
    setEditingPageId(page.id);
    setPageEditName(page.title);
  };

  const handleSavePageName = async () => {
    if (editingPageId && pageEditName.trim() && pageEditName.trim() !== section.pages.find(p => p.id === editingPageId)?.title) {
      await onUpdatePageName(editingPageId, pageEditName.trim());
    }
    setEditingPageId(null);
    setPageEditName('');
  };

  const handlePageKeyDown = (e: React.KeyboardEvent) => {
    // ДЕБАГ: Логируем все нажатия клавиш в поле редактирования страницы
    console.log('🔍 SectionItem handlePageKeyDown:', {
      key: e.key,
      keyCode: e.keyCode,
      target: (e.target as HTMLElement).tagName,
      value: (e.target as HTMLInputElement).value,
      editingPageId,
      pageEditName
    });
    
    if (e.key === 'Enter') {
      handleSavePageName();
    } else if (e.key === 'Escape') {
      const page = section.pages.find(p => p.id === editingPageId);
      setPageEditName(page?.title || '');
      setEditingPageId(null);
    }
  };

  return (
    <div className="mb-3 group relative">
      {/* Заголовок раздела */}
      <div className="flex items-center justify-between py-1 px-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${section.isVisible ? 'bg-green-500' : 'bg-gray-400'}`} />
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleSaveName}
              onKeyDown={handleKeyDown}
              className="flex-1 px-1 py-0 text-sm font-medium bg-white dark:bg-gray-800 border border-gray-400 dark:border-gray-500 rounded focus:outline-none"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <h3 
              className="font-medium text-gray-900 dark:text-white text-sm truncate cursor-pointer hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              onDoubleClick={() => setIsEditing(true)}
            >
              {section.name}
            </h3>
          )}
          <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-xs">
            {section.pages.length}
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCreatePage(section.id);
            }}
            className="text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors opacity-0 group-hover:opacity-100"
            title="Добавить страницу"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors opacity-0 group-hover:opacity-100"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01" />
              </svg>
            </button>
            
            {showMenu && (
              <div className="absolute right-0 top-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 min-w-[140px]">
                <button
                  onClick={() => setIsEditing(true)}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 first:rounded-t-lg"
                >
                  Переименовать
                </button>
                <button
                  onClick={() => onToggleSectionVisibility(section.id)}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {section.isVisible ? 'Скрыть' : 'Показать'}
                </button>
                <button
                  onClick={() => onDeleteSection(section.id)}
                  className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 last:rounded-b-lg"
                >
                  Удалить раздел
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Список страниц */}
      {section.pages.length > 0 && (
        <SortableContext items={section.pages.map(p => `page-${p.id}`)} strategy={verticalListSortingStrategy}>
          <div className="ml-4 space-y-1">
            {section.pages.map((page) => (
              <SortablePage
                key={page.id}
                page={page}
                onClick={() => onPageSelect(page)}
              >
                <div className={`px-2 py-1.5 rounded hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${
                  selectedPage?.id === page.id 
                    ? 'bg-gray-100 dark:bg-gray-700 border-l-2 border-gray-500' 
                    : ''
                }`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-1 h-1 rounded-full flex-shrink-0 ${page.isPublished ? 'bg-green-500' : 'bg-yellow-500'}`} />
                    {editingPageId === page.id ? (
                      <input
                        ref={pageInputRef}
                        type="text"
                        value={pageEditName}
                        onChange={(e) => setPageEditName(e.target.value)}
                        onBlur={handleSavePageName}
                        onKeyDown={handlePageKeyDown}
                        className="flex-1 min-w-0 px-1 py-0 text-sm bg-white dark:bg-gray-800 border border-gray-400 dark:border-gray-500 rounded focus:outline-none"
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span 
                        className="flex-1 truncate min-w-0 text-sm text-gray-900 dark:text-white cursor-pointer"
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          handleStartPageEdit(page);
                        }}
                      >
                        {page.title}
                      </span>
                    )}
                  </div>
                </div>
              </SortablePage>
            ))}
          </div>
        </SortableContext>
      )}
    </div>
  );
}
