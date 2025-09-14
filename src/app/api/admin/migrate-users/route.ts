import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Данные пользователей для миграции
const USERS_DATA = [
  // Администраторы
  {
    id: 'fcd2b89e-745a-4016-8cd2-b89e745a3016',
    email: 'admin@umbra-platform.dev',
    name: 'Administrator',
    password: '$2b$12$w7YrpSGjLiUW5L3hMZwrtelLA7ivcE7hmvkCuOdWoqv7gUSTzKZ/C',
    telegram: '@admin',
    role: 'ADMIN' as const,
    status: 'APPROVED' as const,
    isBlocked: false,
    createdAt: new Date('2025-08-30 11:21:56.716'),
    updatedAt: new Date('2025-08-30 11:21:56.716')
  },
  {
    id: '16fcd2b8-9e74-4a30-86fc-d2b89e745a30',
    email: 'aa@tmteam.kz',
    name: 'aa aa',
    password: '$2b$10$Vtokr3FGXw7EbPeIjihSqeANtD1Sy3eqiqjIp2yXrT3fYXAbtYsc.',
    telegram: '@aaaaaaa',
    role: 'ADMIN' as const,
    status: 'APPROVED' as const,
    isBlocked: false,
    createdAt: new Date('2025-08-30 13:07:56.508'),
    updatedAt: new Date('2025-08-30 14:00:10.851')
  },
  {
    id: '5a3016fc-d2b8-4e74-8a30-16fcd2b89e74',
    email: 'lannt050@gmail.com',
    name: 'lannt',
    password: '$2b$10$j/DUv.NiRbfo1dH3nknxue/Us9jYg4dsXVKvoRv8AXR3jT0Iugpnq',
    telegram: '@lannt12',
    role: 'ADMIN' as const,
    status: 'APPROVED' as const,
    isBlocked: false,
    createdAt: new Date('2025-09-02 06:29:27.226'),
    updatedAt: new Date('2025-09-03 16:47:28.937')
  },
  {
    id: 'b89e745a-3016-4cd2-889e-745a3016fcd2',
    email: 'ccc@xyu.kz',
    name: 'Caroline',
    password: '$2b$10$x/q0dqBcKwb3bBB2vgrhY.5Fn222yuZtgVXA1EYPkadksYHfezP3q',
    telegram: '@hennessyo',
    role: 'ADMIN' as const,
    status: 'APPROVED' as const,
    isBlocked: false,
    createdAt: new Date('2025-09-02 13:19:01.42'),
    updatedAt: new Date('2025-09-12 19:07:37.546')
  },
  {
    id: '89e745a3-016f-4d2b-89e7-45a3016fcd2b',
    email: 'dokke.naz@icloud.com',
    name: 'Nazar',
    password: '$2b$10$pE1zf3pbRjwAeiQLt6P3q.fnWb8pLezUHj3SPcmn2tbXkMeOqdPo.',
    telegram: '@dark_sidely',
    role: 'ADMIN' as const,
    status: 'APPROVED' as const,
    isBlocked: false,
    createdAt: new Date('2025-09-07 04:35:54.967'),
    updatedAt: new Date('2025-09-12 19:11:35.344')
  },
  // Процессоры
  {
    id: '89e745a3-016f-4d2b-89e7-45a3016fcd2c',
    email: 'vasiapupkintop977@gmail.com',
    name: 'Роман',
    password: '$2b$10$nsQ/OvnVFFk6g5SN3.MD3uIyfBxrnrdGQr445dBa7YZzQPpWxZkK6',
    telegram: '@rdsrtv',
    role: 'PROCESSOR' as const,
    status: 'APPROVED' as const,
    isBlocked: false,
    createdAt: new Date('2025-09-01 10:04:21.652'),
    updatedAt: new Date('2025-09-07 21:19:37.864')
  },
  {
    id: 'a3016fcd-2b89-4745-8301-6fcd2b89e745',
    email: 'luxurykilldd@gmail.com',
    name: 'Эл',
    password: '$2b$10$5sjIZ/jzlffos4ft6lvRW.QDBHyjyXEISAYBCAhu1iijnQxKtdgO6',
    telegram: '@tg_piug',
    role: 'PROCESSOR' as const,
    status: 'APPROVED' as const,
    isBlocked: false,
    createdAt: new Date('2025-09-02 11:32:01.929'),
    updatedAt: new Date('2025-09-08 18:18:50.072')
  },
  {
    id: '3016fcd2-b89e-445a-8016-fcd2b89e745a',
    email: 'kimxbeng@gmail.com',
    name: 'Lyuto',
    password: '$2b$10$f3zO10pjmxyiil3kx8izDOGUYOAVSc9TJYGJq.1g1WeQwHO51IBXe',
    telegram: '@lyuto2',
    role: 'PROCESSOR' as const,
    status: 'APPROVED' as const,
    isBlocked: false,
    createdAt: new Date('2025-09-02 06:09:40.501'),
    updatedAt: new Date('2025-09-08 18:51:46.74')
  },
  {
    id: '5a3016fc-d2b8-4e74-8a30-16fcd2b89e75',
    email: 'peekaboo1444@gmail.com',
    name: 'Талгат',
    password: '$2b$10$uMWLblx3mLaX9S7B4lylv.9fcUQg2feBsfjb40PUOcrIbK5aih2m6',
    telegram: '@talgat010',
    role: 'PROCESSOR' as const,
    status: 'APPROVED' as const,
    isBlocked: false,
    createdAt: new Date('2025-09-01 21:07:54.177'),
    updatedAt: new Date('2025-09-01 21:25:54.165')
  }
];

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Начинаем миграцию пользователей...');

    // Проверяем что вызов идет локально или от админа
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    
    if (secret !== 'migrate_users_umbra_2024') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let created = 0;
    let updated = 0;
    let errors = 0;

    // Выполняем миграцию в транзакции
    const result = await prisma.$transaction(async (tx) => {
      for (const userData of USERS_DATA) {
        try {
          // Проверяем существует ли пользователь
          const existingUser = await tx.users.findUnique({
            where: { email: userData.email }
          });

          if (existingUser) {
            // Обновляем существующего
            await tx.users.update({
              where: { email: userData.email },
              data: {
                name: userData.name,
                password: userData.password,
                telegram: userData.telegram,
                role: userData.role,
                status: userData.status,
                isBlocked: userData.isBlocked,
                updatedAt: userData.updatedAt
              }
            });
            updated++;
            console.log(`✅ Обновлен: ${userData.email}`);
          } else {
            // Создаем нового
            await tx.users.create({
              data: userData
            });
            created++;
            console.log(`✨ Создан: ${userData.email}`);
          }
        } catch (error) {
          console.error(`❌ Ошибка для ${userData.email}:`, error);
          errors++;
        }
      }

      return { created, updated, errors };
    });

    // Получаем финальную статистику
    const totalUsers = await prisma.users.count();
    const usersByRole = await prisma.users.groupBy({
      by: ['role'],
      _count: true
    });

    console.log('🎉 Миграция завершена!');
    console.log(`Создано: ${result.created}, Обновлено: ${result.updated}, Ошибок: ${result.errors}`);

    return NextResponse.json({
      success: true,
      message: 'Миграция пользователей выполнена успешно!',
      stats: {
        created: result.created,
        updated: result.updated,
        errors: result.errors,
        totalUsers,
        usersByRole: usersByRole.map(group => ({
          role: group.role,
          count: group._count
        }))
      }
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

// GET метод для проверки статуса
export async function GET(request: NextRequest) {
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
