"use client";

import { useState, useEffect } from "react";
import { UserRole, Permission, RolePermissions, DEFAULT_ROLE_PERMISSIONS, ALL_PERMISSIONS, getAllRoles } from "@/types/roles";

interface SystemSettings {
  siteName: string;
  supportEmail: string;
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  maxFileSize: number;
  allowedFileTypes: string[];
}

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'roles'>('general');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Настройки системы
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    siteName: 'Umbra Platform',
    supportEmail: 'support@umbra.com',
    maintenanceMode: false,
    registrationEnabled: true,
    maxFileSize: 10,
    allowedFileTypes: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx']
  });

  // Роли и права
  const [rolePermissions, setRolePermissions] = useState<Record<UserRole, RolePermissions>>(DEFAULT_ROLE_PERMISSIONS);
  const [editingRole, setEditingRole] = useState<UserRole | null>(null);

  const handleSaveSystemSettings = async () => {
    setSaving(true);
    try {
      // В реальном проекте здесь был бы API вызов
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Настройки сохранены успешно!');
    } catch (error) {
      alert('Ошибка при сохранении настроек');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePermission = (role: UserRole, permission: Permission) => {
    setRolePermissions(prev => {
      const currentPermissions = prev[role].permissions;
      const hasPermission = currentPermissions.includes(permission);
      
      return {
        ...prev,
        [role]: {
          ...prev[role],
          permissions: hasPermission 
            ? currentPermissions.filter(p => p !== permission)
            : [...currentPermissions, permission]
        }
      };
    });
  };

  const handleSaveRolePermissions = async () => {
    setSaving(true);
    try {
      // В реальном проекте здесь был бы API вызов для сохранения прав ролей
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Права ролей сохранены успешно!');
    } catch (error) {
      alert('Ошибка при сохранении прав ролей');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateRoleDisplayName = (role: UserRole, newName: string) => {
    setRolePermissions(prev => ({
      ...prev,
      [role]: {
        ...prev[role],
        displayName: newName
      }
    }));
  };

  const handleUpdateRoleDescription = (role: UserRole, newDescription: string) => {
    setRolePermissions(prev => ({
      ...prev,
      [role]: {
        ...prev[role],
        description: newDescription
      }
    }));
  };

  // Группировка прав по категориям
  const permissionsByCategory = ALL_PERMISSIONS.reduce((acc, perm) => {
    if (!acc[perm.category]) {
      acc[perm.category] = [];
    }
    acc[perm.category].push(perm);
    return acc;
  }, {} as Record<string, typeof ALL_PERMISSIONS>);

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Настройки системы
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Управление системными настройками, ролями и правами доступа
          </p>
        </div>
      </div>

      {/* Табы */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('general')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'general'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Общие настройки
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'roles'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Роли и права
          </button>
        </nav>
      </div>

      {/* Общие настройки */}
      {activeTab === 'general' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Основные настройки
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Название сайта
              </label>
              <input
                type="text"
                value={systemSettings.siteName}
                onChange={(e) => setSystemSettings(prev => ({ ...prev, siteName: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email поддержки
              </label>
              <input
                type="email"
                value={systemSettings.supportEmail}
                onChange={(e) => setSystemSettings(prev => ({ ...prev, supportEmail: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Максимальный размер файла (МБ)
              </label>
              <input
                type="number"
                value={systemSettings.maxFileSize}
                onChange={(e) => setSystemSettings(prev => ({ ...prev, maxFileSize: parseInt(e.target.value) }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={systemSettings.maintenanceMode}
                  onChange={(e) => setSystemSettings(prev => ({ ...prev, maintenanceMode: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Режим обслуживания
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={systemSettings.registrationEnabled}
                  onChange={(e) => setSystemSettings(prev => ({ ...prev, registrationEnabled: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Разрешить регистрацию новых пользователей
                </span>
              </label>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSaveSystemSettings}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-md transition-colors"
              >
                {saving ? 'Сохранение...' : 'Сохранить настройки'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Роли и права */}
      {activeTab === 'roles' && (
        <div className="space-y-6">
          {/* Заголовок секции */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Управление ролями и правами
              </h2>
              <button
                onClick={handleSaveRolePermissions}
                disabled={saving}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-md transition-colors"
              >
                {saving ? 'Сохранение...' : 'Сохранить все изменения'}
              </button>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Настройте названия ролей и их права доступа к различным разделам системы.
            </p>
          </div>

          {/* Список ролей */}
          <div className="grid gap-6">
            {getAllRoles().map((role) => {
              const roleConfig = rolePermissions[role];
              const isEditing = editingRole === role;
              
              return (
                <div key={role} className="bg-white dark:bg-gray-800 rounded-lg shadow">
                  {/* Заголовок роли */}
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        {isEditing ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={roleConfig.displayName}
                              onChange={(e) => handleUpdateRoleDisplayName(role, e.target.value)}
                              className="block w-full px-3 py-2 text-lg font-semibold border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                            <textarea
                              value={roleConfig.description}
                              onChange={(e) => handleUpdateRoleDescription(role, e.target.value)}
                              rows={2}
                              className="block w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 resize-none"
                            />
                          </div>
                        ) : (
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {roleConfig.displayName}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {roleConfig.description}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded">
                                {role}
                              </span>
                              {roleConfig.isSystem && (
                                <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 px-2 py-1 rounded">
                                  Системная роль
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => setEditingRole(isEditing ? null : role)}
                        className="ml-4 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        {isEditing ? 'Готово' : 'Редактировать'}
                      </button>
                    </div>
                  </div>

                  {/* Права доступа */}
                  <div className="p-4">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                      Права доступа ({roleConfig.permissions.length} из {ALL_PERMISSIONS.length})
                    </h4>
                    
                    <div className="space-y-4">
                      {Object.entries(permissionsByCategory).map(([category, permissions]) => (
                        <div key={category}>
                          <h5 className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
                            {category}
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {permissions.map((perm) => {
                              const hasPermission = roleConfig.permissions.includes(perm.permission);
                              return (
                                <label key={perm.permission} className="flex items-start space-x-2 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={hasPermission}
                                    onChange={() => handleTogglePermission(role, perm.permission)}
                                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                      {perm.displayName}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      {perm.description}
                                    </div>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
