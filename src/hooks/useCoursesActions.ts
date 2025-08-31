import { useCallback, useRef, useState } from 'react';
import { CourseSection, CoursePage } from './useCoursesData';
import { useToast } from '@/components/Toast';

interface UseCoursesActionsProps {
  sections: CourseSection[];
  setSections: (sections: CourseSection[]) => void;
  loadCourses: () => Promise<void>;
}

export function useCoursesActions({ sections, setSections, loadCourses }: UseCoursesActionsProps) {
  const [saving, setSaving] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { showSuccess, showError, showWarning } = useToast();

  // Обновление страницы в состоянии
  const updatePageInState = useCallback((updatedPage: CoursePage) => {
    setSections(currentSections =>
      currentSections.map(section => ({
        ...section,
        pages: section.pages.map(page =>
          page.id === updatedPage.id ? updatedPage : page
        )
      }))
    );
  }, [setSections]);

  // Генерация системных названий (аналогично документации)
  const generateSystemPageName = (sectionId: string) => {
    const allPages = sections.flatMap(s => s.pages);
    
    let pageNumber = 1;
    while (allPages.some(page => page.title === `Урок ${pageNumber}`)) {
      pageNumber++;
    }
    return `Урок ${pageNumber}`;
  };

  const generateSystemSlug = (sectionId: string) => {
    const allPages = sections.flatMap(s => s.pages);
    
    let pageNumber = 1;
    while (allPages.some(page => page.slug === `lesson-${pageNumber}`)) {
      pageNumber++;
    }
    
    if (pageNumber > 1000) {
      return `lesson-${Date.now()}`;
    }
    
    return `lesson-${pageNumber}`;
  };

  const generateSystemSectionName = () => {
    let sectionNumber = 1;
    while (sections.some(section => section.name === `Раздел ${sectionNumber}`)) {
      sectionNumber++;
    }
    return `Раздел ${sectionNumber}`;
  };

  const generateSystemSectionKey = () => {
    let sectionNumber = 1;
    while (sections.some(section => section.key === `section-${sectionNumber}`)) {
      sectionNumber++;
    }
    return `section-${sectionNumber}`;
  };

  // Автосохранение (аналогично документации)
  const autoSave = useCallback(async (page: CoursePage, fieldsToSave?: Partial<CoursePage>) => {
    if (!page.id) return;
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        setSaving(true);
        
        const dataToSave = fieldsToSave || {
          title: page.title,
          description: page.description,
          content: page.content,
          isPublished: page.isPublished
        };
        
        const response = await fetch(`/api/admin/courses/pages/${page.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(dataToSave)
        });

        if (response.ok) {
          const updatedPage = await response.json();
          updatePageInState(updatedPage);
          
          if (fieldsToSave && Object.keys(fieldsToSave).some(key => key !== 'content')) {
            showSuccess('Изменения сохранены', 'Данные курса успешно обновлены');
          }
          
          return true;
        } else {
          const errorData = await response.json();
          console.error('Ошибка при сохранении курса:', errorData.error);
          showError('Ошибка сохранения', errorData.error || 'Не удалось сохранить изменения');
          return false;
        }
      } catch (error) {
        console.error('Ошибка автосохранения:', error);
        showWarning('Проблемы с сетью', 'Изменения могут быть потеряны. Проверьте подключение к интернету.');
        return false;
      } finally {
        setSaving(false);
      }
    }, 800);
  }, [updatePageInState, showSuccess, showError, showWarning]);

  // Обновление содержимого страницы
  const handleUpdateContent = useCallback(async (content: string, page?: CoursePage | null) => {
    if (!page) return;
    
    const updatedPage = { ...page, content };
    updatePageInState(updatedPage);
    autoSave(updatedPage, { content });
  }, [updatePageInState, autoSave]);

  // Обновление заголовка страницы
  const handleUpdateTitle = useCallback(async (title: string, page?: CoursePage | null) => {
    if (!page) return;
    
    const updatedPage = { ...page, title };
    updatePageInState(updatedPage);
    autoSave(updatedPage, { title });
  }, [updatePageInState, autoSave]);

  // Обновление описания страницы
  const handleUpdateDescription = useCallback(async (description: string, page?: CoursePage | null) => {
    if (!page) return;
    
    const updatedPage = { ...page, description };
    updatePageInState(updatedPage);
    autoSave(updatedPage, { description });
  }, [updatePageInState, autoSave]);

  // Принудительное сохранение
  const forceSave = async (page: CoursePage): Promise<boolean> => {
    try {
      const response = await fetch(`/api/admin/courses/pages/${page.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: page.title,
          description: page.description,
          content: page.content,
          isPublished: page.isPublished
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      return false;
    }
  };

  // Создание новой страницы курса
  const handleCreatePage = async (sectionId: string): Promise<CoursePage | null> => {
    const systemName = generateSystemPageName(sectionId);
    const systemSlug = generateSystemSlug(sectionId);
    const section = sections.find(s => s.id === sectionId);
    const pageCount = section?.pages.length || 0;
    
    try {
      const response = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: systemName,
          slug: systemSlug,
          description: '',
          content: '',
          sectionId: sectionId,
          order: pageCount,
          isPublished: false
        })
      });

      if (response.ok) {
        const newPage = await response.json();
        await loadCourses();
        return newPage;
      }
    } catch (error) {
      console.error('Ошибка создания страницы курса:', error);
    }
    return null;
  };

  // Удаление страницы курса (без подтверждения - подтверждение должно быть в UI)
  const handleDeletePage = async (pageId: string) => {
    if (!pageId) return false;

    try {
      const response = await fetch(`/api/admin/courses/pages/${pageId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadCourses();
        showSuccess('Страница удалена', 'Страница курса успешно удалена');
        return true;
      } else {
        const errorData = await response.json();
        showError('Ошибка удаления', errorData.error || 'Не удалось удалить страницу курса');
      }
    } catch (error) {
      console.error('Ошибка удаления страницы курса:', error);
      showError('Ошибка удаления', 'Произошла ошибка при удалении страницы курса');
    }
    return false;
  };

  // Переключение публикации страницы
  const handleTogglePagePublication = async (pageId: string) => {
    const page = sections.flatMap(s => s.pages).find(p => p.id === pageId);
    if (!page) return;

    try {
      const response = await fetch(`/api/admin/courses/pages/${pageId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isPublished: !page.isPublished
        })
      });

      if (response.ok) {
        const updatedPage = { ...page, isPublished: !page.isPublished };
        updatePageInState(updatedPage);
      }
    } catch (error) {
      console.error('Ошибка переключения публикации:', error);
    }
  };

  // Создание нового раздела курса
  const handleCreateSection = async () => {
    const sectionCount = sections.length;
    const systemName = `Раздел ${sectionCount + 1}`;
    const systemKey = `section-${sectionCount + 1}`;
    
    try {
      const response = await fetch('/api/admin/courses/sections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: systemName,
          key: systemKey,
          description: '',
          emoji: '📖',
          order: sectionCount,
          isVisible: true
        })
      });

      if (response.ok) {
        await loadCourses();
      }
    } catch (error) {
      console.error('Ошибка создания раздела курса:', error);
    }
  };

  // Обновление названия раздела
  const handleUpdateSectionName = async (sectionId: string, name: string) => {
    try {
      const response = await fetch(`/api/admin/courses/sections/${sectionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name })
      });

      if (response.ok) {
        await loadCourses();
      }
    } catch (error) {
      console.error('Ошибка обновления названия раздела:', error);
    }
  };

  // Обновление названия страницы
  const handleUpdatePageName = async (pageId: string, title: string) => {
    try {
      const response = await fetch(`/api/admin/courses/pages/${pageId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title })
      });

      if (response.ok) {
        await loadCourses();
      }
    } catch (error) {
      console.error('Ошибка обновления названия страницы:', error);
    }
  };

  // Переключение видимости раздела
  const handleToggleSectionVisibility = async (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;

    try {
      const response = await fetch(`/api/admin/courses/sections/${sectionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isVisible: !section.isVisible
        })
      });

      if (response.ok) {
        await loadCourses();
      }
    } catch (error) {
      console.error('Ошибка переключения видимости раздела:', error);
    }
  };

  // Удаление раздела
  const handleDeleteSection = async (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;

    if (section.pages.length > 0) {
      if (!confirm(`Раздел "${section.name}" содержит ${section.pages.length} страниц. Вы уверены, что хотите удалить его?`)) {
        return;
      }
    } else {
      if (!confirm(`Вы уверены, что хотите удалить раздел "${section.name}"?`)) {
        return;
      }
    }

    try {
      const response = await fetch(`/api/admin/courses/sections/${sectionId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadCourses();
      }
    } catch (error) {
      console.error('Ошибка удаления раздела:', error);
    }
  };

  return {
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
  };
}
