"use client";

import { useState, useMemo } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import { DocumentationPage } from '@/types/documentation';
import { useDocumentationData } from '@/hooks/useDocumentationData';
import { useDocumentationActions } from '@/hooks/useDocumentationActions';
import SortableSection from '@/components/admin/documentation/SortableSection';
import SectionItem from '@/components/admin/documentation/SectionItem';
import AdvancedContentEditor from '@/components/admin/documentation/AdvancedContentEditor';
import ToastContainer from '@/components/Toast';

export default function DocumentationAdminPage() {
  const [selectedPage, setSelectedPage] = useState<DocumentationPage | null>(null);
  
  const { sections, setSections, loading, loadDocumentation } = useDocumentationData();
  const {
    saving,
    forceSave,
    handleUpdateContent,
    handleUpdateTitle,
    handleUpdateDescription,
    handleCreatePage,
    handleDeletePage,
    handleTogglePagePublication,
    handleCreateSection,
    handleUpdateSectionName,
    handleUpdatePageName,
    handleToggleSectionVisibility,
    handleDeleteSection
  } = useDocumentationActions({ sections, setSections, loadDocumentation });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Улучшенный выбор страницы с надежным сохранением предыдущей
  const handlePageSelect = async (page: DocumentationPage) => {
    // Если есть выбранная страница и она отличается от новой
    if (selectedPage && selectedPage.id !== page.id) {
      try {
        // Принудительно сохраняем текущую страницу перед переключением
        const currentPageData = sections
          .flatMap(section => section.pages)
          .find(p => p.id === selectedPage.id);
        
        if (currentPageData) {
          const saveResult = await forceSave(currentPageData);
          if (!saveResult) {
            // Если сохранение не удалось, спрашиваем пользователя
            const confirmSwitch = confirm(
              'Не удалось сохранить изменения текущей страницы. Переключиться на другую страницу? Несохраненные изменения будут потеряны.'
            );
            if (!confirmSwitch) {
              return; // Отменяем переключение
            }
          }
        }
      } catch (error) {
        console.error('Ошибка при сохранении перед переключением страницы:', error);
        const confirmSwitch = confirm(
          'Произошла ошибка при сохранении. Переключиться на другую страницу? Несохраненные изменения могут быть потеряны.'
        );
        if (!confirmSwitch) {
          return; // Отменяем переключение
        }
      }
    }
    
    // Переключаемся на новую страницу
    setSelectedPage(page);
  };

  // Мемоизированная версия выбранной страницы для передачи в редактор
  const memoizedSelectedPage = useMemo(() => {
    if (!selectedPage) return null;
    
    // Находим актуальную версию страницы в sections
    const currentPage = sections
      .flatMap(section => section.pages)
      .find(page => page.id === selectedPage.id);
    
    // Возвращаем текущую версию или оригинальную, если не найдена
    return currentPage || selectedPage;
  }, [selectedPage, sections]);

  // Создание новой страницы с автовыбором
  const handleCreatePageAndSelect = async (sectionId: string) => {
    const newPage = await handleCreatePage(sectionId);
    if (newPage) {
      setSelectedPage(newPage);
    }
  };

  // Удаление страницы с очисткой выбора
  const handleDeletePageAndClear = async (pageId: string) => {
    const success = await handleDeletePage(pageId);
    if (success) {
      setSelectedPage(null); // Очищаем выбранную страницу после удаления
    }
  };





  // Drag and drop с улучшенной обработкой ошибок
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;

    // Сохраняем текущее состояние для возможного отката
    const originalSections = [...sections];

    try {
      // Перемещение разделов
      if (active.id.toString().startsWith('section-') && over.id.toString().startsWith('section-')) {
        const activeIndex = sections.findIndex(s => `section-${s.id}` === active.id);
        const overIndex = sections.findIndex(s => `section-${s.id}` === over.id);
        
        if (activeIndex !== -1 && overIndex !== -1) {
          const newSections = [...sections];
          const [removed] = newSections.splice(activeIndex, 1);
          newSections.splice(overIndex, 0, removed);
          
          setSections(newSections);
          
          await fetch('/api/admin/documentation', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: 'sections',
              sections: newSections.map((section, index) => ({
                id: section.id,
                order: index,
                pages: section.pages.map((page, pageIndex) => ({
                  id: page.id,
                  order: pageIndex,
                  sectionId: section.id
                }))
              }))
            })
          });
        }
      }
      // Перемещение страниц
      else if (active.id.toString().startsWith('page-')) {
        const activePage = sections.flatMap(s => s.pages).find(p => `page-${p.id}` === active.id);
        if (!activePage) return;

        // Перемещение внутри того же раздела
        if (over.id.toString().startsWith('page-')) {
          const overPage = sections.flatMap(s => s.pages).find(p => `page-${p.id}` === over.id);
          if (!overPage) return;

          // Если в том же разделе
          if (activePage.sectionId === overPage.sectionId) {
            const section = sections.find(s => s.id === activePage.sectionId);
            if (!section) return;

            const activeIndex = section.pages.findIndex(p => p.id === activePage.id);
            const overIndex = section.pages.findIndex(p => p.id === overPage.id);

            if (activeIndex !== -1 && overIndex !== -1) {
              const newPages = [...section.pages];
              const [removed] = newPages.splice(activeIndex, 1);
              newPages.splice(overIndex, 0, removed);

              const newSections = sections.map(s => 
                s.id === section.id 
                  ? { ...s, pages: newPages.map((page, index) => ({ ...page, order: index })) }
                  : s
              );

              setSections(newSections);

              await fetch('/api/admin/documentation', {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  type: 'pages',
                  sectionId: section.id,
                  pages: newPages.map((page, index) => ({
                    id: page.id,
                    order: index,
                    sectionId: section.id
                  }))
                })
              });
            }
          }
          // Перемещение в другой раздел
          else {
            const targetSection = sections.find(s => s.id === overPage.sectionId);
            if (!targetSection) return;

            const sourceSection = sections.find(s => s.id === activePage.sectionId);
            if (!sourceSection) return;

            const targetIndex = targetSection.pages.findIndex(p => p.id === overPage.id);
            
            const newSections = sections.map(s => {
              if (s.id === sourceSection.id) {
                return {
                  ...s,
                  pages: s.pages.filter(p => p.id !== activePage.id).map((page, index) => ({ ...page, order: index }))
                };
              } else if (s.id === targetSection.id) {
                const newPages = [...s.pages];
                newPages.splice(targetIndex, 0, { ...activePage, sectionId: s.id });
                return {
                  ...s,
                  pages: newPages.map((page, index) => ({ ...page, order: index }))
                };
              }
              return s;
            });

            setSections(newSections);

            await fetch(`/api/admin/documentation/${activePage.id}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                sectionId: targetSection.id,
                order: targetIndex
              })
            });
          }
        }
        // Перемещение страницы в раздел (в конец)
        else if (over.id.toString().startsWith('section-')) {
          const targetSectionId = over.id.toString().replace('section-', '');
          const targetSection = sections.find(s => s.id === targetSectionId);
          
          if (!targetSection || targetSection.id === activePage.sectionId) return;

          const sourceSection = sections.find(s => s.id === activePage.sectionId);
          if (!sourceSection) return;

          const newSections = sections.map(s => {
            if (s.id === sourceSection.id) {
              return {
                ...s,
                pages: s.pages.filter(p => p.id !== activePage.id).map((page, index) => ({ ...page, order: index }))
              };
            } else if (s.id === targetSection.id) {
              return {
                ...s,
                pages: [...s.pages, { ...activePage, sectionId: s.id, order: s.pages.length }]
              };
            }
            return s;
          });

          setSections(newSections);

          await fetch(`/api/admin/documentation/${activePage.id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              sectionId: targetSection.id,
              order: targetSection.pages.length
            })
          });
        }
      }
    } catch (error) {
      console.error('Ошибка перемещения:', error);
      // Откатываем изменения при ошибке
      setSections(originalSections);
      // В случае критической ошибки, перезагружаем данные
      setTimeout(() => loadDocumentation(), 1000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-6 h-6 border-4 border-gray-300 dark:border-gray-600 border-t-gray-900 dark:border-t-white rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex h-screen">
          {/* Боковая панель */}
          <div className="w-72 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
            {/* Заголовок */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gray-100 dark:bg-[#0a0a0a] rounded flex items-center justify-center">
                    <svg className="w-4 h-4 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-base font-semibold text-gray-900 dark:text-white">
                      Документация
                    </h1>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {sections.length} разделов
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCreateSection}
                  className="bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 p-1.5 rounded transition-colors"
                  title="Создать раздел"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Список разделов */}
            <div className="flex-1 overflow-y-auto p-3">
              {sections.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-10 h-10 mx-auto mb-3 bg-gray-100 dark:bg-[#0a0a0a] rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-3 text-sm">
                    Нет разделов
                  </p>
                  <button
                    onClick={handleCreateSection}
                    className="bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 px-3 py-1.5 rounded transition-colors text-sm"
                  >
                    Создать раздел
                  </button>
                </div>
              ) : (
                <SortableContext items={sections.map(s => `section-${s.id}`)} strategy={verticalListSortingStrategy}>
                  <div>
                    {sections.map((section) => (
                      <SortableSection key={section.id} section={section}>
                        <SectionItem
                          section={section}
                          onCreatePage={handleCreatePageAndSelect}
                          onToggleSectionVisibility={handleToggleSectionVisibility}
                          onUpdateSectionName={handleUpdateSectionName}
                          onUpdatePageName={handleUpdatePageName}
                          onDeleteSection={handleDeleteSection}
                          selectedPage={selectedPage}
                          onPageSelect={handlePageSelect}
                        />
                      </SortableSection>
                    ))}
                  </div>
                </SortableContext>
              )}
            </div>
          </div>

          {/* Расширенный редактор документации */}
          <AdvancedContentEditor
            selectedPage={memoizedSelectedPage}
            onUpdateContent={(content) => handleUpdateContent(content, selectedPage || undefined)}
            onUpdateTitle={(title: string) => handleUpdateTitle(title, selectedPage || undefined)}
            onUpdateDescription={(description: string) => handleUpdateDescription(description, selectedPage || undefined)}
            onDeletePage={handleDeletePageAndClear}
            onTogglePublication={handleTogglePagePublication}
            onForceSave={forceSave}
            saving={saving}
            sections={sections}
          />
        </div>
      </div>
      <ToastContainer />
    </DndContext>
  );
}
