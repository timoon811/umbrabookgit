import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    console.log("🔄 Начинаем миграцию пользователей...");

    // Очищаем существующих пользователей
    await prisma.users.deleteMany({});
    
    // Создаем пользователей из локальной базы
    const users = [
      {
        id: 'cmf0yd2c40005nw2nv1m0hq5g',
        email: 'vasiapupkintop977@gmail.com',
        name: 'Роман',
        password: '$2b$10$nsQ/OvnVFFk6g5SN3.MD3uIyfBxrnrdGQr445dBa7YZzQPpWxZkK6',
        telegram: '@rdsrtv',
        role: 'PROCESSOR',
        status: 'APPROVED',
        isBlocked: false,
        createdAt: new Date('2025-09-01T07:04:21.652Z'),
        updatedAt: new Date('2025-09-07T18:19:37.864Z')
      },
      {
        id: 'cmey694vg0000i82fga7hji1h',
        email: 'admin@umbra-platform.dev',
        name: 'Administrator',
        password: '$2b$12$w7YrpSGjLiUW5L3hMZwrtelLA7ivcE7hmvkCuOdWoqv7gUSTzKZ/C',
        telegram: '@admin',
        role: 'ADMIN',
        status: 'APPROVED',
        isBlocked: false,
        createdAt: new Date('2025-08-30T08:21:56.716Z'),
        updatedAt: new Date('2025-08-30T08:21:56.716Z')
      },
      {
        id: 'cmeya1g4c0000jv2rdq0jt2u2',
        email: 'aa@tmteam.kz',
        name: 'aa aa',
        password: '$2b$10$Vtokr3FGXw7EbPeIjihSqeANtD1Sy3eqiqjIp2yXrT3fYXAbtYsc.',
        telegram: '@aaaaaaa',
        role: 'ADMIN',
        status: 'APPROVED',
        isBlocked: false,
        createdAt: new Date('2025-08-30T10:07:56.508Z'),
        updatedAt: new Date('2025-08-30T11:00:10.851Z')
      },
      {
        id: 'cmf2gxnux0008n42svwfkv75b',
        email: 'luxurykilldd@gmail.com',
        name: 'Эл',
        password: '$2b$10$5sjIZ/jzlffos4ft6lvRW.QDBHyjyXEISAYBCAhu1iijnQxKtdgO6',
        telegram: '@tg_piug',
        role: 'PROCESSOR',
        status: 'APPROVED',
        isBlocked: false,
        createdAt: new Date('2025-09-02T08:32:01.929Z'),
        updatedAt: new Date('2025-09-08T15:18:50.072Z')
      },
      {
        id: 'cmf25f3x10002n42sc4xr135d',
        email: 'kimxbeng@gmail.com',
        name: 'Lyuto',
        password: '$2b$10$f3zO10pjmxyiil3kx8izDOGUYOAVSc9TJYGJq.1g1WeQwHO51IBXe',
        telegram: '@lyuto2',
        role: 'PROCESSOR',
        status: 'APPROVED',
        isBlocked: false,
        createdAt: new Date('2025-09-02T03:09:40.501Z'),
        updatedAt: new Date('2025-09-08T15:51:46.740Z')
      }
    ];

    // Создаем пользователей
    for (const user of users) {
      await prisma.users.create({
        data: user
      });
      console.log(`✅ Создан пользователь: ${user.email}`);
    }

    console.log(`🎉 Миграция завершена! Создано ${users.length} пользователей`);

    return NextResponse.json({ 
      success: true, 
      message: `Успешно мигрировано ${users.length} пользователей`,
      users: users.map(u => ({ email: u.email, name: u.name, role: u.role }))
    });

  } catch (error: any) {
    console.error("❌ Ошибка при миграции пользователей:", error);
    return NextResponse.json({ 
      error: 'Migration failed', 
      details: error.message 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
