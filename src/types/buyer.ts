// Типы для системы Buyer

// Проекты
export interface BuyerProject {
  id: string;
  name: string;
  buyerId: string;
  offer?: string;
  geo?: string;
  trafficSource?: string;
  attributionWindow: number;
  attributionModel: 'DATE_BASED' | 'CLICK_BASED';
  currency: string;
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
  stopConditions?: string; // JSON
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Связанные данные
  buyer?: {
    id: string;
    name: string;
    email: string;
  };
  dailyLogs?: BuyerDailyLog[];
  requests?: BuyerRequest[];
}

// Дневники
export interface BuyerDailyLog {
  id: string;
  buyerId: string;
  projectId: string;
  date: Date;
  spend: number;
  ftdCount: number;
  ftdAmount: number;
  redCount: number;
  redAmount: number;
  totalDeposits: number;
  averageCheck: number;
  registrations: number;
  clicks: number;
  notes?: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'LOCKED';
  adminComment?: string;
  moderatedAt?: Date;
  moderatedBy?: string;
  lockedAt?: Date;
  lockedBy?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Связанные данные
  buyer?: {
    id: string;
    name: string;
  };
  project?: {
    id: string;
    name: string;
  };
  moderator?: {
    id: string;
    name: string;
  };
}

// Заявки
export interface BuyerRequest {
  id: string;
  buyerId: string;
  projectId?: string;
  type: 'BUDGET' | 'CONSUMABLES' | 'ACCESS' | 'PAYOUT' | 'CUSTOM';
  title: string;
  description?: string;
  amount?: number;
  deliveryMethod?: string;
  payoutPeriod?: string;
  walletAddress?: string;
  items?: string; // JSON
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'FULFILLED' | 'CLOSED' | 'PAID';
  adminComment?: string;
  processedAt?: Date;
  processedBy?: string;
  fulfilledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Связанные данные
  buyer?: {
    id: string;
    name: string;
  };
  project?: {
    id: string;
    name: string;
  };
  processor?: {
    id: string;
    name: string;
  };
}

// Схемы бонусов
export interface BuyerBonusScheme {
  id: string;
  name: string;
  description?: string;
  type: 'FIFTY_FIFTY' | 'TIER_SYSTEM' | 'CUSTOM_FORMULA';
  percentage?: number;
  tiers?: string; // JSON
  formula?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Назначения бонусных схем
export interface BuyerBonusAssignment {
  id: string;
  buyerId: string;
  schemeId: string;
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Связанные данные
  buyer?: {
    id: string;
    name: string;
  };
  scheme?: BuyerBonusScheme;
}

// Общие расходы
export interface SharedCost {
  id: string;
  name: string;
  description?: string;
  amount: number;
  costType: string;
  period: string;
  isShared: boolean;
  allocationRule: 'BY_SPEND' | 'BY_REVENUE' | 'EQUAL' | 'MANUAL';
  status: 'PLANNED' | 'ACTIVE' | 'ALLOCATED' | 'ARCHIVED';
  createdAt: Date;
  updatedAt: Date;
  
  // Связанные данные
  allocations?: SharedCostAllocation[];
}

// Аллокация общих расходов
export interface SharedCostAllocation {
  id: string;
  sharedCostId: string;
  projectId: string;
  buyerId: string;
  allocatedAmount: number;
  percentage: number;
  period: string;
  calculatedAt: Date;
  
  // Связанные данные
  sharedCost?: SharedCost;
  project?: {
    id: string;
    name: string;
  };
  buyer?: {
    id: string;
    name: string;
  };
}

// Каталог расходников
export interface ConsumableCatalog {
  id: string;
  name: string;
  category: string;
  description?: string;
  unit: string;
  basePrice?: number;
  isShared: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Сигналы
export interface BuyerSignal {
  id: string;
  buyerId?: string;
  projectId?: string;
  type: 'ROAS_DROP' | 'ANOMALY' | 'MISSING_LOG' | 'OVERSPEND' | 'CUSTOM';
  title: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'ACTIVE' | 'IN_PROGRESS' | 'RESOLVED' | 'DISMISSED';
  metadata?: string; // JSON
  resolvedAt?: Date;
  resolvedBy?: string;
  adminComment?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Связанные данные
  buyer?: {
    id: string;
    name: string;
  };
  project?: {
    id: string;
    name: string;
  };
  resolver?: {
    id: string;
    name: string;
  };
}

// Статистика для Dashboard
export interface BuyerStats {
  currentPeriod: {
    spend: number;
    deposits: number;
    profit: number;
    roas: number;
    projectCount: number;
  };
  todayYesterday: {
    today: {
      spend: number;
      deposits: number;
      hasLog: boolean;
    };
    yesterday: {
      spend: number;
      deposits: number;
      hasLog: boolean;
    };
  };
  bonusPreview: {
    currentScheme?: BuyerBonusScheme;
    estimatedBonus: number;
    periodProfit: number;
  };
  alerts: BuyerSignal[];
  recentRequests: BuyerRequest[];
}

// Опции фильтрации для различных списков
export interface BuyerProjectFilters {
  status?: string;
  geo?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface BuyerRequestFilters {
  type?: string;
  status?: string;
  projectId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface DailyLogFilters {
  projectId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Формы для создания/редактирования
export interface BuyerProjectForm {
  name: string;
  offer?: string;
  geo?: string;
  trafficSource?: string;
  attributionWindow: number;
  attributionModel: 'DATE_BASED' | 'CLICK_BASED';
  currency: string;
  stopConditions?: string;
}

export interface DailyLogForm {
  projectId: string;
  date: string;
  spend: number;
  ftdCount: number;
  ftdAmount: number;
  redCount: number;
  redAmount: number;
  registrations: number;
  clicks: number;
  notes?: string;
}

export interface BuyerRequestForm {
  projectId?: string;
  type: 'BUDGET' | 'CONSUMABLES' | 'ACCESS' | 'PAYOUT' | 'CUSTOM';
  title: string;
  description?: string;
  amount?: number;
  deliveryMethod?: string;
  payoutPeriod?: string;
  walletAddress?: string;
  items?: ConsumableItem[];
}

export interface ConsumableItem {
  catalogId: string;
  name: string;
  quantity: number;
  unit: string;
  note?: string;
}

// Расчет прибыли и бонусов
export interface ProfitCalculation {
  projectId: string;
  period: string;
  revenue: number; // FTD + RED
  spend: number;
  sharedCosts: number;
  profit: number; // revenue - spend - sharedCosts
  roas: number; // revenue / spend
}

export interface BonusCalculation {
  buyerId: string;
  schemeId: string;
  period: string;
  totalProfit: number;
  bonusAmount: number;
  schemeType: 'FIFTY_FIFTY' | 'TIER_SYSTEM' | 'CUSTOM_FORMULA';
  calculation: string; // Детали расчета
}

// Экспорт типов для API
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

