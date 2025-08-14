"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useModal } from "@/hooks/useModal";
import AlertModal from "@/components/modals/AlertModal";
import ConfirmModal from "@/components/modals/ConfirmModal";

// Типы данных
interface Category {
  id: string;
  key: string;
  name: string;
  description: string;
  articlesCount: number;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Компонент управления категориями
export default function CategoriesManagementPage() {
  const [categories, setCategories] = useState<Category[]>([]);

  const [loading, setLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newCategory, setNewCategory] = useState({
    key: "",
    name: "",
    description: "",
    order: 5,
  });
  
  // Modal hooks
  const { alertModal, confirmModal, success, error, warning, confirm } = useModal();

  // Загрузка категорий из БД
  const loadCategories = async () => {
    try {
      const response = await fetch("/api/admin/articles/categories");
      if (response.ok) {
        const categoriesData: Category[] = await response.json();
        setCategories(categoriesData);
      } else {
        console.error("Failed to load categories");
      }
    } catch (error) {
      console.error("Error loading categories:", error);
    } finally {
      setLoading(false);
    }
  };

  // Сохранение порядка категорий
  const saveOrder = async () => {
    try {
      const response = await fetch("/api/admin/articles/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categories }),
      });

      if (response.ok) {
        success("Порядок категорий сохранен!");
      } else {
        error("Ошибка сохранения порядка");
      }
    } catch {
      error("Ошибка сохранения порядка");
    }
  };

