const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function initProjectPermissions() {
  try {
    console.log('Инициализация прав доступа для существующих проектов...');

    // Получаем все проекты
    const projects = await prisma.content_projects.findMany({
      where: {
        isActive: true
      }
    });

    console.log(`Найдено проектов: ${projects.length}`);

    for (const project of projects) {
      // Проверяем, есть ли уже права для этого проекта
      const existingPermissions = await prisma.project_permissions.findMany({
        where: {
          projectId: project.id
        }
      });

      if (existingPermissions.length === 0) {
        // Создаем права доступа по умолчанию только для ADMIN
        await prisma.project_permissions.create({
          data: {
            projectId: project.id,
            role: 'ADMIN'
          }
        });
        
        console.log(`✓ Добавлены права доступа для проекта: ${project.name}`);
      } else {
        console.log(`- Права доступа уже существуют для проекта: ${project.name}`);
      }
    }

    console.log('Инициализация прав доступа завершена!');
  } catch (error) {
    console.error('Ошибка инициализации прав доступа:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

initProjectPermissions();
