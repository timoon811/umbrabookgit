"use client";

import { useState, useEffect } from "react";
import { useModal } from "@/hooks/useModal";
import { getAllRoles, getRoleDisplayName } from "@/types/roles";
import type { UserRole } from "@/types/roles";
import EditProjectModal from "./EditProjectModal";

interface ContentProject {
  id: string;
  name: string;
  description?: string;
  type: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface ProjectPermission {
  projectId: string;
  projectName: string;
  allowedRoles: string[];
}

interface ProjectManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectsUpdate?: () => void;
}

export default function ProjectManagementModal({
  isOpen,
  onClose,
  onProjectsUpdate
}: ProjectManagementModalProps) {
  const [activeTab, setActiveTab] = useState<'projects' | 'permissions'>('projects');
  const [projects, setProjects] = useState<ContentProject[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [permissions, setPermissions] = useState<ProjectPermission[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Состояние для редактирования проекта
  const [editingProject, setEditingProject] = useState<ContentProject | null>(null);
  const [showEditProject, setShowEditProject] = useState(false);

  // Форма создания проекта
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    type: 'documentation'
  });

  // Загрузка данных при открытии модального окна
  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Загружаем проекты
      const projectsResponse = await fetch('/api/admin/content-projects');
      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json();
        setProjects(projectsData);
      }

      // Загружаем права доступа к проектам
      const permissionsResponse = await fetch('/api/admin/project-permissions');
      if (permissionsResponse.ok) {
        const permissionsData = await permissionsResponse.json();
        setPermissions(permissionsData);
      }

      // Загружаем пользователей для настройки прав
      const usersResponse = await fetch('/api/admin/users');
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData);
      }
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!newProject.name.trim()) return;

    setSaving(true);
    try {
      const response = await fetch('/api/admin/content-projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newProject),
      });

      if (response.ok) {
        const createdProject = await response.json();
        setProjects(prev => [...prev, createdProject]);
        setPermissions(prev => [...prev, {
          projectId: createdProject.id,
          projectName: createdProject.name,
          allowedRoles: ['ADMIN']
        }]);
        
        // Сбрасываем форму
        setNewProject({
          name: '',
          description: '',
          type: 'documentation'
        });

        if (onProjectsUpdate) {
          onProjectsUpdate();
        }
      } else {
        console.error('Ошибка создания проекта');
      }
    } catch (error) {
      console.error('Ошибка создания проекта:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProject = async (projectId: string, projectName: string) => {
    if (!confirm(`Вы уверены, что хотите удалить проект "${projectName}"?`)) {
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/content-projects/${projectId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setProjects(prev => prev.filter(p => p.id !== projectId));
        setPermissions(prev => prev.filter(p => p.projectId !== projectId));
        
        if (onProjectsUpdate) {
          onProjectsUpdate();
        }
      } else {
        console.error('Ошибка удаления проекта');
      }
    } catch (error) {
      console.error('Ошибка удаления проекта:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleEditProject = (project: ContentProject) => {
    setEditingProject(project);
    setShowEditProject(true);
  };

  const handleUpdateProject = async (projectData: { name: string; description?: string; type: string; isActive: boolean }) => {
    if (!editingProject) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/content-projects/${editingProject.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData),
      });

      if (response.ok) {
        const updatedProject = await response.json();
        setProjects(prev => prev.map(p => 
          p.id === editingProject.id ? updatedProject : p
        ));
        
        setShowEditProject(false);
        setEditingProject(null);

        if (onProjectsUpdate) {
          onProjectsUpdate();
        }
      } else {
        console.error('Ошибка обновления проекта');
      }
    } catch (error) {
      console.error('Ошибка обновления проекта:', error);
    } finally {
      setSaving(false);
    }
  };

  const handlePermissionChange = (projectId: string, role: string, allowed: boolean) => {
    setPermissions(prev => prev.map(perm => 
      perm.projectId === projectId
        ? {
            ...perm,
            allowedRoles: allowed 
              ? [...perm.allowedRoles, role]
              : perm.allowedRoles.filter(r => r !== role)
          }
        : perm
    ));
  };

  const handleSavePermissions = async () => {
    // Валидация на клиенте
    const validationErrors = [];
    
    // Проверяем, что каждый проект имеет хотя бы одну роль
    for (const permission of permissions) {
      if (!permission.allowedRoles || permission.allowedRoles.length === 0) {
        validationErrors.push(`Проект "${permission.projectName}" должен иметь хотя бы одну роль`);
      }
    }
    
    if (validationErrors.length > 0) {
      alert(`Ошибки валидации:\n${validationErrors.join('\n')}`);
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/admin/project-permissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ permissions }),
      });

      if (response.ok) {
        const result = await response.json();
        alert('Права доступа успешно сохранены');
        console.log('Сохраненные права:', result.savedPermissions);
        
        // Перезагружаем данные для подтверждения сохранения
        await loadData();
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.error || 'Неизвестная ошибка';
        alert(`Ошибка сохранения прав доступа: ${errorMessage}`);
        console.error('Детали ошибки:', errorData);
      }
    } catch (error) {
      console.error('Ошибка сохранения прав доступа:', error);
      alert('Произошла ошибка при сохранении прав доступа. Проверьте подключение к интернету.');
    } finally {
      setSaving(false);
    }
  };

  const getProjectTypeLabel = (type: string) => {
    switch (type) {
      case 'documentation': return 'Документация';
      case 'courses': return 'Курсы';
      case 'materials': return 'Материалы';
      default: return 'Контент';
    }
  };

  const getProjectIcon = (type: string) => {
    switch (type) {
      case 'documentation':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-3 3z" />
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-3 3z" />
          </svg>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
          
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Управление проектами
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-4" role="tablist">
              <button
                onClick={() => setActiveTab('projects')}
                className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'projects'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Проекты
              </button>
              <button
                onClick={() => setActiveTab('permissions')}
                className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'permissions'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Права доступа
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="p-4 overflow-y-auto max-h-[60vh]">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-4 border-gray-300 dark:border-gray-600 border-t-blue-500 rounded-full animate-spin mr-3"></div>
                <span className="text-gray-600 dark:text-gray-400">Загрузка...</span>
              </div>
            ) : (
              <>
                {/* Tab: Projects */}
                {activeTab === 'projects' && (
                  <div className="space-y-6">
                    {/* Create New Project */}
                    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                        Создать новый проект
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <input
                          type="text"
                          placeholder="Название проекта"
                          value={newProject.name}
                          onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))}
                          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white "
                        />
                        <select
                          value={newProject.type}
                          onChange={(e) => setNewProject(prev => ({ ...prev, type: e.target.value }))}
                          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white "
                        >
                          <option value="documentation">Документация</option>
                          <option value="courses">Курсы</option>
                          <option value="materials">Материалы</option>
                        </select>
                        <button
                          onClick={handleCreateProject}
                          disabled={!newProject.name.trim() || saving}
                          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm rounded-md transition-colors"
                        >
                          {saving ? 'Создаю...' : 'Создать'}
                        </button>
                      </div>
                      {newProject.description !== undefined && (
                        <input
                          type="text"
                          placeholder="Описание (необязательно)"
                          value={newProject.description}
                          onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                          className="mt-3 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white "
                        />
                      )}
                    </div>

                    {/* Projects List */}
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        Существующие проекты
                      </h3>
                      <div className="space-y-2">
                        {projects.map((project) => (
                          <div
                            key={project.id}
                            className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="text-gray-500 dark:text-gray-400">
                                {getProjectIcon(project.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-900 dark:text-white truncate">
                                  {project.name}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {getProjectTypeLabel(project.type)}
                                  {project.description && ` • ${project.description}`}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleEditProject(project)}
                                disabled={saving}
                                className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                                title="Редактировать проект"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDeleteProject(project.id, project.name)}
                                disabled={saving}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                                title="Удалить проект"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        ))}
                        {projects.length === 0 && (
                          <div className="text-center py-6 text-gray-500 dark:text-gray-400 text-sm">
                            Проекты не найдены
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab: Permissions */}
                {activeTab === 'permissions' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Настройте, какие роли пользователей имеют доступ к каждому проекту.
                      </div>
                      <button
                        onClick={handleSavePermissions}
                        disabled={saving}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm rounded-md transition-colors flex items-center gap-2"
                      >
                        {saving && (
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        )}
                        {saving ? 'Сохранение...' : 'Сохранить изменения'}
                      </button>
                    </div>
                    
                    {projects.length > 0 ? (
                      <div className="space-y-4">
                        {projects.map((project) => {
                          const projectPermissions = permissions.find(p => p.projectId === project.id);
                          return (
                            <div key={project.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="text-gray-500 dark:text-gray-400">
                                  {getProjectIcon(project.type)}
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900 dark:text-white">
                                    {project.name}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {getProjectTypeLabel(project.type)}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  Доступные роли:
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  {getAllRoles().map((role) => (
                                    <label key={role} className="flex items-center space-x-2">
                                      <input
                                        type="checkbox"
                                        checked={projectPermissions?.allowedRoles.includes(role) || false}
                                        onChange={(e) => handlePermissionChange(project.id, role, e.target.checked)}
                                        className="h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300 rounded"
                                      />
                                      <span className="text-sm text-gray-700 dark:text-gray-300">
                                        {getRoleDisplayName(role as UserRole)}
                                      </span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-gray-500 dark:text-gray-400 text-sm">
                        Создайте проекты для настройки прав доступа
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>
      
      {/* Модальное окно редактирования проекта */}
      <EditProjectModal
        isOpen={showEditProject}
        onClose={() => {
          setShowEditProject(false);
          setEditingProject(null);
        }}
        onSubmit={handleUpdateProject}
        project={editingProject}
      />
    </div>
  );
}
