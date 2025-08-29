"use client";

import React from 'react';
import { Edit, Trash2, Users, Tag, FolderOpen, CreditCard } from 'lucide-react';

interface BaseEntity {
  id: string;
  name: string;
  isArchived: boolean;
}

interface CounterpartyEntity extends BaseEntity {
  type: string;
  email: string | null;
  phone: string | null;
  taxNumber: string | null;
}

interface CategoryEntity extends BaseEntity {
  type: string;
  description: string | null;
  color: string;
}

interface ProjectEntity extends BaseEntity {
  status: string;
  description: string | null;
}

interface AccountEntity extends BaseEntity {
  type: string;
  currency: string;
  balance: number;
  commission: number;
  cryptocurrencies?: string[];
}

type EntityType = 'counterparty' | 'category' | 'project' | 'account';
type Entity = CounterpartyEntity | CategoryEntity | ProjectEntity | AccountEntity;

interface FinanceEntityListProps {
  entities: Entity[];
  entityType: EntityType;
  onEdit: (entity: Entity) => void;
  onDelete: (entity: Entity) => void;
  getTypeColor: (type: string, entityType: string) => string;
  getTypeLabel: (type: string, entityType: string) => string;
  formatCurrency?: (amount: number, currency?: string) => string;
  formatDate?: (dateString: string | null) => string;
}

const getEntityIcon = (entityType: EntityType, entity?: any) => {
  const iconProps = "w-5 h-5";

  switch (entityType) {
    case 'counterparty':
      return <Users className={`${iconProps} text-gray-500`} />;
    case 'category':
      return (
        <div
          className="w-5 h-5 rounded-full border border-gray-300"
          style={{ backgroundColor: entity?.color || '#gray' }}
        />
      );
    case 'project':
      return <FolderOpen className={`${iconProps} text-purple-500`} />;
    case 'account':
      return <CreditCard className={`${iconProps} text-green-500`} />;
    default:
      return <Tag className={`${iconProps} text-gray-500`} />;
  }
};

const getEntitySubtitle = (entity: Entity, entityType: EntityType, getTypeLabel: (type: string, entityType: string) => string) => {
  switch (entityType) {
    case 'counterparty':
      const counterparty = entity as CounterpartyEntity;
      return `${getTypeLabel(counterparty.type, 'counterparty')} • ${counterparty.email || counterparty.phone || 'Нет контактов'}`;
    case 'category':
      const category = entity as CategoryEntity;
      return getTypeLabel(category.type, 'category');
    case 'project':
      const project = entity as ProjectEntity;
      return getTypeLabel(project.status, 'project');
    case 'account':
      const account = entity as AccountEntity;
      return `${getTypeLabel(account.type, 'account')} • ${account.currency}`;
    default:
      return '';
  }
};

const getEntityExtraInfo = (entity: Entity, entityType: EntityType, formatCurrency?: (amount: number, currency?: string) => string, formatDate?: (dateString: string | null) => string) => {
  switch (entityType) {
    case 'counterparty':
      const counterparty = entity as CounterpartyEntity;
      return counterparty.taxNumber ? `ИНН: ${counterparty.taxNumber}` : null;
    case 'category':
      const category = entity as CategoryEntity;
      return category.description;
    case 'project':
      const project = entity as ProjectEntity;
      return project.description;
    case 'account':
      const account = entity as AccountEntity;
      const parts = [];

      if (account.commission > 0) {
        parts.push(`Комиссия: ${account.commission}%`);
      }

      if (account.type === 'CRYPTO_WALLET' || account.type === 'CRYPTO_EXCHANGE') {
        const cryptoList = account.cryptocurrencies && account.cryptocurrencies.length > 0
          ? account.cryptocurrencies.join(', ')
          : 'Криптовалюты не выбраны';
        parts.push(cryptoList);
      }

      const balanceText = formatCurrency ? formatCurrency(account.balance, account.currency) : account.balance;
      parts.unshift(`Баланс: ${balanceText}`);

      return parts.join(' | ');
    default:
      return null;
  }
};

export default function FinanceEntityList({
  entities,
  entityType,
  onEdit,
  onDelete,
  getTypeColor,
  getTypeLabel,
  formatCurrency,
  formatDate
}: FinanceEntityListProps) {
  return (
    <div className="space-y-3">
      {entities.map((entity) => (
        <div
          key={entity.id}
          className="bg-white dark:bg-[#0a0a0a] rounded-lg border border-[#171717]/5 dark:border-[#ededed]/10 p-4 hover:shadow-md transition-all duration-200 hover:border-[#2563eb]/20 dark:hover:border-[#60a5fa]/20"
        >
          <div className="flex items-center justify-between">
            {/* Левая часть - информация */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {/* Иконка */}
              <div className="flex-shrink-0">
                {getEntityIcon(entityType, entity)}
              </div>

              {/* Основная информация */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-base font-semibold text-[#171717] dark:text-[#ededed] truncate">
                    {entity.name}
                  </h3>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(
                    entityType === 'counterparty' ? (entity as CounterpartyEntity).type :
                    entityType === 'category' ? (entity as CategoryEntity).type :
                    entityType === 'project' ? (entity as ProjectEntity).status :
                    (entity as AccountEntity).type,
                    entityType
                  )}`}>
                    {entityType === 'counterparty' ? getTypeLabel((entity as CounterpartyEntity).type, 'counterparty') :
                     entityType === 'category' ? getTypeLabel((entity as CategoryEntity).type, 'category') :
                     entityType === 'project' ? getTypeLabel((entity as ProjectEntity).status, 'project') :
                     getTypeLabel((entity as AccountEntity).type, 'account')}
                  </span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    entity.isArchived
                      ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                  }`}>
                    {entity.isArchived ? 'Архив' : 'Активен'}
                  </span>
                </div>

                {/* Подзаголовок */}
                <p className="text-sm text-[#171717]/60 dark:text-[#ededed]/60 truncate">
                  {getEntitySubtitle(entity, entityType, getTypeLabel)}
                </p>

                {/* Дополнительная информация */}
                {getEntityExtraInfo(entity, entityType, formatCurrency, formatDate) && (
                  <p className="text-sm text-[#171717]/50 dark:text-[#ededed]/50 mt-1 truncate">
                    {getEntityExtraInfo(entity, entityType, formatCurrency, formatDate)}
                  </p>
                )}
              </div>
            </div>

            {/* Правая часть - действия */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => onEdit(entity)}
                className="p-2 text-[#2563eb] dark:text-[#60a5fa] hover:bg-[#2563eb]/10 dark:hover:bg-[#60a5fa]/10 rounded-md transition-colors"
                title="Редактировать"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(entity)}
                className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                title="Удалить"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
