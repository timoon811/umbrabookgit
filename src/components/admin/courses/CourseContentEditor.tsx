"use client";

import { useMemo } from 'react';
import AdvancedContentEditor from '@/components/admin/documentation/AdvancedContentEditor';
import { DocumentationPage } from '@/types/documentation';
import { convertBlocksToMarkdown } from '@/lib/block-utils';

interface CoursePage {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  blocks: Block[] | null;
  sectionId: string;
  order: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface CourseContentEditorProps {
  selectedPage: CoursePage | null;
  onUpdateContent: (content: string) => void;
  onUpdateTitle?: (title: string) => void;
  onUpdateDescription?: (description: string) => void;
  onDeletePage?: (pageId: string) => void;
  onTogglePublication?: (pageId: string) => void;
  onForceSave?: (page: CoursePage) => Promise<boolean>;
  saving: boolean;
}

/**
 * Адаптер для использования AdvancedContentEditor в редакторе курсов
 * Преобразует данные курсов в формат документации
 */
export default function CourseContentEditor({
  selectedPage,
  onUpdateContent,
  onUpdateTitle,
  onUpdateDescription,
  onDeletePage,
  onTogglePublication,
  onForceSave,
  saving
}: CourseContentEditorProps) {
  // Преобразование страницы курса в формат страницы документации
  const documentationPage = useMemo((): DocumentationPage | null => {
    if (!selectedPage) return null;

    // Если есть блоки, конвертируем их в markdown
    let content = selectedPage.content || '';
    if (selectedPage.blocks && selectedPage.blocks.length > 0) {
      content = convertBlocksToMarkdown(selectedPage.blocks);
    }

    return {
      id: selectedPage.id,
      title: selectedPage.title,
      description: selectedPage.description || '',
      slug: `course-page-${selectedPage.id}`,
      content: content,
      sectionId: selectedPage.sectionId,
      order: selectedPage.order,
      isPublished: selectedPage.isPublished,
      parentId: null,
      createdAt: selectedPage.createdAt.toISOString(),
      updatedAt: selectedPage.updatedAt.toISOString()
    };
  }, [selectedPage]);

  // Адаптеры для обратных вызовов
  const handleUpdateContent = (content: string) => {
    onUpdateContent(content);
  };

  const handleUpdateTitle = (title: string) => {
    if (onUpdateTitle) {
      onUpdateTitle(title);
    }
  };

  const handleUpdateDescription = (description: string) => {
    if (onUpdateDescription) {
      onUpdateDescription(description);
    }
  };

  const handleDeletePage = (pageId: string) => {
    if (onDeletePage) {
      onDeletePage(pageId);
    }
  };

  const handleTogglePublication = (pageId: string) => {
    if (onTogglePublication) {
      onTogglePublication(pageId);
    }
  };

  const handleForceSave = async (page: DocumentationPage): Promise<boolean> => {
    if (onForceSave && selectedPage) {
      // Преобразуем обратно в формат курса
      const coursePage: CoursePage = {
        ...selectedPage,
        title: page.title,
        description: page.description,
        content: page.content,
        isPublished: page.isPublished
      };
      return await onForceSave(coursePage);
    }
    return false;
  };

  if (!documentationPage) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: 'var(--editor-bg)' }}>
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--editor-accent)' }}>
            <svg className="w-8 h-8" style={{ color: 'var(--editor-secondary-text)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <h3 className="text-xl font-medium mb-2" style={{ color: 'var(--editor-text)' }}>
            Выберите страницу курса
          </h3>
          <p style={{ color: 'var(--editor-secondary-text)' }}>
            Кликните на страницу в левой панели, чтобы начать редактирование
          </p>
        </div>
      </div>
    );
  }

  return (
    <AdvancedContentEditor
      selectedPage={documentationPage}
      onUpdateContent={handleUpdateContent}
      onUpdateTitle={handleUpdateTitle}
      onUpdateDescription={handleUpdateDescription}
      onDeletePage={handleDeletePage}
      onTogglePublication={handleTogglePublication}
      onForceSave={handleForceSave}
      saving={saving}
      sections={[]} // Курсы не используют разделы документации
    />
  );
}
