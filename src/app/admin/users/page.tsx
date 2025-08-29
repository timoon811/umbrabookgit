"use client";

import { useState, useEffect } from "react";
import { useModal } from "@/hooks/useModal";
import AlertModal from "@/components/modals/AlertModal";
import ConfirmModal from "@/components/modals/ConfirmModal";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  isBlocked: boolean;
  createdAt: string;
}

interface PendingUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface UserModalData {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  isBlocked: boolean;
  createdAt: string;
  password?: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'pending'>('all');
  const [loading, setLoading] = useState(true);
  const [pendingLoading, setPendingLoading] = useState(true);
  
  // Modal states
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserModalData | null>(null);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  
  // Custom modal hooks
  const { alertModal, confirmModal, success, error, confirm } = useModal();

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/users');
      const data = await response.json();

      if (response.ok) {
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error("Ошибка загрузки пользователей:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadPendingUsers = async () => {
    setPendingLoading(true);
    try {
      const response = await fetch('/api/admin/users?status=PENDING');
      const data = await response.json();

      if (response.ok) {
        setPendingUsers(data.users || []);
      }
    } catch (error) {
      console.error("Ошибка загрузки заявок:", error);
    } finally {
      setPendingLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    loadPendingUsers();
  }, []);

  // Actions
  const handleViewUser = (user: User | PendingUser) => {
    setSelectedUser({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      isBlocked: 'isBlocked' in user ? user.isBlocked : false,
      createdAt: user.createdAt,
    });
    setViewModalOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      isBlocked: user.isBlocked,
      createdAt: user.createdAt,
      password: '',
    });
    setEditModalOpen(true);
  };

  const handleBlockUser = async (userId: string, isBlocked: boolean) => {
    const action = isBlocked ? 'unblock' : 'block';
    const actionText = isBlocked ? 'разблокировать' : 'заблокировать';
    
    const confirmed = await confirm(
      `${isBlocked ? 'Разблокировать' : 'Заблокировать'} пользователя`,
      `Вы уверены, что хотите ${actionText} этого пользователя?`,
      {
        type: isBlocked ? 'info' : 'warning',
        actionType: isBlocked ? 'unblock' : 'block'
      }
    );
    
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        loadUsers();
        success(`Пользователь ${isBlocked ? 'разблокирован' : 'заблокирован'}`);
      } else {
        const result = await response.json();
        error(result.message || "Ошибка выполнения действия");
      }
    } catch {
      error("Ошибка сети");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const confirmed = await confirm(
      "Удалить пользователя",
      "Вы уверены, что хотите удалить этого пользователя? Это действие необратимо.",
      {
        type: 'danger',
        actionType: 'delete'
      }
    );
    
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        loadUsers();
        success("Пользователь удален");
      } else {
      const result = await response.json();
        error(result.message || "Ошибка удаления");
      }
    } catch {
      error("Ошибка сети");
    }
  };

  const handlePendingAction = async (userId: string, action: 'approve' | 'reject') => {
    const actionText = action === 'approve' ? 'одобрить' : 'отклонить';
    
    const confirmed = await confirm(
      `${action === 'approve' ? 'Одобрить' : 'Отклонить'} заявку`,
      `Вы уверены, что хотите ${actionText} эту заявку?`,
      {
        type: action === 'approve' ? 'info' : 'warning',
        actionType: action
      }
    );
    
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        loadPendingUsers();
        loadUsers();
        success(`Заявка ${action === 'approve' ? 'одобрена' : 'отклонена'}`);
      } else {
        const result = await response.json();
        error(result.message || "Ошибка выполнения действия");
      }
    } catch {
      error("Ошибка сети");
    }
  };

  const handleUpdateUser = async (userData: UserModalData) => {
    try {
      const response = await fetch(`/api/admin/users/${userData.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: 'update',
          name: userData.name,
          email: userData.email,
          role: userData.role,
          password: userData.password || undefined,
        }),
      });

      if (response.ok) {
        loadUsers();
        setEditModalOpen(false);
        success("Пользователь обновлен");
      } else {
        const result = await response.json();
        error(result.message || "Ошибка обновления");
      }
    } catch {
      error("Ошибка сети");
    }
  };

  // Helper functions
  const getRoleBadge = (role: string) => {
    const roleConfig = {
      ADMIN: { label: 'Админ', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' },
      MODERATOR: { label: 'Модератор', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-300' },
      MEDIA_BUYER: { label: 'Медиа байер', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' },
      SUPPORT: { label: 'Поддержка', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
      USER: { label: 'Пользователь', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' },
    };
    
    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.USER;
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getStatusBadge = (status: string, isBlocked?: boolean) => {
    if (isBlocked) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
          Заблокирован
        </span>
      );
    }

    const statusConfig = {
      APPROVED: { label: 'Активный', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
      PENDING: { label: 'Ожидает', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' },
      REJECTED: { label: 'Отклонен', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  // Filter functions
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPendingUsers = pendingUsers.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div>
          <h1 className="text-2xl font-bold text-[#171717] dark:text-[#ededed]">
            Управление пользователями
          </h1>
          <p className="text-sm text-[#171717]/60 dark:text-[#ededed]/60 mt-1">
            Всего пользователей: {users.length} • Заявок: {pendingUsers.length}
        </p>
      </div>

        {/* Search */}
        <div className="w-full sm:w-auto sm:min-w-[300px]">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#171717]/40 dark:text-[#ededed]/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Поиск по имени или email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-[#0a0a0a] border border-[#171717]/10 dark:border-[#ededed]/10 rounded-lg text-sm placeholder-[#171717]/40 dark:placeholder-[#ededed]/40 focus:outline-none focus:border-gray-500 dark:focus:border-gray-400"
            />
          </div>
        </div>
          </div>

      {/* Tabs */}
      <div className="border-b border-[#171717]/10 dark:border-[#ededed]/10">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('all')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'all'
                ? 'border-gray-500 text-gray-600 dark:text-gray-400'
                : 'border-transparent text-[#171717]/60 dark:text-[#ededed]/60 hover:text-[#171717] dark:hover:text-[#ededed] hover:border-[#171717]/20 dark:hover:border-[#ededed]/20'
            }`}
          >
            Все пользователи ({filteredUsers.length})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'pending'
                ? 'border-gray-500 text-gray-600 dark:text-gray-400'
                : 'border-transparent text-[#171717]/60 dark:text-[#ededed]/60 hover:text-[#171717] dark:hover:text-[#ededed] hover:border-[#171717]/20 dark:hover:border-[#ededed]/20'
            }`}
          >
            Заявки на регистрацию ({filteredPendingUsers.length})
          </button>
        </nav>
          </div>

      {/* Content */}
      {activeTab === 'all' ? (
        <UsersTable 
          users={filteredUsers}
          loading={loading}
          onView={handleViewUser}
          onEdit={handleEditUser}
          onBlock={handleBlockUser}
          onDelete={handleDeleteUser}
          getRoleBadge={getRoleBadge}
          getStatusBadge={getStatusBadge}
        />
      ) : (
        <PendingUsersTable 
          users={filteredPendingUsers}
          loading={pendingLoading}
          onView={handleViewUser}
          onApprove={(id) => handlePendingAction(id, 'approve')}
          onReject={(id) => handlePendingAction(id, 'reject')}
          getRoleBadge={getRoleBadge}
        />
      )}

      {/* View Modal */}
      {viewModalOpen && selectedUser && (
        <ViewUserModal
          user={selectedUser}
          onClose={() => setViewModalOpen(false)}
          getRoleBadge={getRoleBadge}
          getStatusBadge={getStatusBadge}
        />
      )}

      {/* Edit Modal */}
      {editModalOpen && selectedUser && (
        <EditUserModal
          user={selectedUser}
          onClose={() => setEditModalOpen(false)}
          onSave={handleUpdateUser}
        />
      )}
      
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

// Users Table Component
function UsersTable({ 
  users, 
  loading, 
  onView, 
  onEdit, 
  onBlock, 
  onDelete, 
  getRoleBadge, 
  getStatusBadge 
}: {
  users: User[];
  loading: boolean;
  onView: (user: User) => void;
  onEdit: (user: User) => void;
  onBlock: (id: string, isBlocked: boolean) => void;
  onDelete: (id: string) => void;
  getRoleBadge: (role: string) => React.ReactElement;
  getStatusBadge: (status: string, isBlocked?: boolean) => React.ReactElement;
}) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-[#0a0a0a] rounded-lg border border-[#171717]/5 dark:border-[#ededed]/10 p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500"></div>
          <span className="ml-3 text-[#171717]/60 dark:text-[#ededed]/60">Загрузка пользователей...</span>
        </div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="bg-white dark:bg-[#0a0a0a] rounded-lg border border-[#171717]/5 dark:border-[#ededed]/10 p-8 text-center">
        <svg className="mx-auto h-12 w-12 text-[#171717]/40 dark:text-[#ededed]/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-[#171717] dark:text-[#ededed]">Пользователи не найдены</h3>
        <p className="mt-1 text-sm text-[#171717]/60 dark:text-[#ededed]/60">
          Попробуйте изменить параметры поиска
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#0a0a0a] rounded-lg border border-[#171717]/5 dark:border-[#ededed]/10 overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="min-w-full divide-y divide-[#171717]/5 dark:divide-[#ededed]/10">
          <thead className="bg-[#171717]/[0.02] dark:bg-[#ededed]/[0.02]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#171717]/60 dark:text-[#ededed]/60 uppercase tracking-wider">
                  Пользователь
                </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#171717]/60 dark:text-[#ededed]/60 uppercase tracking-wider">
                Email
                </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#171717]/60 dark:text-[#ededed]/60 uppercase tracking-wider">
                Роль
                </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#171717]/60 dark:text-[#ededed]/60 uppercase tracking-wider">
                Дата регистрации
                </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-[#171717]/60 dark:text-[#ededed]/60 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
          <tbody className="divide-y divide-[#171717]/5 dark:divide-[#ededed]/10">
              {users.map((user) => (
              <tr key={user.id} className="hover:bg-[#171717]/[0.01] dark:hover:bg-[#ededed]/[0.01]">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gray-500 to-gray-700 flex items-center justify-center">
                        <span className="text-sm font-medium text-white">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                      <div className="text-sm font-medium text-[#171717] dark:text-[#ededed]">
                          {user.name}
                        </div>
                      <div className="text-sm text-[#171717]/60 dark:text-[#ededed]/60">
                        {getStatusBadge(user.status, user.isBlocked)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-[#171717] dark:text-[#ededed]">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                  {getRoleBadge(user.role)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-[#171717]/60 dark:text-[#ededed]/60">
                  {new Date(user.createdAt).toLocaleDateString("ru")}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <UserActionButtons
                    user={user}
                    onView={onView}
                    onEdit={onEdit}
                    onBlock={onBlock}
                    onDelete={onDelete}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden">
        {users.map((user) => (
          <div key={user.id} className="p-4 border-b border-[#171717]/5 dark:border-[#ededed]/10 last:border-b-0">
            <div className="flex items-start justify-between">
              <div className="flex items-center flex-1">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-gray-500 to-gray-700 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-medium text-white">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <div className="text-sm font-medium text-[#171717] dark:text-[#ededed] truncate">
                    {user.name}
                  </div>
                  <div className="text-sm text-[#171717]/60 dark:text-[#ededed]/60 truncate">
                    {user.email}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {getRoleBadge(user.role)}
                    {getStatusBadge(user.status, user.isBlocked)}
                  </div>
                  <div className="text-xs text-[#171717]/40 dark:text-[#ededed]/40 mt-1">
                    Регистрация: {new Date(user.createdAt).toLocaleDateString("ru")}
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <UserActionButtons
                user={user}
                onView={onView}
                onEdit={onEdit}
                onBlock={onBlock}
                onDelete={onDelete}
                mobile
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// User Action Buttons Component
function UserActionButtons({ 
  user, 
  onView, 
  onEdit, 
  onBlock, 
  onDelete, 
  mobile = false 
}: {
  user: User;
  onView: (user: User) => void;
  onEdit: (user: User) => void;
  onBlock: (id: string, isBlocked: boolean) => void;
  onDelete: (id: string) => void;
  mobile?: boolean;
}) {
  const buttonClass = mobile 
    ? "inline-flex items-center justify-center w-8 h-8 rounded-lg transition-colors"
    : "inline-flex items-center justify-center w-7 h-7 rounded-md transition-colors";
    
  return (
    <div className={`flex ${mobile ? 'flex-wrap' : ''} gap-1`}>
      {/* Посмотреть */}
                          <button
        onClick={() => onView(user)}
        className={`${buttonClass} bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/20`}
        title="Посмотреть профиль"
                          >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
                          </button>

      {/* Редактировать */}
                          <button
        onClick={() => onEdit(user)}
        className={`${buttonClass} bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700`}
        title="Редактировать пользователя"
                          >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
                          </button>

      {/* Блокировать/Разблокировать */}
      {user.role !== "ADMIN" && (
                        <button
          onClick={() => onBlock(user.id, user.isBlocked)}
          className={`${buttonClass} ${
            user.isBlocked
              ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50'
              : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:hover:bg-yellow-900/50'
          }`}
          title={user.isBlocked ? "Разблокировать пользователя" : "Заблокировать пользователя"}
        >
          {user.isBlocked ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          )}
                        </button>
                      )}

      {/* Удалить */}
                      {user.role !== "ADMIN" && (
                        <button
          onClick={() => onDelete(user.id)}
          className={`${buttonClass} bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50`}
          title="Удалить пользователя"
                        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
                        </button>
                      )}
                    </div>
  );
}

// Pending Users Table Component
function PendingUsersTable({ 
  users, 
  loading, 
  onView, 
  onApprove, 
  onReject, 
  getRoleBadge 
}: {
  users: PendingUser[];
  loading: boolean;
  onView: (user: PendingUser) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  getRoleBadge: (role: string) => React.ReactElement;
}) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-[#0a0a0a] rounded-lg border border-[#171717]/5 dark:border-[#ededed]/10 p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500"></div>
          <span className="ml-3 text-[#171717]/60 dark:text-[#ededed]/60">Загрузка заявок...</span>
        </div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="bg-white dark:bg-[#0a0a0a] rounded-lg border border-[#171717]/5 dark:border-[#ededed]/10 p-8 text-center">
        <svg className="mx-auto h-12 w-12 text-[#171717]/40 dark:text-[#ededed]/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-[#171717] dark:text-[#ededed]">Нет заявок на регистрацию</h3>
        <p className="mt-1 text-sm text-[#171717]/60 dark:text-[#ededed]/60">
          Все заявки обработаны
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#0a0a0a] rounded-lg border border-[#171717]/5 dark:border-[#ededed]/10 overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="min-w-full divide-y divide-[#171717]/5 dark:divide-[#ededed]/10">
          <thead className="bg-[#171717]/[0.02] dark:bg-[#ededed]/[0.02]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#171717]/60 dark:text-[#ededed]/60 uppercase tracking-wider">
                Пользователь
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#171717]/60 dark:text-[#ededed]/60 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#171717]/60 dark:text-[#ededed]/60 uppercase tracking-wider">
                Роль
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#171717]/60 dark:text-[#ededed]/60 uppercase tracking-wider">
                Дата подачи
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-[#171717]/60 dark:text-[#ededed]/60 uppercase tracking-wider">
                Действия
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#171717]/5 dark:divide-[#ededed]/10">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-[#171717]/[0.01] dark:hover:bg-[#ededed]/[0.01]">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                        <span className="text-sm font-medium text-white">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-[#171717] dark:text-[#ededed]">
                        {user.name}
                      </div>
                      <div className="text-sm text-[#171717]/60 dark:text-[#ededed]/60">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                          Ожидает
                        </span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-[#171717] dark:text-[#ededed]">{user.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getRoleBadge(user.role)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-[#171717]/60 dark:text-[#ededed]/60">
                  {new Date(user.createdAt).toLocaleDateString("ru")}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <PendingUserActionButtons
                    user={user}
                    onView={onView}
                    onApprove={onApprove}
                    onReject={onReject}
                  />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden">
        {users.map((user) => (
          <div key={user.id} className="p-4 border-b border-[#171717]/5 dark:border-[#ededed]/10 last:border-b-0">
            <div className="flex items-start justify-between">
              <div className="flex items-center flex-1">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-medium text-white">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <div className="text-sm font-medium text-[#171717] dark:text-[#ededed] truncate">
                    {user.name}
                  </div>
                  <div className="text-sm text-[#171717]/60 dark:text-[#ededed]/60 truncate">
                    {user.email}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {getRoleBadge(user.role)}
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                      Ожидает
                    </span>
                  </div>
                  <div className="text-xs text-[#171717]/40 dark:text-[#ededed]/40 mt-1">
                    Регистрация: {new Date(user.createdAt).toLocaleDateString("ru")}
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <PendingUserActionButtons
                user={user}
                onView={onView}
                onApprove={onApprove}
                onReject={onReject}
                mobile
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Pending User Action Buttons Component
function PendingUserActionButtons({ 
  user, 
  onView, 
  onApprove, 
  onReject, 
  mobile = false 
}: {
  user: PendingUser;
  onView: (user: PendingUser) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  mobile?: boolean;
}) {
  const buttonClass = mobile 
    ? "inline-flex items-center justify-center w-8 h-8 rounded-lg transition-colors"
    : "inline-flex items-center justify-center w-7 h-7 rounded-md transition-colors";
    
  return (
    <div className={`flex ${mobile ? 'flex-wrap' : ''} gap-1`}>
      {/* Посмотреть */}
      <button
        onClick={() => onView(user)}
        className={`${buttonClass} bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg_white/10 dark:text-white dark:hover:bg-white/20`}
        title="Посмотреть профиль"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      </button>

      {/* Одобрить */}
      <button
        onClick={() => onApprove(user.id)}
        className={`${buttonClass} bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50`}
        title="Одобрить заявку"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </button>

      {/* Отклонить */}
      <button
        onClick={() => onReject(user.id)}
        className={`${buttonClass} bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50`}
        title="Отклонить заявку"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

// View User Modal Component
function ViewUserModal({ 
  user, 
  onClose, 
  getRoleBadge, 
  getStatusBadge 
}: {
  user: UserModalData;
  onClose: () => void;
  getRoleBadge: (role: string) => React.ReactElement;
  getStatusBadge: (status: string, isBlocked?: boolean) => React.ReactElement;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-[#0a0a0a] rounded-lg border border-[#171717]/10 dark:border-[#ededed]/10 w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-[#171717]/10 dark:border-[#ededed]/10">
          <h2 className="text-lg font-semibold text-[#171717] dark:text-[#ededed]">
            Информация о пользователе
          </h2>
          <button
            onClick={onClose}
            className="text-[#171717]/40 dark:text-[#ededed]/40 hover:text-[#171717] dark:hover:text-[#ededed] transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-gray-500 to-gray-700 flex items-center justify-center">
              <span className="text-xl font-medium text-white">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className="text-xl font-medium text-[#171717] dark:text-[#ededed]">
                {user.name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                {getRoleBadge(user.role)}
                {getStatusBadge(user.status, user.isBlocked)}
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#171717]/60 dark:text-[#ededed]/60 mb-1">
                Email
              </label>
              <div className="text-sm text-[#171717] dark:text-[#ededed]">
                {user.email}
        </div>
      </div>

            <div>
              <label className="block text-sm font-medium text-[#171717]/60 dark:text-[#ededed]/60 mb-1">
                Дата регистрации
              </label>
              <div className="text-sm text-[#171717] dark:text-[#ededed]">
                {new Date(user.createdAt).toLocaleDateString("ru", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 p-6 border-t border-[#171717]/10 dark:border-[#ededed]/10">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-[#171717]/60 dark:text-[#ededed]/60 hover:text-[#171717] dark:hover:text-[#ededed] hover:bg-[#171717]/5 dark:hover:bg-[#ededed]/5 transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}

// Edit User Modal Component
function EditUserModal({ 
  user, 
  onClose, 
  onSave 
}: {
  user: UserModalData;
  onClose: () => void;
  onSave: (userData: UserModalData) => void;
}) {
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    role: user.role,
    password: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...user,
      ...formData,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-[#0a0a0a] rounded-lg border border-[#171717]/10 dark:border-[#ededed]/10 w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-[#171717]/10 dark:border-[#ededed]/10">
          <h2 className="text-lg font-semibold text-[#171717] dark:text-[#ededed]">
            Редактировать пользователя
          </h2>
              <button
            onClick={onClose}
            className="text-[#171717]/40 dark:text-[#ededed]/40 hover:text-[#171717] dark:hover:text-[#ededed] transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#171717] dark:text-[#ededed] mb-2">
                Имя
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-[#0a0a0a] border border-[#171717]/10 dark:border-[#ededed]/10 rounded-lg text-sm focus:outline-none focus:border-gray-500 dark:focus:border-gray-400"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#171717] dark:text-[#ededed] mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-[#0a0a0a] border border-[#171717]/10 dark:border-[#ededed]/10 rounded-lg text-sm focus:outline-none focus:border-gray-500 dark:focus:border-gray-400"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#171717] dark:text-[#ededed] mb-2">
                Роль
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-[#0a0a0a] border border-[#171717]/10 dark:border-[#ededed]/10 rounded-lg text-sm focus:outline-none focus:border-gray-500 dark:focus:border-gray-400"
              >
                <option value="USER">Пользователь</option>
                <option value="MODERATOR">Модератор</option>
                <option value="MEDIA_BUYER">Медиа байер</option>
                <option value="SUPPORT">Поддержка</option>
                <option value="ADMIN">Администратор</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#171717] dark:text-[#ededed] mb-2">
                Новый пароль (необязательно)
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-[#0a0a0a] border border-[#171717]/10 dark:border-[#ededed]/10 rounded-lg text-sm focus:outline-none focus:border-gray-500 dark:focus:border-gray-400"
                placeholder="Оставьте пустым для сохранения текущего"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-[#171717]/10 dark:border-[#ededed]/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-[#171717]/60 dark:text-[#ededed]/60 hover:text-[#171717] dark:hover:text-[#ededed] hover:bg-[#171717]/5 dark:hover:bg-[#ededed]/5 transition-colors"
            >
              Отмена
              </button>
              <button
              type="submit"
              className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-600 text-white hover:bg-gray-700 dark:bg-gray-500 dark:hover:bg-gray-600 transition-colors"
              >
              Сохранить
              </button>
          </div>
        </form>
        </div>
    </div>
  );
}
