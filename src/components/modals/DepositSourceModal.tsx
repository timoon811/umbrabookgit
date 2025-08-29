"use client";

import { useState, useEffect } from 'react';
import { X, Save, Plus } from 'lucide-react';
import { useModal } from '@/hooks/useModal';

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
    return mode === 'create' ? 'Новый источник депозитов' : 'Редактировать источник депозитов';
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
      <div className="relative w-full max-w-md transform transition-all duration-300 scale-100 opacity-100">
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
            <div className="space-y-4">
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
                <p className="text-xs text-[#171717]/50 dark:text-[#ededed]/50 mt-1">
                  Удобное название для идентификации источника
                </p>
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
                <p className="text-xs text-[#171717]/50 dark:text-[#ededed]/50 mt-1">
                  Токен из документации API для WebSocket подключения
                </p>
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
                <p className="text-xs text-[#171717]/50 dark:text-[#ededed]/50 mt-1">
                  Все депозиты с этого источника будут привязаны к выбранному проекту
                </p>
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
                <p className="text-xs text-[#171717]/50 dark:text-[#ededed]/50 mt-1">
                  Процент комиссии источника (от 10% до 30%). Эта комиссия будет вычитаться из каждого депозита.
                </p>
              </div>

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

              <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex">
                  <svg className="w-5 h-5 text-gray-400 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    <p className="font-medium">Важная информация:</p>
                    <ul className="mt-2 space-y-1">
                      <li>• После создания источника система автоматически подключится к WebSocket</li>
                      <li>• Все новые депозиты будут автоматически сохраняться в базу данных</li>
                      <li>• Указанная комиссия будет автоматически вычитаться из каждого депозита</li>
                      <li>• В системе будут отображаться обе суммы: грязная и чистая (за минусом комиссии)</li>
                      <li>• Можно отключить источник в любой момент</li>
                    </ul>
                  </div>
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
