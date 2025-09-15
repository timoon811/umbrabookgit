"use client";

import { useState, useEffect } from 'react';
import { ContentProject, ContentProjectType, CONTENT_PROJECT_TYPES } from '@/types/content';

interface ProjectSelectorProps {
  selectedProject: ContentProject | null;
  onProjectSelect: (project: ContentProject) => void;
  onCreateProject: () => void;
  onProjectDelete?: (projectId: string) => void;
}

export default function ProjectSelector({ 
  selectedProject, 
  onProjectSelect, 
  onCreateProject,
  onProjectDelete 
}: ProjectSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [projects, setProjects] = useState<ContentProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingProject, setDeletingProject] = useState<string | null>(null);

  // Загружаем список проектов
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/content-projects', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          setProjects(Array.isArray(data) ? data : []);
          
          // Если нет выбранного проекта, выбираем первый доступный
          if (!selectedProject && Array.isArray(data) && data.length > 0) {
            onProjectSelect(data[0]);
          }
        } else {
          console.error('❌ API вернул не JSON ответ');
          const errorText = await response.text();
          console.error('❌ Содержимое ответа:', errorText.substring(0, 500));
        }
      } else {
        const contentType = response.headers.get('content-type');
        let errorData;
        
        if (contentType && contentType.includes('application/json')) {
          errorData = await response.json();
          console.error('❌ Ошибка API (JSON):', response.status, errorData);
        } else {
          errorData = await response.text();
          console.error('❌ Ошибка API (HTML/Text):', response.status, errorData.substring(0, 200));
        }
      }
    } catch (error) {
      console.error('❌ Ошибка загрузки проектов:', error);
      // Предотвращаем падение компонента при ошибке сети
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (projectId: string, projectName: string) => {
    if (!onProjectDelete) return;
    
    if (!confirm(`Вы уверены, что хотите удалить проект "${projectName}"?`)) {
      return;
    }
    
    setDeletingProject(projectId);
    
    try {
      const response = await fetch(`/api/admin/content-projects/${projectId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        // Обновляем список проектов
        setProjects(prev => prev.filter(p => p.id !== projectId));
        
        // Если удаляемый проект был выбран, сбрасываем выбор
        if (selectedProject?.id === projectId) {
          const remainingProjects = projects.filter(p => p.id !== projectId);
          if (remainingProjects.length > 0) {
            onProjectSelect(remainingProjects[0]);
          } else {
            onProjectSelect(null as any);
          }
        }
        
        // Вызываем коллбек если предоставлен
        onProjectDelete(projectId);
        
      } else {
        const errorData = await response.json();
        alert(`Ошибка удаления проекта: ${errorData.error || 'Неизвестная ошибка'}`);
        console.error('❌ Ошибка удаления проекта:', errorData);
      }
    } catch (error) {
      console.error('❌ Ошибка удаления проекта:', error);
      alert('Произошла ошибка при удалении проекта');
    } finally {
      setDeletingProject(null);
    }
  };

  const getProjectTypeLabel = (type: string) => {
    return CONTENT_PROJECT_TYPES[type as ContentProjectType] || 'Контент';
  };

  const getProjectIcon = (type: string) => {
    switch (type) {
      case 'documentation':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'courses':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        );
      case 'materials':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
    }
  };

  return (
    <div className="relative">
      {/* Кнопка селектора */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-2.5 py-2 sm:px-3 sm:py-2.5 text-left bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gray-100 dark:bg-gray-900 rounded-lg flex items-center justify-center flex-shrink-0">
            {selectedProject ? getProjectIcon(selectedProject.type) : (
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">
              {selectedProject ? selectedProject.name : 'Выберите проект'}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {selectedProject ? getProjectTypeLabel(selectedProject.type) : 'Нет активного проекта'}
            </div>
          </div>
        </div>
        <svg 
          className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Выпадающее меню - улучшенная версия без скролла и описаний */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
          {loading ? (
            <div className="p-3 text-center text-gray-500 dark:text-gray-400 text-sm">
              Загрузка...
            </div>
          ) : (
            <>
              {/* Список проектов */}
              {projects.length > 0 ? (
                <>
                  <div className="px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                    Проекты
                  </div>
                  {projects.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => {
                        onProjectSelect(project);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors ${
                        selectedProject?.id === project.id 
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                          : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      <div className="flex-shrink-0 text-gray-500 dark:text-gray-400 w-4 h-4">
                        {getProjectIcon(project.type)}
                      </div>
                      <div className="font-medium truncate">{project.name}</div>
                      {selectedProject?.id === project.id && (
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0 ml-auto"></div>
                      )}
                    </button>
                  ))}
                </>
              ) : (
                <div className="px-3 py-4 text-center">
                  <div className="w-6 h-6 mx-auto mb-1.5 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-3 3z" />
                    </svg>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Проекты не найдены
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Overlay для закрытия */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
