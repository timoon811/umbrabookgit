"use client";

import React, { useState, useEffect } from 'react';
import { Target, Plus, X, AlertCircle } from 'lucide-react';

interface GoalType {
  id: string;
  name: string;
  description?: string;
  unit: string;
  type: string;
  isActive: boolean;
}

interface GoalStage {
  id?: string;
  stage: number;
  targetValue: number;
  rewardAmount: number;
  title: string;
  description?: string;
  isActive?: boolean;
}

interface UserGoal {
  id: string;
  name: string;
  description?: string;
  goalTypeId: string;
  goalTypeName: string;
  goalTypeUnit: string;
  goalTypeType: string;
  periodType: string;
  isActive: boolean;
  stages: GoalStage[];
  createdAt: string;
  updatedAt: string;
}

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: UserGoal | null;
  goalTypes: GoalType[];
  onSave: (goalData: any) => void;
  isLoading: boolean;
}

export default function GoalModal({ isOpen, onClose, goal, goalTypes, onSave, isLoading }: GoalModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    goalTypeId: '',
    periodType: 'DAILY'
  });
  const [stages, setStages] = useState<GoalStage[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (goal) {
      setFormData({
        name: goal.name,
        description: goal.description || '',
        goalTypeId: goal.goalTypeId,
        periodType: goal.periodType
      });
      setStages(goal.stages.sort((a, b) => a.stage - b.stage));
    } else {
      setFormData({
        name: '',
        description: '',
        goalTypeId: goalTypes[0]?.id || '',
        periodType: 'DAILY'
      });
      setStages([
        {
          stage: 1,
          targetValue: 0,
          rewardAmount: 0,
          title: '',
          description: ''
        }
      ]);
    }
  }, [goal, goalTypes]);

  const selectedGoalType = goalTypes.find(gt => gt.id === formData.goalTypeId);

  const addStage = () => {
    const newStage: GoalStage = {
      stage: stages.length + 1,
      targetValue: 0,
      rewardAmount: 0,
      title: '',
      description: ''
    };
    setStages([...stages, newStage]);
  };

  const removeStage = (index: number) => {
    if (stages.length > 1) {
      const newStages = stages.filter((_, i) => i !== index);
      // Переиндексируем этапы
      const reindexedStages = newStages.map((stage, i) => ({
        ...stage,
        stage: i + 1
      }));
      setStages(reindexedStages);
    }
  };

  const updateStage = (index: number, field: keyof GoalStage, value: any) => {
    const newStages = [...stages];
    newStages[index] = { ...newStages[index], [field]: value };
    setStages(newStages);
  };

  const validateForm = () => {
    const newErrors: string[] = [];

    if (!formData.name.trim()) {
      newErrors.push('Название плана обязательно');
    }

    if (!formData.goalTypeId) {
      newErrors.push('Тип плана обязателен');
    }

    if (stages.length === 0) {
      newErrors.push('Должен быть хотя бы один этап');
    }

    stages.forEach((stage, index) => {
      if (!stage.title.trim()) {
        newErrors.push(`Этап ${index + 1}: название обязательно`);
      }
      if (stage.targetValue <= 0) {
        newErrors.push(`Этап ${index + 1}: целевое значение должно быть больше 0`);
      }
      if (stage.rewardAmount <= 0) {
        newErrors.push(`Этап ${index + 1}: сумма награды должна быть больше 0`);
      }
    });

    // Проверяем что целевые значения уникальны и идут по возрастанию
    const targetValues = stages.map(s => s.targetValue);
    const uniqueTargets = new Set(targetValues);
    if (uniqueTargets.size !== targetValues.length) {
      newErrors.push('Целевые значения этапов должны быть уникальными');
    }

    // Проверяем порядок по возрастанию
    for (let i = 1; i < stages.length; i++) {
      if (stages[i].targetValue <= stages[i - 1].targetValue) {
        newErrors.push('Целевые значения должны идти по возрастанию');
        break;
      }
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    const goalData = {
      ...formData,
      stages: stages.map((stage, index) => ({
        ...stage,
        stage: index + 1
      }))
    };

    onSave(goalData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-[#171717]/10 dark:border-[#ededed]/20 p-6 w-full max-w-4xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <Target className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-lg font-semibold text-[#171717] dark:text-[#ededed]">
              {goal ? 'Редактировать план' : 'Создать план'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errors.length > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-red-400 mr-3 mt-0.5" />
              <div>
                <h4 className="text-red-800 dark:text-red-200 font-medium mb-1">Ошибки заполнения:</h4>
                <ul className="text-red-700 dark:text-red-300 text-sm space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Основная информация */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#171717]/70 dark:text-[#ededed]/70 mb-2">
                Название плана *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-[#171717]/10 dark:border-[#ededed]/20 rounded-lg bg-white dark:bg-gray-800 text-[#171717] dark:text-[#ededed] focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Недельный план заработка"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#171717]/70 dark:text-[#ededed]/70 mb-2">
                Тип плана *
              </label>
              <select
                value={formData.goalTypeId}
                onChange={(e) => setFormData({ ...formData, goalTypeId: e.target.value })}
                className="w-full px-3 py-2 border border-[#171717]/10 dark:border-[#ededed]/20 rounded-lg bg-white dark:bg-gray-800 text-[#171717] dark:text-[#ededed] focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {goalTypes.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.name} ({type.unit})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#171717]/70 dark:text-[#ededed]/70 mb-2">
                Период *
              </label>
              <select
                value={formData.periodType}
                onChange={(e) => setFormData({ ...formData, periodType: e.target.value })}
                className="w-full px-3 py-2 border border-[#171717]/10 dark:border-[#ededed]/20 rounded-lg bg-white dark:bg-gray-800 text-[#171717] dark:text-[#ededed] focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="DAILY">Ежедневно</option>
                <option value="WEEKLY">Еженедельно</option>
                <option value="MONTHLY">Ежемесячно</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#171717]/70 dark:text-[#ededed]/70 mb-2">
                Описание
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-[#171717]/10 dark:border-[#ededed]/20 rounded-lg bg-white dark:bg-gray-800 text-[#171717] dark:text-[#ededed] focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Описание плана"
              />
            </div>
          </div>

          {/* Этапы плана */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-medium text-[#171717] dark:text-[#ededed]">
                Этапы плана ({stages.length})
              </h4>
              <button
                type="button"
                onClick={addStage}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Добавить этап
              </button>
            </div>

            <div className="space-y-4">
              {stages.map((stage, index) => (
                <div key={index} className="border border-[#171717]/10 dark:border-[#ededed]/20 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-medium text-[#171717] dark:text-[#ededed]">
                      Этап {index + 1}
                    </h5>
                    {stages.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeStage(index)}
                        className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-[#171717]/70 dark:text-[#ededed]/70 mb-1">
                        Название этапа *
                      </label>
                      <input
                        type="text"
                        value={stage.title}
                        onChange={(e) => updateStage(index, 'title', e.target.value)}
                        className="w-full px-2 py-1.5 text-sm border border-[#171717]/10 dark:border-[#ededed]/20 rounded bg-white dark:bg-gray-800 text-[#171717] dark:text-[#ededed] focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Старт"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#171717]/70 dark:text-[#ededed]/70 mb-1">
                        Цель ({selectedGoalType?.unit || ''}) *
                      </label>
                      <input
                        type="number"
                        value={stage.targetValue || ''}
                        onChange={(e) => updateStage(index, 'targetValue', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 text-sm border border-[#171717]/10 dark:border-[#ededed]/20 rounded bg-white dark:bg-gray-800 text-[#171717] dark:text-[#ededed] focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="100"
                        min="0"
                        step="1"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#171717]/70 dark:text-[#ededed]/70 mb-1">
                        Награда ($) *
                      </label>
                      <input
                        type="number"
                        value={stage.rewardAmount || ''}
                        onChange={(e) => updateStage(index, 'rewardAmount', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 text-sm border border-[#171717]/10 dark:border-[#ededed]/20 rounded bg-white dark:bg-gray-800 text-[#171717] dark:text-[#ededed] focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="10"
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#171717]/70 dark:text-[#ededed]/70 mb-1">
                        Описание
                      </label>
                      <input
                        type="text"
                        value={stage.description || ''}
                        onChange={(e) => updateStage(index, 'description', e.target.value)}
                        className="w-full px-2 py-1.5 text-sm border border-[#171717]/10 dark:border-[#ededed]/20 rounded bg-white dark:bg-gray-800 text-[#171717] dark:text-[#ededed] focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Первые 100$"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
              <p className="text-xs text-indigo-700 dark:text-indigo-300">
                <strong>Лесенка наград:</strong> Каждый этап дает дополнительную фиксированную награду при достижении. 
                Например: 100 депозитов = $5 + $15 + $35 = $55 общий бонус.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[#171717]/10 dark:border-[#ededed]/20">
          <button
            onClick={onClose}
            className="px-4 py-2 text-[#171717] dark:text-[#ededed] border border-[#171717]/20 dark:border-[#ededed]/20 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading && (
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            )}
            {goal ? 'Сохранить' : 'Создать план'}
          </button>
        </div>
      </div>
    </div>
  );
}
