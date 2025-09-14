import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const ADMIN_USERS = [
  {
    id: 'fcd2b89e-745a-4016-8cd2-b89e745a3016',
    email: 'admin@umbra-platform.dev',
    name: 'Administrator',
    password: '$2b$12$w7YrpSGjLiUW5L3hMZwrtelLA7ivcE7hmvkCuOdWoqv7gUSTzKZ/C',
    telegram: '@admin',
    role: 'ADMIN' as const,
    status: 'APPROVED' as const,
    isBlocked: false
  },
  {
    id: '16fcd2b8-9e74-4a30-86fc-d2b89e745a30',
    email: 'aa@tmteam.kz',
    name: 'aa aa',
    password: '$2b$10$Vtokr3FGXw7EbPeIjihSqeANtD1Sy3eqiqjIp2yXrT3fYXAbtYsc.',
    telegram: '@aaaaaaa',
    role: 'ADMIN' as const,
    status: 'APPROVED' as const,
    isBlocked: false
  }
];

const PROCESSOR_USERS = [
  {
    id: '89e745a3-016f-4d2b-89e7-45a3016fcd2c',
    email: 'vasiapupkintop977@gmail.com',
    name: 'Роман',
    password: '$2b$10$nsQ/OvnVFFk6g5SN3.MD3uIyfBxrnrdGQr445dBa7YZzQPpWxZkK6',
    telegram: '@rdsrtv',
    role: 'PROCESSOR' as const,
    status: 'APPROVED' as const,
    isBlocked: false
  },
  {
    id: 'a3016fcd-2b89-4745-8301-6fcd2b89e745',
    email: 'luxurykilldd@gmail.com',
    name: 'Эл',
    password: '$2b$10$5sjIZ/jzlffos4ft6lvRW.QDBHyjyXEISAYBCAhu1iijnQxKtdgO6',
    telegram: '@tg_piug',
    role: 'PROCESSOR' as const,
    status: 'APPROVED' as const,
    isBlocked: false
  },
  {
    id: '3016fcd2-b89e-445a-8016-fcd2b89e745a',
    email: 'kimxbeng@gmail.com',
    name: 'Lyuto',
    password: '$2b$10$f3zO10pjmxyiil3kx8izDOGUYOAVSc9TJYGJq.1g1WeQwHO51IBXe',
    telegram: '@lyuto2',
    role: 'PROCESSOR' as const,
    status: 'APPROVED' as const,
    isBlocked: false
  }
];

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Начинаем быструю миграцию пользователей...');

    const allUsers = [...ADMIN_USERS, ...PROCESSOR_USERS];
    let created = 0;
    let updated = 0;

    for (const userData of allUsers) {
      try {
        const result = await prisma.users.upsert({
          where: { email: userData.email },
          update: {
            name: userData.name,
            password: userData.password,
            telegram: userData.telegram,
            role: userData.role,
            status: userData.status,
            isBlocked: userData.isBlocked,
            updatedAt: new Date()
          },
          create: {
            ...userData,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });

        if (result.createdAt.getTime() === result.updatedAt.getTime()) {
          created++;
          console.log(`✨ Создан: ${userData.email}`);
        } else {
          updated++;
          console.log(`↻ Обновлен: ${userData.email}`);
        }
      } catch (error) {
        console.error(`❌ Ошибка для ${userData.email}:`, error);
      }
    }

    const totalUsers = await prisma.users.count();
    const usersByRole = await prisma.users.groupBy({
      by: ['role'],
      _count: true
    });

    const stats = {
      created,
      updated,
      totalUsers,
      usersByRole: usersByRole.map(group => ({
        role: group.role,
        count: group._count
      }))
    };

    console.log('🎉 Быстрая миграция завершена!', stats);

    return NextResponse.json({
      success: true,
      message: 'Ключевые пользователи успешно мигрированы!',
      stats
    });

  } catch (error) {
    console.error('❌ Ошибка миграции:', error);
    return NextResponse.json({
      success: false,
      error: 'Ошибка выполнения миграции',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const totalUsers = await prisma.users.count();
    const usersByRole = await prisma.users.groupBy({
      by: ['role', 'status'],
      _count: true
    });

    return NextResponse.json({
      totalUsers,
      usersByRole: usersByRole.map(group => ({
        role: group.role,
        status: group.status,
        count: group._count
      }))
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Ошибка получения статистики',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
