"use client";

import { useState, useEffect } from 'react';
import { X, Save, Plus } from 'lucide-react';
// import { useModal } from '@/hooks/useModal'; // Не используется

interface DepositSourceFormData {
  name: string;
  token: string;
  projectId: string;
  commission: number;
  isActive: boolean;
}

interface Project {
  id: string;
  name: string;
  status: string;
}

interface DepositSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: DepositSourceFormData) => Promise<void>;
  mode: 'create' | 'edit';
  initialData?: DepositSourceFormData & { id?: string };
}

export default function DepositSourceModal({
  isOpen,
  onClose,
  onSave,
  mode,
  initialData
}: DepositSourceModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [formData, setFormData] = useState<DepositSourceFormData>({
    name: '',
    token: '',
    projectId: '',
    commission: 20.0,
    isActive: true
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      loadProjects();
      initializeFormData();
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, initialData]);

  const loadProjects = async () => {
    try {
      const response = await fetch('/api/admin/finance/projects');
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
      }
    } catch (error) {
      console.error('Ошибка загрузки проектов:', error);
    }
  };

  const initializeFormData = () => {
    const defaultData: DepositSourceFormData = {
      name: '',
      token: '',
      projectId: '',
      commission: 20.0,
      isActive: true
    };

    setFormData(initialData ? { ...defaultData, ...initialData } : defaultData);
  };

  const handleInputChange = (field: keyof DepositSourceFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Ошибка сохранения:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const getTitle = () => {
    return mode === 'create' ? 'Новый источник' : 'Редактировать источник';
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 opacity-100"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg transform transition-all duration-300 scale-100 opacity-100">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-[#171717]/5 dark:border-[#ededed]/10">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[#171717]/5 dark:border-[#ededed]/10">
            <h3 className="text-lg font-semibold text-[#171717] dark:text-[#ededed] flex items-center gap-2">
              {mode === 'create' ? (
                <Plus className="w-5 h-5 text-[#2563eb]" />
              ) : (
                <Save className="w-5 h-5 text-[#2563eb]" />
              )}
              {getTitle()}
            </h3>
            <button
              onClick={onClose}
              className="text-[#171717]/60 dark:text-[#ededed]/60 hover:text-[#171717] dark:hover:text-[#ededed] transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#171717] dark:text-[#ededed] mb-2">
                  Название источника *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-[#171717]/20 dark:border-[#ededed]/20 rounded-md bg-white dark:bg-gray-800 text-[#171717] dark:text-[#ededed] focus:ring-2 focus:ring-[#2563eb] focus:border-transparent"
                  placeholder="Например: Основной источник"
                  required
                />

              </div>

              <div>
                <label className="block text-sm font-medium text-[#171717] dark:text-[#ededed] mb-2">
                  Токен *
                </label>
                <input
                  type="text"
                  value={formData.token}
                  onChange={(e) => handleInputChange('token', e.target.value)}
                  className="w-full px-3 py-2 border border-[#171717]/20 dark:border-[#ededed]/20 rounded-md bg-white dark:bg-gray-800 text-[#171717] dark:text-[#ededed] focus:ring-2 focus:ring-[#2563eb] focus:border-transparent font-mono text-sm"
                  placeholder="eyJhbGciOiJIUzI1NiIs..."
                  required
                />

              </div>

              <div>
                <label className="block text-sm font-medium text-[#171717] dark:text-[#ededed] mb-2">
                  Проект *
                </label>
                <select
                  value={formData.projectId}
                  onChange={(e) => handleInputChange('projectId', e.target.value)}
                  className="w-full px-3 py-2 border border-[#171717]/20 dark:border-[#ededed]/20 rounded-md bg-white dark:bg-gray-800 text-[#171717] dark:text-[#ededed] focus:ring-2 focus:ring-[#2563eb] focus:border-transparent"
                  required
                >
                  <option value="">Выберите проект</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name} ({project.status === 'ACTIVE' ? 'Активный' :
                                       project.status === 'COMPLETED' ? 'Завершен' :
                                       project.status === 'ON_HOLD' ? 'На паузе' : 'Отменен'})
                    </option>
                  ))}
                </select>

              </div>

              <div>
                <label className="block text-sm font-medium text-[#171717] dark:text-[#ededed] mb-2">
                  Комиссия (%) *
                </label>
                <input
                  type="number"
                  min="10"
                  max="30"
                  step="0.1"
                  value={formData.commission}
                  onChange={(e) => handleInputChange('commission', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-[#171717]/20 dark:border-[#ededed]/20 rounded-md bg-white dark:bg-gray-800 text-[#171717] dark:text-[#ededed] focus:ring-2 focus:ring-[#2563eb] focus:border-transparent"
                  placeholder="20.0"
                  required
                />

              </div>

              <div className="md:col-span-2">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => handleInputChange('isActive', e.target.checked)}
                    className="w-4 h-4 text-[#2563eb] bg-gray-100 border-gray-300 rounded focus:ring-[#2563eb] dark:focus:ring-[#60a5fa] dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-[#171717] dark:text-[#ededed]">
                    Активен
                  </label>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-6 border-t border-[#171717]/5 dark:border-[#ededed]/10 mt-6">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-[#171717]/80 dark:text-[#ededed]/80 bg-[#171717]/5 dark:bg-[#ededed]/5 hover:bg-[#171717]/10 dark:hover:bg-[#ededed]/10 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-[#2563eb] disabled:opacity-50"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-[#2563eb] hover:bg-[#1d4ed8] rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-[#2563eb] disabled:opacity-50 flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Сохранение...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {mode === 'create' ? 'Создать' : 'Сохранить'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
