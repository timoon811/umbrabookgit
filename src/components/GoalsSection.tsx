"use client";

import React, { useState, useEffect } from 'react';
import { Target, Trophy, Star, Clock, DollarSign, TrendingUp } from 'lucide-react';

interface GoalStage {
  id: string;
  stage: number;
  targetValue: number;
  rewardAmount: number;
  title: string;
  description?: string;
  isCompleted?: boolean;
}

interface Goal {
  id: string;
  name: string;
  description?: string;
  goalTypeName: string;
  goalTypeUnit: string;
  goalTypeType: string;
  periodType: string;
  currentValue: number;
  totalStages: number;
  completedStages: number;
  totalReward: number;
  isCompleted: boolean;
  stages: GoalStage[];
  nextStage?: GoalStage;
}

interface Progress {
  today: {
    earnings: number;
    deposits: number;
    hours: number;
  };
  week: {
    earnings: number;
    deposits: number;
    hours: number;
  };
  month: {
    earnings: number;
    deposits: number;
    hours: number;
  };
}

export default function GoalsSection() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/manager/goals', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setGoals(data.goals || []);
        setProgress(data.progress || null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Ошибка загрузки планов');
      }
    } catch (error) {
      console.error('Ошибка загрузки планов:', error);
      setError('Ошибка загрузки планов');
    } finally {
      setLoading(false);
    }
  };

  const getPeriodLabel = (periodType: string) => {
    switch (periodType) {
      case 'DAILY': return 'День';
      case 'WEEKLY': return 'Неделя';
      case 'MONTHLY': return 'Месяц';
      default: return periodType;
    }
  };

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'EARNINGS': return <DollarSign className="w-4 h-4" />;
      case 'DEPOSITS_COUNT': return <TrendingUp className="w-4 h-4" />;
      case 'HOURS': return <Clock className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'EARNINGS': return 'from-green-500 to-emerald-600';
      case 'DEPOSITS_COUNT': return 'from-blue-500 to-blue-600';
      case 'HOURS': return 'from-purple-500 to-purple-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  if (loading) {
    return (
      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Планы и цели
        </h4>
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Планы и цели
        </h4>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  if (goals.length === 0) {
    return (
      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Планы и цели
        </h4>
        <div className="text-center py-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <Target className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Планы не настроены
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        Планы и цели с фиксированными бонусами
      </h4>

      <div className="space-y-4">
        {goals.map((goal) => (
          <div
            key={goal.id}
            className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 bg-gradient-to-r ${getTypeColor(goal.goalTypeType)} text-white rounded-lg`}>
                  {getTypeIcon(goal.goalTypeType)}
                </div>
                <div>
                  <h5 className="font-medium text-gray-900 dark:text-gray-100">
                    {goal.name}
                  </h5>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {goal.goalTypeName} • {getPeriodLabel(goal.periodType)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                  <Trophy className="w-3 h-3" />
                  <span className="text-sm font-semibold">
                    ${goal.totalReward.toFixed(0)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {goal.completedStages}/{goal.totalStages} этапов
                </p>
              </div>
            </div>

            {/* Текущий прогресс */}
            <div className="mb-3">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-700 dark:text-gray-300">
                  Текущий прогресс
                </span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {goal.currentValue}{goal.goalTypeUnit}
                  {goal.nextStage && (
                    <span className="text-gray-500 dark:text-gray-400">
                      {' '}/ {goal.nextStage.targetValue}{goal.goalTypeUnit}
                    </span>
                  )}
                </span>
              </div>
              
              {goal.nextStage && (
                <div className="relative">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 bg-gradient-to-r ${getTypeColor(goal.goalTypeType)} rounded-full transition-all duration-500`}
                      style={{
                        width: `${getProgressPercentage(goal.currentValue, goal.nextStage.targetValue)}%`
                      }}
                    />
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {getProgressPercentage(goal.currentValue, goal.nextStage.targetValue).toFixed(1)}% до следующего этапа
                    </span>
                    <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                      +${goal.nextStage.rewardAmount} бонус
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Этапы */}
            <div>
              <h6 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                Лесенка этапов:
              </h6>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {goal.stages.map((stage) => {
                  const isCompleted = goal.currentValue >= stage.targetValue;
                  const isCurrent = goal.nextStage?.id === stage.id;
                  
                  return (
                    <div
                      key={stage.id}
                      className={`p-2 rounded-lg border text-center ${
                        isCompleted
                          ? 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700'
                          : isCurrent
                          ? 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700'
                          : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center justify-center mb-1">
                        {isCompleted ? (
                          <Star className="w-3 h-3 text-green-600 dark:text-green-400 fill-current" />
                        ) : (
                          <span className={`text-xs font-medium ${
                            isCurrent ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-500 dark:text-gray-400'
                          }`}>
                            {stage.stage}
                          </span>
                        )}
                      </div>
                      <p className={`text-xs font-medium ${
                        isCompleted ? 'text-green-800 dark:text-green-200' : 
                        isCurrent ? 'text-yellow-800 dark:text-yellow-200' : 
                        'text-gray-600 dark:text-gray-400'
                      }`}>
                        {stage.title}
                      </p>
                      <p className={`text-xs ${
                        isCompleted ? 'text-green-600 dark:text-green-400' : 
                        isCurrent ? 'text-yellow-600 dark:text-yellow-400' : 
                        'text-gray-500 dark:text-gray-400'
                      }`}>
                        {stage.targetValue}{goal.goalTypeUnit}
                      </p>
                      <p className={`text-xs font-bold ${
                        isCompleted ? 'text-green-700 dark:text-green-300' : 
                        isCurrent ? 'text-yellow-700 dark:text-yellow-300' : 
                        'text-gray-600 dark:text-gray-400'
                      }`}>
                        ${stage.rewardAmount}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {goal.isCompleted && (
              <div className="mt-3 p-2 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                  <Trophy className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    План выполнен! Общий бонус: ${goal.totalReward}
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
        <div className="text-xs text-indigo-700 dark:text-indigo-300">
          <strong>Как работают планы:</strong> Каждый этап дает дополнительную фиксированную награду при достижении. 
          Например: 25 депозитов = $5 (этап 1) + $15 (этап 2) = $20 общий бонус.
        </div>
      </div>
    </div>
  );
}
