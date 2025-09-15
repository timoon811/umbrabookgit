/**
 * Типы для работы с контентными проектами
 */

export interface ContentProject {
  id: string;
  name: string;
  description?: string | null;
  type: ContentProjectType;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ContentProjectType = 'documentation' | 'courses' | 'materials';

export const CONTENT_PROJECT_TYPES: Record<ContentProjectType, string> = {
  documentation: 'Документация',
  courses: 'Курсы',
  materials: 'Материалы',
} as const;

export interface ContentProjectPermission {
  id: string;
  projectId: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

// Интерфейсы для API ответов
export interface ContentProjectResponse {
  projects: ContentProject[];
  total: number;
}

export interface ContentProjectCreateRequest {
  name: string;
  description?: string;
  type: ContentProjectType;
}

export interface ContentProjectUpdateRequest {
  name?: string;
  description?: string;
  type?: ContentProjectType;
  isActive?: boolean;
}
