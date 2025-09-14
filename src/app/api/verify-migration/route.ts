import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    console.log("🔍 Проверяем результаты миграции...");

    // Подсчитываем количество записей
    const userCount = await prisma.users.count();
    const docsCount = await prisma.documentation.count();
    const sectionsCount = await prisma.documentation_sections.count();
    const projectsCount = await prisma.content_projects.count();

    // Получаем примеры записей
    const sampleUsers = await prisma.users.findMany({
      take: 3,
      select: {
        email: true,
        name: true,
        role: true,
        status: true
      }
    });

    const sampleDocs = await prisma.documentation.findMany({
      take: 3,
      select: {
        title: true,
        slug: true,
        isPublished: true
      }
    });

    const sampleSections = await prisma.documentation_sections.findMany({
      take: 3,
      select: {
        name: true,
        key: true,
        order: true
      }
    });

    console.log(`✅ Найдено: ${userCount} пользователей, ${docsCount} документов, ${sectionsCount} разделов`);

    return NextResponse.json({ 
      success: true,
      migration_results: {
        users: {
          count: userCount,
          samples: sampleUsers
        },
        documentation: {
          count: docsCount,
          samples: sampleDocs
        },
        sections: {
          count: sectionsCount,
          samples: sampleSections
        },
        projects: {
          count: projectsCount
        }
      },
      message: `Миграция завершена успешно! Всего: ${userCount} пользователей, ${docsCount} документов, ${sectionsCount} разделов, ${projectsCount} проектов`
    });

  } catch (error: any) {
    console.error("❌ Ошибка при проверке миграции:", error);
    return NextResponse.json({ 
      error: 'Verification failed', 
      details: error.message 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
