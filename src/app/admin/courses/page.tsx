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

import { CoursePage } from '@/hooks/useCoursesData';
import { useCoursesData } from '@/hooks/useCoursesData';
import { useCoursesActions } from '@/hooks/useCoursesActions';
import SortableSection from '@/components/admin/documentation/SortableSection';
import SectionItem from '@/components/admin/documentation/SectionItem';
import AdvancedContentEditor from '@/components/admin/documentation/AdvancedContentEditor';
import ToastContainer from '@/components/Toast';

export default function CoursesAdminPage() {
  const [selectedPage, setSelectedPage] = useState<CoursePage | null>(null);
  
  const { sections, setSections, loading, loadCourses } = useCoursesData();
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
  } = useCoursesActions({ sections, setSections, loadCourses });

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

  // Выбор страницы с сохранением предыдущей
  const handlePageSelect = async (page: CoursePage) => {
    if (selectedPage && selectedPage.id !== page.id) {
      try {
        const currentPageData = sections
          .flatMap(section => section.pages)
          .find(p => p.id === selectedPage.id);
        
        if (currentPageData) {
          const saveResult = await forceSave(currentPageData);
          if (!saveResult) {
            const confirmSwitch = confirm(
              'Не удалось сохранить изменения текущей страницы. Переключиться на другую страницу? Несохраненные изменения будут потеряны.'
            );
            if (!confirmSwitch) {
              return;
            }
          }
        }
      } catch (error) {
        console.error('Ошибка при сохранении перед переключением страницы:', error);
        const confirmSwitch = confirm(
          'Произошла ошибка при сохранении. Переключиться на другую страницу? Несохраненные изменения могут быть потеряны.'
        );
        if (!confirmSwitch) {
          return;
        }
      }
    }
    
    setSelectedPage(page);
  };

  // Мемоизированная версия выбранной страницы
  const memoizedSelectedPage = useMemo(() => {
    if (!selectedPage) return null;
    
    const currentPage = sections
      .flatMap(section => section.pages)
      .find(page => page.id === selectedPage.id);
    
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
      setSelectedPage(null);
    }
  };

  // Drag and drop обработка (аналогично документации)
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
          
          await fetch('/api/admin/courses', {
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

              await fetch('/api/admin/courses', {
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
        }
      }
    } catch (error) {
      console.error('Ошибка при перемещении:', error);
      setSections(originalSections);
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-base font-semibold text-gray-900 dark:text-white">
                      Курсы
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
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

          {/* Редактор курсов */}
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
