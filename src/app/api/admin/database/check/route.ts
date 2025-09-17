import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireAdmin } from '@/lib/auth';
import { requireAdminAuth } from '@/lib/api-auth';

const prisma = new PrismaClient();

interface TableCheck {
  table: string;
  exists: boolean;
  rowCount: number;
  error?: string;
}

interface ColumnCheck {
  table: string;
  column: string;
  exists: boolean;
  type?: string;
  error?: string;
}

interface DatabaseCheckResult {
  isHealthy: boolean;
  tables: TableCheck[];
  columns: ColumnCheck[];
  missingTables: string[];
  missingColumns: Array<{ table: string; column: string }>;
  errors: string[];
}

// Список всех ожидаемых таблиц из schema.prisma и миграций
const EXPECTED_TABLES = [
  'users', 'courses', 'course_sections', 'course_pages', 
  'documentation_sections', 'documentation', 
  'finance_accounts', 'finance_counterparties', 'finance_categories', 
  'finance_projects', 'finance_transactions',
  'deposit_sources', 'deposits', 'analytics', 'articles',
  'content_projects', 'project_permissions',
  'processor_deposits', 'salary_requests', 'salary_earnings_log', 'salary_request_log',
  'bonus_payments', 'bonus_settings', 'processor_shifts', 'shift_settings',
  'shift_penalties', 'salary_settings', 'salary_deposit_grid', 'salary_monthly_bonus',
  'user_shift_assignments', 'bonus_grid', 'bonus_motivations', 'platform_commission',
  'goal_types', 'user_goals', 'goal_stages', 'user_goal_achievements',
  'buyer_projects', 'buyer_daily_logs', 'buyer_requests', 'buyer_bonus_schemes',
  'buyer_bonus_assignments', 'shared_costs', 'shared_cost_allocations',
  'consumable_catalog', 'buyer_signals',
  // Processing system tables (из миграций, но отсутствующие в schema.prisma)
  'processing_instructions', 'processing_scripts', 'processing_templates', 'processing_resources'
];

// Критические колонки для проверки
const CRITICAL_COLUMNS = [
  { table: 'users', column: 'assignedBuyerId' },
  { table: 'users', column: 'leadBuyerId' },
  { table: 'processor_deposits', column: 'platformCommissionPercent' },
  { table: 'processor_deposits', column: 'platformCommissionAmount' },
  { table: 'processor_deposits', column: 'processorEarnings' },
  { table: 'documentation_sections', column: 'projectId' },
  { table: 'goal_types', column: 'unit' },
  { table: 'goal_stages', column: 'targetValue' },
  { table: 'user_goal_achievements', column: 'period' },
];

export async function GET(request: NextRequest) {
  try {
  

    const authResult = await requireAdminAuth(request);
  
    if ('error' in authResult) {
    return authResult.error;
  }
  
  const { user } = authResult;


    await requireAdmin(request);

    const result: DatabaseCheckResult = {
      isHealthy: true,
      tables: [],
      columns: [],
      missingTables: [],
      missingColumns: [],
      errors: []
    };

    // Проверка существования таблиц
    for (const tableName of EXPECTED_TABLES) {
      try {
        const query = `SELECT COUNT(*) as count FROM "${tableName}"`;
        const countResult = await prisma.$queryRawUnsafe(query) as Array<{ count: number }>;
        
        result.tables.push({
          table: tableName,
          exists: true,
          rowCount: Number(countResult[0].count)
        });
      } catch (error: any) {
        result.tables.push({
          table: tableName,
          exists: false,
          rowCount: 0,
          error: error.message
        });
        result.missingTables.push(tableName);
        result.isHealthy = false;
      }
    }

    // Проверка критических колонок
    for (const { table, column } of CRITICAL_COLUMNS) {
      try {
        const query = `
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = $1 AND column_name = $2 AND table_schema = 'public'
        `;
        const columnResult = await prisma.$queryRaw`
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = ${table} AND column_name = ${column} AND table_schema = 'public'
        ` as Array<{ column_name: string; data_type: string }>;

        if (columnResult.length > 0) {
          result.columns.push({
            table,
            column,
            exists: true,
            type: columnResult[0].data_type
          });
        } else {
          result.columns.push({
            table,
            column,
            exists: false,
            error: 'Column not found'
          });
          result.missingColumns.push({ table, column });
          result.isHealthy = false;
        }
      } catch (error: any) {
        result.columns.push({
          table,
          column,
          exists: false,
          error: error.message
        });
        result.missingColumns.push({ table, column });
        result.isHealthy = false;
      }
    }

    // Проверка enum типов
    try {
      const enumsQuery = `
        SELECT enumtypid, enumlabel 
        FROM pg_enum e 
        JOIN pg_type t ON e.enumtypid = t.oid 
        WHERE t.typname IN ('UserRole', 'UserStatus', 'TransactionType', 'DepositStatus', 'SalaryRequestStatus', 'BonusType', 'BonusStatus', 'EarningsType', 'ShiftType', 'ShiftStatus', 'PenaltyStatus', 'PenaltyType', 'MotivationType')
        ORDER BY t.typname, e.enumsortorder
      `;
      
      await prisma.$queryRawUnsafe(enumsQuery);
    } catch (error: any) {
      result.errors.push(`Enum types error: ${error.message}`);
      result.isHealthy = false;
    }

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Database check error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
