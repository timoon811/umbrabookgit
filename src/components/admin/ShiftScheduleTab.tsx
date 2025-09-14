"use client";

import { useState, useEffect } from "react";

interface ShiftSetting {
  id: string;
  shiftType: 'MORNING' | 'DAY' | 'NIGHT';
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  timezone: string;
  isActive: boolean;
  name?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

interface EditingShift {
  id: string;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  name: string;
  description: string;
}

interface NewShift {
  shiftType: 'MORNING' | 'DAY' | 'NIGHT';
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  name: string;
  description: string;
}

export default function ShiftScheduleTab() {
  const [shiftSettings, setShiftSettings] = useState<ShiftSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingShift, setEditingShift] = useState<EditingShift | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newShift, setNewShift] = useState<NewShift>({
    shiftType: 'MORNING',
    startHour: 6,
    startMinute: 0,
    endHour: 14,
    endMinute: 0,
    name: '',
    description: ''
  });

  useEffect(() => {
    fetchShiftSettings();
  }, []);

  const fetchShiftSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/shift-settings');
      if (response.ok) {
        const data = await response.json();
        setShiftSettings(data.settings);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Ошибка загрузки настроек смен');
      }
    } catch (error) {
      setError('Ошибка сети');
    } finally {
      setLoading(false);
    }
  };

  const getShiftTypeLabel = (type: string) => {
    const labels = {
      'MORNING': 'Утренняя смена',
      'DAY': 'Дневная смена',
      'NIGHT': 'Ночная смена'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const formatTime = (hour: number, minute: number): string => {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  const formatTimeRange = (startHour: number, startMinute: number, endHour: number, endMinute: number): string => {
    const start = formatTime(startHour, startMinute);
    let end = formatTime(endHour, endMinute);
    
    // Если смена переходит через полночь
    if (endHour < startHour) {
      end += " (+1 день)";
    }
    
    return `${start} - ${end}`;
  };



  const saveEdit = async () => {
    if (!editingShift) return;

    try {
      setSaveLoading(true);
      const response = await fetch('/api/admin/shift-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingShift.id,
          updates: {
            startHour: editingShift.startHour,
            startMinute: editingShift.startMinute,
            endHour: editingShift.endHour,
            endMinute: editingShift.endMinute,
            name: editingShift.name,
            description: editingShift.description
          }
        }),
      });

      if (response.ok) {
        await fetchShiftSettings();
        setEditingShift(null);
        setShowEditModal(false);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Ошибка сохранения');
      }
    } catch (error) {
      setError('Ошибка сети');
    } finally {
      setSaveLoading(false);
    }
  };

  const startCreating = () => {
    setNewShift({
      shiftType: 'MORNING',
      startHour: 6,
      startMinute: 0,
      endHour: 14,
      endMinute: 0,
      name: '',
      description: ''
    });
    setShowCreateModal(true);
  };

  const cancelCreating = () => {
    setShowCreateModal(false);
  };

  const startEditing = (shift: ShiftSetting) => {
    setEditingShift({
      id: shift.id,
      startHour: shift.startHour,
      startMinute: shift.startMinute,
      endHour: shift.endHour,
      endMinute: shift.endMinute,
      name: shift.name || '',
      description: shift.description || ''
    });
    setShowEditModal(true);
  };

  const cancelEdit = () => {
    setEditingShift(null);
    setShowEditModal(false);
  };

  const saveNewShift = async () => {
    try {
      setSaveLoading(true);
      const response = await fetch('/api/admin/shift-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newShift),
      });

      if (response.ok) {
        await fetchShiftSettings();
        setShowCreateModal(false);
        setNewShift({
          shiftType: 'MORNING',
          startHour: 6,
          startMinute: 0,
          endHour: 14,
          endMinute: 0,
          name: '',
          description: ''
        });
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Ошибка создания смены');
      }
    } catch (error) {
      setError('Ошибка сети');
    } finally {
      setSaveLoading(false);
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">Загрузка настроек смен...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-red-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Ошибка загрузки настроек смен</h3>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
            <button 
              onClick={() => {
                setError(null);
                fetchShiftSettings();
              }}
              className="mt-2 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 underline"
            >
              Попробовать снова
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Настройки смен */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex justify-end mb-4">
          <button
            onClick={startCreating}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
            title="Добавить смену"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Добавить смену
          </button>
        </div>

        <div className="space-y-3">
          {shiftSettings.map((shift) => (
            <div
              key={shift.id}
              className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                      {shift.name || `${getShiftTypeLabel(shift.shiftType)}`}
                    </h4>
                    <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-full">
                      {getShiftTypeLabel(shift.shiftType)}
                    </span>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                      shift.isActive 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {shift.isActive ? 'Активна' : 'Неактивна'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-medium">{formatTime(shift.startHour, shift.startMinute)} - {formatTime(shift.endHour, shift.endMinute)}</span>
                    </div>
                    {shift.timezone && (
                      <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                        {shift.timezone}
                      </span>
                    )}
                  </div>
                  
                  {shift.description && (
                    <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/30 rounded px-2 py-1">
                      {shift.description}
                    </div>
                  )}
                </div>
                
                <button
                  onClick={() => startEditing(shift)}
                  className="ml-3 w-7 h-7 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-lg transition-colors flex items-center justify-center"
                  title="Редактировать смену"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Модальное окно создания смены */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-5 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Создание новой смены
              </h3>
              <button
                onClick={cancelCreating}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Тип смены
                  </label>
                  <select
                    value={newShift.shiftType}
                    onChange={(e) => setNewShift({ ...newShift, shiftType: e.target.value as 'MORNING' | 'DAY' | 'NIGHT' })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="MORNING">Утренняя смена</option>
                    <option value="DAY">Дневная смена</option>
                    <option value="NIGHT">Ночная смена</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Название
                  </label>
                  <input
                    type="text"
                    value={newShift.name}
                    onChange={(e) => setNewShift({ ...newShift, name: e.target.value })}
                    placeholder="Название смены"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Описание
                </label>
                <textarea
                  value={newShift.description}
                  onChange={(e) => setNewShift({ ...newShift, description: e.target.value })}
                  placeholder="Описание смены"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Время работы
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Начало</label>
                    <div className="grid grid-cols-2 gap-1">
                      <input
                        type="number"
                        min="0"
                        max="23"
                        value={newShift.startHour}
                        onChange={(e) => setNewShift({ ...newShift, startHour: parseInt(e.target.value) || 0 })}
                        className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm text-center"
                        placeholder="ЧЧ"
                      />
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={newShift.startMinute}
                        onChange={(e) => setNewShift({ ...newShift, startMinute: parseInt(e.target.value) || 0 })}
                        className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm text-center"
                        placeholder="ММ"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Конец</label>
                    <div className="grid grid-cols-2 gap-1">
                      <input
                        type="number"
                        min="0"
                        max="23"
                        value={newShift.endHour}
                        onChange={(e) => setNewShift({ ...newShift, endHour: parseInt(e.target.value) || 0 })}
                        className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm text-center"
                        placeholder="ЧЧ"
                      />
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={newShift.endMinute}
                        onChange={(e) => setNewShift({ ...newShift, endMinute: parseInt(e.target.value) || 0 })}
                        className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm text-center"
                        placeholder="ММ"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={cancelCreating}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md text-sm font-medium transition-colors"
                >
                  Отменить
                </button>
                <button
                  onClick={saveNewShift}
                  disabled={saveLoading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {saveLoading && (
                    <div className="w-4 h-4 animate-spin border-2 border-white border-t-transparent rounded-full"></div>
                  )}
                  {saveLoading ? 'Создание...' : 'Создать смену'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно редактирования смены */}
      {showEditModal && editingShift && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-5 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Редактирование смены
              </h3>
              <button
                onClick={cancelEdit}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Название
                  </label>
                  <input
                    type="text"
                    value={editingShift.name}
                    onChange={(e) => setEditingShift({ ...editingShift, name: e.target.value })}
                    placeholder="Название смены"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Описание
                  </label>
                  <textarea
                    value={editingShift.description}
                    onChange={(e) => setEditingShift({ ...editingShift, description: e.target.value })}
                    placeholder="Описание смены"
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Время работы
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Начало</label>
                    <div className="grid grid-cols-2 gap-1">
                      <input
                        type="number"
                        min="0"
                        max="23"
                        value={editingShift.startHour}
                        onChange={(e) => setEditingShift({ ...editingShift, startHour: parseInt(e.target.value) || 0 })}
                        className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm text-center"
                        placeholder="ЧЧ"
                      />
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={editingShift.startMinute}
                        onChange={(e) => setEditingShift({ ...editingShift, startMinute: parseInt(e.target.value) || 0 })}
                        className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm text-center"
                        placeholder="ММ"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Конец</label>
                    <div className="grid grid-cols-2 gap-1">
                      <input
                        type="number"
                        min="0"
                        max="23"
                        value={editingShift.endHour}
                        onChange={(e) => setEditingShift({ ...editingShift, endHour: parseInt(e.target.value) || 0 })}
                        className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm text-center"
                        placeholder="ЧЧ"
                      />
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={editingShift.endMinute}
                        onChange={(e) => setEditingShift({ ...editingShift, endMinute: parseInt(e.target.value) || 0 })}
                        className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm text-center"
                        placeholder="ММ"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={cancelEdit}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md text-sm font-medium transition-colors"
                >
                  Отменить
                </button>
                <button
                  onClick={saveEdit}
                  disabled={saveLoading}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {saveLoading && (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                    </svg>
                  )}
                  {saveLoading ? 'Сохранение...' : 'Сохранить изменения'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
