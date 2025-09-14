const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Инициализация проектов контента...');

  try {
    // Создаем проекты контента
    let documentationProject = await prisma.content_projects.findFirst({
      where: { name: 'Основная документация' }
    });
    
    if (!documentationProject) {
      documentationProject = await prisma.content_projects.create({
        data: {
          name: 'Основная документация',
          description: 'Основная документация платформы',
          type: 'documentation',
          isActive: true
        }
      });
    }

    let coursesProject = await prisma.content_projects.findFirst({
      where: { name: 'Обучающие курсы' }
    });
    
    if (!coursesProject) {
      coursesProject = await prisma.content_projects.create({
        data: {
          name: 'Обучающие курсы',
          description: 'Материалы для обучения пользователей',
          type: 'courses',
          isActive: true
        }
      });
    }

    let materialsProject = await prisma.content_projects.findFirst({
      where: { name: 'Справочные материалы' }
    });
    
    if (!materialsProject) {
      materialsProject = await prisma.content_projects.create({
        data: {
          name: 'Справочные материалы',
          description: 'Дополнительные материалы и шаблоны',
          type: 'materials',
          isActive: true
        }
      });
    }

    console.log('✅ Проект контента создан:', documentationProject.name);
    console.log('✅ Проект контента создан:', coursesProject.name);
    console.log('✅ Проект контента создан:', materialsProject.name);

    // Обновляем существующие разделы документации, привязывая их к основному проекту
    const existingSections = await prisma.documentation_sections.findMany({
      where: {
        projectId: null
      }
    });

    if (existingSections.length > 0) {
      await prisma.documentation_sections.updateMany({
        where: {
          projectId: null
        },
        data: {
          projectId: documentationProject.id
        }
      });

      console.log(`✅ Обновлено ${existingSections.length} разделов документации`);
    }

    console.log('🎉 Проекты контента успешно инициализированы!');
  } catch (error) {
    console.error('❌ Ошибка при инициализации проектов контента:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