  // Перемещение категории
  const moveCategory = (index: number, direction: "up" | "down") => {
    const newCategories = [...categories];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < categories.length) {
      // Меняем местами
      [newCategories[index], newCategories[targetIndex]] = 
      [newCategories[targetIndex], newCategories[index]];
      
      // Обновляем order
      newCategories[index].order = index + 1;
      newCategories[targetIndex].order = targetIndex + 1;
      
      setCategories(newCategories);
    }
  };

  // Обновление категории
  const updateCategory = (category: Category) => {
    setCategories(prev => 
      prev.map(cat => cat.key === category.key ? category : cat)
    );
    setEditingCategory(null);
  };

  // Добавление новой категории
  const addCategory = async () => {
    if (!newCategory.key || !newCategory.name) {
      warning("Ключ и название обязательны", "Необходимо заполнить поля");
      return;
    }

    try {
      const response = await fetch("/api/admin/articles/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: newCategory.key,
          name: newCategory.name,
          description: newCategory.description,
          order: newCategory.order,
        }),
      });

      if (response.ok) {
        setNewCategory({ key: "", name: "", description: "", order: categories.length + 1 });
        setIsAddingNew(false);
        loadCategories();
        success("Категория создана");
      } else {
        const errorData = await response.json();
        error(errorData.error || "Не удалось создать категорию");
      }
    } catch {
      error("Ошибка создания категории");
    }
  };

  // Удаление категории
  const deleteCategory = async (categoryKey: string) => {
    const category = categories.find(cat => cat.key === categoryKey);
    if (!category) return;

    if (category.articlesCount > 0) {
      warning(
        `Невозможно удалить категорию "${category.name}". В ней есть ${category.articlesCount} статей.`,
        "Удаление невозможно"
      );
      return;
    }

    const confirmed = await confirm(
      "Удалить категорию",
      `Вы уверены, что хотите удалить категорию "${category.name}"?`,
      {
        type: 'danger',
        actionType: 'delete'
      }
    );
    
    if (!confirmed) return;

    setCategories(prev => prev.filter(cat => cat.key !== categoryKey));
    success("Категория удалена");
  };

  useEffect(() => {
    loadCategories();
  }, []);

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#171717] dark:text-[#ededed]">
            Управление категориями
          </h1>
          <p className="text-sm text-[#171717]/60 dark:text-[#ededed]/60 mt-1">
            Настройте категории и порядок их отображения в навигации
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/articles"
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            ← К статьям
          </Link>
          <button
            onClick={() => setIsAddingNew(true)}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 dark:bg-white/10 dark:hover:bg-white/20 transition-colors"
          >
            ➕ Добавить категорию
          </button>
          <button
            onClick={saveOrder}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition-colors"
          >
            💾 Сохранить порядок
          </button>
        </div>
      </div>

      {/* Форма добавления новой категории */}
      {isAddingNew && (
        <div className="bg-white dark:bg-[#0a0a0a] rounded-lg border border-[#171717]/5 dark:border-[#ededed]/10 p-6">
          <h2 className="text-lg font-semibold text-[#171717] dark:text-[#ededed] mb-4">
            Добавить новую категорию
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-[#171717] dark:text-[#ededed] mb-1">
                Ключ категории *
              </label>
              <input
                type="text"
                value={newCategory.key}
                onChange={(e) => setNewCategory(prev => ({ ...prev, key: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-[#171717] dark:text-[#ededed]"
                placeholder="my-category"
              />
              <p className="text-xs text-[#171717]/60 dark:text-[#ededed]/60 mt-1">
                Используется в URL и коде (только латиница, цифры, дефисы)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#171717] dark:text-[#ededed] mb-1">
                Название категории *
              </label>
              <input
                type="text"
                value={newCategory.name}
                onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-[#171717] dark:text-[#ededed]"
                placeholder="МОЯ КАТЕГОРИЯ"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[#171717] dark:text-[#ededed] mb-1">
                Описание
              </label>
              <textarea
                value={newCategory.description}
                onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-[#171717] dark:text-[#ededed]"
                placeholder="Краткое описание категории..."
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={addCategory}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 dark:bg-white/10 dark:hover:bg-white/20 transition-colors"
            >
              Добавить
            </button>
            <button
              onClick={() => {
                setIsAddingNew(false);
                setNewCategory({ key: "", name: "", description: "", order: categories.length + 1 });
              }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Список категорий */}
      <div className="bg-white dark:bg-[#0a0a0a] rounded-lg border border-[#171717]/5 dark:border-[#ededed]/10 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="text-[#171717]/60 dark:text-[#ededed]/60">Загрузка...</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-[#171717] dark:text-[#ededed]">
                    Порядок
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-[#171717] dark:text-[#ededed]">
                    Категория
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-[#171717] dark:text-[#ededed]">
                    Ключ
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-[#171717] dark:text-[#ededed]">
                    Статьи
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-medium text-[#171717] dark:text-[#ededed]">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {categories.map((category, index) => (
                  <tr key={category.key} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium text-[#171717] dark:text-[#ededed]">
                          {index + 1}
                        </span>
                        <div className="flex flex-col">
                          <button
                            onClick={() => moveCategory(index, "up")}
                            disabled={index === 0}
                            className="w-6 h-3 text-xs text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            ▲
                          </button>
                          <button
                            onClick={() => moveCategory(index, "down")}
                            disabled={index === categories.length - 1}
                            className="w-6 h-3 text-xs text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            ▼
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {editingCategory?.key === category.key ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editingCategory.name}
                            onChange={(e) => setEditingCategory(prev => 
                              prev ? { ...prev, name: e.target.value } : null
                            )}
                            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-[#171717] dark:text-[#ededed]"
                          />
                          <textarea
                            value={editingCategory.description}
                            onChange={(e) => setEditingCategory(prev => 
                              prev ? { ...prev, description: e.target.value } : null
                            )}
                            rows={2}
                            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-[#171717] dark:text-[#ededed]"
                          />
                        </div>
                      ) : (
                        <div>
                          <div className="font-medium text-[#171717] dark:text-[#ededed]">
                            {category.name}
                          </div>
                          {category.description && (
                            <div className="text-sm text-[#171717]/60 dark:text-[#ededed]/60 mt-1">
                              {category.description}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <code className="px-2 py-1 text-sm bg-gray-100 dark:bg-gray-800 text-[#171717] dark:text-[#ededed] rounded">
                        {category.key}
                      </code>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-[#171717] dark:text-[#ededed]">
                          {category.articlesCount}
                        </span>
                        {category.articlesCount > 0 && (
                          <Link
                            href={`/admin/articles?category=${category.key}`}
                            className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            Посмотреть
                          </Link>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 justify-end">
                        {editingCategory?.key === category.key ? (
                          <>
                            <button
                              onClick={() => updateCategory(editingCategory)}
                              className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50 transition-colors"
                              title="Сохранить"
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => setEditingCategory(null)}
                              className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-900/30 dark:text-gray-300 dark:hover:bg-gray-900/50 transition-colors"
                              title="Отмена"
                            >
                              ×
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => setEditingCategory(category)}
                              className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 transition-colors"
                              title="Редактировать"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => deleteCategory(category.key)}
                              disabled={category.articlesCount > 0}
                              className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title={category.articlesCount > 0 ? "Нельзя удалить категорию со статьями" : "Удалить"}
                            >
                              🗑️
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Информация */}
      <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
          ℹ️ Информация о категориях
        </h3>
        <div className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
          <p>• Используйте стрелки для изменения порядка отображения категорий в навигации</p>
          <p>• Ключ категории используется в URL и не может быть изменен после создания</p>
          <p>• Категории с статьями нельзя удалить - сначала переместите или удалите статьи</p>
          <p>• Порядок автоматически сохраняется при перемещении, но лучше нажать "Сохранить порядок"</p>
        </div>
      </div>
      
      {/* Alert and Confirm Modals */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={alertModal.onClose}
        title={alertModal.options.title}
        message={alertModal.options.message}
        type={alertModal.options.type}
        confirmText={alertModal.options.confirmText}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={confirmModal.onClose}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.options.title}
        message={confirmModal.options.message}
        confirmText={confirmModal.options.confirmText}
        cancelText={confirmModal.options.cancelText}
        type={confirmModal.options.type}
        actionType={confirmModal.options.actionType}
      />
    </div>
  );
}
