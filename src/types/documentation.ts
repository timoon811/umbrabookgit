export interface ContentProject {
  id: string;
  name: string;
  description?: string;
  type: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  documentationSections?: DocumentationSection[];
}

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
  projectId?: string;
  pages: DocumentationPage[];
  project?: ContentProject;
}

import { ReactNode } from 'react';

export interface SortableItemProps {
  id: string;
  children: ReactNode;
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
