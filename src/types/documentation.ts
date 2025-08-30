export interface DocumentationPage {
  id: string;
  title: string;
  description: string;
  slug: string;
  content: string;
  sectionId: string;
  order: number;
  isPublished: boolean;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentationSection {
  id: string;
  key: string;
  name: string;
  description: string;
  order: number;
  isVisible: boolean;
  pages: DocumentationPage[];
}

import React from 'react';

export interface SortableItemProps {
  id: string;
  children: React.ReactNode;
}

export interface SectionItemProps {
  section: DocumentationSection;
  onCreatePage: (sectionId: string) => void;
  onToggleSectionVisibility: (sectionId: string) => void;
  onUpdateSectionName: (sectionId: string, newName: string) => void;
  onUpdatePageName: (pageId: string, newTitle: string) => void;
  onDeleteSection: (sectionId: string) => void;
  selectedPage: DocumentationPage | null;
  onPageSelect: (page: DocumentationPage) => void;
}

export interface DocumentationEditorProps {
  selectedPage: DocumentationPage | null;
  onUpdatePage: (field: keyof DocumentationPage, value: string | boolean) => void;
  onDeletePage: () => void;
  saving: boolean;
}
