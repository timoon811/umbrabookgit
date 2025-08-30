import { useCallback, useRef, useState } from 'react';
import { DocumentationPage, DocumentationSection } from '@/types/documentation';
import { useToast } from '@/components/Toast';

interface UseDocumentationActionsProps {
  sections: DocumentationSection[];
  setSections: (sections: DocumentationSection[]) => void;
  loadDocumentation: () => Promise<void>;
}

export function useDocumentationActions({ sections, setSections, loadDocumentation }: UseDocumentationActionsProps) {
  const [saving, setSaving] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { showSuccess, showError, showWarning } = useToast();

  // Умное обновление страницы в локальном состоянии (без перезагрузки)
  const updatePageInState = useCallback((updatedPage: DocumentationPage) => {
    setSections(currentSections => 
      currentSections.map(section => ({
        ...section,
        pages: section.pages.map(page => 
          page.id === updatedPage.id 
            ? { ...page, ...updatedPage, updatedAt: new Date().toISOString() }
            : page
        )
      }))
    );
  }, [setSections]);

  // Генерация системных названий
  const generateSystemPageName = (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return 'page1';
    
    let pageNumber = 1;
    while (section.pages.some(page => page.title === `page${pageNumber}`)) {
      pageNumber++;
    }
    return `page${pageNumber}`;
  };

  const generateSystemSlug = (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return 'page-1';
    
    let pageNumber = 1;
    while (section.pages.some(page => page.slug === `page-${pageNumber}`)) {
      pageNumber++;
    }
    return `page-${pageNumber}`;
  };

  const generateSystemSectionName = () => {
    let sectionNumber = 1;
    while (sections.some(section => section.name === `section${sectionNumber}`)) {
      sectionNumber++;
    }
    return `section${sectionNumber}`;
  };

  const generateSystemSectionKey = () => {
    let sectionNumber = 1;
    while (sections.some(section => section.key === `section-${sectionNumber}`)) {
      sectionNumber++;
    }
    return `section-${sectionNumber}`;
  };

  // Улучшенное автосохранение с надежной обработкой ошибок
  const autoSave = useCallback(async (page: DocumentationPage, fieldsToSave?: Partial<DocumentationPage>) => {
    if (!page.id) return; // Не сохраняем новые страницы автоматически
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        setSaving(true);
        
        // Определяем, какие поля сохранять
        const dataToSave = fieldsToSave || {
          title: page.title,
          description: page.description,
          content: page.content,
          isPublished: page.isPublished
        };
        
        const response = await fetch(`/api/admin/documentation/${page.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(dataToSave)
        });

        if (response.ok) {
          const updatedPage = await response.json();
          // Синхронизируем данные с сервером (особенно updatedAt)
          updatePageInState(updatedPage);
          
          // Очищаем localStorage backup после успешного сохранения
          try {
            localStorage.removeItem(`doc-backup-${page.id}`);
          } catch (error) {
            console.warn('Не удалось очистить backup из localStorage:', error);
          }
          
          // Показываем уведомление о успешном сохранении только для важных изменений
          if (fieldsToSave && Object.keys(fieldsToSave).some(key => key !== 'content')) {
            showSuccess('Изменения сохранены', 'Данные страницы успешно обновлены');
          }
          
          // Возвращаем true для успешного сохранения
          return true;
        } else {
          const errorData = await response.json();
          console.error('Ошибка при сохранении страницы:', errorData.error);
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
    }, 800); // Уменьшаем время до 800мс для более быстрого отклика
  }, [updatePageInState, showSuccess, showError, showWarning]);

  // Обработчик обновления контента только для локального состояния (без автосохранения)
  const handleUpdateContent = useCallback(async (content: string, page?: DocumentationPage | null) => {
    if (!page || !page.id) {
      console.warn('Нет выбранной страницы для обновления контента');
      return;
    }

    // Создаем обновленную страницу с новым контентом
    const updatedPage = { ...page, content };
    
    // Обновляем только локальное состояние, без отправки на сервер
    updatePageInState(updatedPage);
  }, [updatePageInState]);

  // Обработчик для обновления заголовков только локально
  const handleUpdateTitle = useCallback(async (title: string, page?: DocumentationPage | null) => {
    if (!page || !page.id) {
      console.warn('Нет выбранной страницы для обновления заголовка');
      return;
    }

    // Создаем обновленную страницу с новым заголовком
    const updatedPage = { ...page, title };
    
    // Обновляем только локальное состояние
    updatePageInState(updatedPage);
  }, [updatePageInState]);

  // Обработчик для обновления описания только локально
  const handleUpdateDescription = useCallback(async (description: string, page?: DocumentationPage | null) => {
    if (!page || !page.id) {
      console.warn('Нет выбранной страницы для обновления описания');
      return;
    }

    // Создаем обновленную страницу с новым описанием
    const updatedPage = { ...page, description };
    
    // Обновляем только локальное состояние
    updatePageInState(updatedPage);
  }, [updatePageInState]);

  // Создание новой страницы
  const handleCreatePage = async (sectionId: string): Promise<DocumentationPage | null> => {
    const systemName = generateSystemPageName(sectionId);
    const systemSlug = generateSystemSlug(sectionId);
    
    try {
      const response = await fetch('/api/admin/documentation', {
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
          order: sections.find(s => s.id === sectionId)?.pages.length || 0,
          isPublished: false
        })
      });

      if (response.ok) {
        const newPage = await response.json();
        await loadDocumentation();
        showSuccess('Страница создана', `Новая страница "${newPage.title}" успешно создана`);
        return newPage;
      } else {
        const errorData = await response.json();
        showError('Ошибка создания', errorData.error || 'Не удалось создать страницу');
      }
    } catch (error) {
      console.error('Ошибка создания страницы:', error);
    }
    return null;
  };

  // Удаление страницы
  const handleDeletePage = async (pageId: string) => {
    if (!pageId) return false;
    
    if (!confirm('Вы уверены, что хотите удалить эту страницу?')) return false;

    try {
      const response = await fetch(`/api/admin/documentation/${pageId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadDocumentation();
        return true;
      }
    } catch (error) {
      console.error('Ошибка удаления страницы:', error);
    }
    return false;
  };

  // Создание нового раздела
  const handleCreateSection = async () => {
    try {
      const systemName = generateSystemSectionName();
      const systemKey = generateSystemSectionKey();
      
      const response = await fetch('/api/admin/documentation/sections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: systemName,
          key: systemKey,
          description: `Автоматически созданный раздел ${systemName}`,
          order: sections.length
        })
      });

      if (response.ok) {
        await loadDocumentation();
      }
    } catch (error) {
      console.error('Ошибка создания раздела:', error);
    }
  };

  // Переименование раздела
  const handleUpdateSectionName = async (sectionId: string, newName: string) => {
    try {
      const response = await fetch(`/api/admin/documentation/sections/${sectionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newName
        })
      });

      if (response.ok) {
        await loadDocumentation();
      }
    } catch (error) {
      console.error('Ошибка обновления названия раздела:', error);
    }
  };

  // Переименование страницы без полной перезагрузки
  const handleUpdatePageName = async (pageId: string, newTitle: string) => {
    try {
      const response = await fetch(`/api/admin/documentation/${pageId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newTitle
        })
      });

      if (response.ok) {
        const updatedPage = await response.json();
        // Обновляем только эту страницу в локальном состоянии
        updatePageInState(updatedPage);
        return true;
      } else {
        const errorData = await response.json();
        console.error('Ошибка обновления названия страницы:', errorData.error);
      }
    } catch (error) {
      console.error('Ошибка обновления названия страницы:', error);
    }
    return false;
  };

  // Скрытие/показ раздела
  const handleToggleSectionVisibility = async (sectionId: string) => {
    try {
      const section = sections.find(s => s.id === sectionId);
      if (!section) return;

      const response = await fetch(`/api/admin/documentation/sections/${sectionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isVisible: !section.isVisible
        })
      });

      if (response.ok) {
        await loadDocumentation();
      }
    } catch (error) {
      console.error('Ошибка изменения видимости раздела:', error);
    }
  };

  // Переключение статуса публикации страницы без полной перезагрузки
  const handleTogglePagePublication = async (pageId: string) => {
    const page = sections.flatMap(s => s.pages).find(p => p.id === pageId);
    if (!page) return false;

    try {
      const response = await fetch(`/api/admin/documentation/${pageId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isPublished: !page.isPublished
        })
      });

      if (response.ok) {
        const updatedPage = await response.json();
        // Обновляем только эту страницу в локальном состоянии
        updatePageInState(updatedPage);
        return true;
      } else {
        const errorData = await response.json();
        console.error('Ошибка изменения статуса публикации:', errorData.error);
      }
    } catch (error) {
      console.error('Ошибка изменения статуса публикации:', error);
    }
    return false;
  };

  // Удаление раздела
  const handleDeleteSection = async (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;

    if (section.pages.length > 0) {
      alert('Нельзя удалить раздел, в котором есть страницы. Сначала удалите все страницы.');
      return;
    }

    if (!confirm('Вы уверены, что хотите удалить этот раздел?')) return;

    try {
      const response = await fetch(`/api/admin/documentation/sections/${sectionId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadDocumentation();
      }
    } catch (error) {
      console.error('Ошибка удаления раздела:', error);
    }
  };

  // Принудительное сохранение (для случаев смены страницы)
  const forceSave = useCallback(async (page: DocumentationPage) => {
    if (!page.id) return false;
    
    // Отменяем отложенное сохранение
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    try {
      setSaving(true);
      
      const response = await fetch(`/api/admin/documentation/${page.id}`, {
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

      if (response.ok) {
        const updatedPage = await response.json();
        updatePageInState(updatedPage);
        
        // Очищаем localStorage backup после успешного принудительного сохранения
        try {
          localStorage.removeItem(`doc-backup-${page.id}`);
        } catch (error) {
          console.warn('Не удалось очистить backup из localStorage:', error);
        }
        
        return true;
      } else {
        const errorData = await response.json();
        console.error('Ошибка при принудительном сохранении:', errorData.error);
        showError('Ошибка сохранения', errorData.error || 'Не удалось сохранить изменения');
        return false;
      }
    } catch (error) {
      console.error('Ошибка принудительного сохранения:', error);
      showWarning('Проблемы с сетью', 'Изменения могут быть потеряны. Проверьте подключение к интернету.');
      return false;
    } finally {
      setSaving(false);
    }
  }, [updatePageInState, showSuccess, showError, showWarning]);

  return {
    saving,
    autoSave,
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
