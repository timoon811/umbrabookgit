import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // Временно отключена проверка для инициализации
    // const { secret } = await request.json();
    // if (secret !== "umbra_deploy_secret_2024") {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }


    // Создаем администратора
    const adminPassword = await bcrypt.hash("umbra2024", 10);
    const admin = await prisma.users.upsert({
      where: { email: "admin@umbra-platform.dev" },
      update: {},
      create: {
        email: "admin@umbra-platform.dev",
        name: "Umbra Platform Admin",
        password: adminPassword,
        telegram: "@umbra_admin",
        role: "ADMIN",
        status: "APPROVED",
      },
    });


    // Создаем пользователя
    const userPassword = await bcrypt.hash("user123", 10);
    const user = await prisma.users.upsert({
      where: { email: "user@umbra-platform.dev" },
      update: {},
      create: {
        email: "user@umbra-platform.dev",
        name: "Test User",
        password: userPassword,
        telegram: "@test_user",
        role: "USER",
        status: "APPROVED",
      },
    });


    // Создаем разделы документации
    const documentationSections = [
      {
        name: "Начало работы",
        key: "getting-started",
        description: "Базовое руководство по началу работы с платформой",
        order: 1,
        isVisible: true,
      },
      {
        name: "Установка",
        key: "installation",
        description: "Пошаговая инструкция по установке платформы",
        order: 2,
        isVisible: true,
      },
      {
        name: "API справочник",
        key: "api-reference",
        description: "Полный справочник по API платформы",
        order: 3,
        isVisible: true,
      },
    ];

    // Создаем разделы и сохраняем их ID
    const createdSections = new Map<string, string>();
    
    for (const section of documentationSections) {
      const createdSection = await prisma.documentation_sections.upsert({
        where: { key: section.key },
        update: section,
        create: section,
      });
      createdSections.set(section.key, createdSection.id);
    }

    // Создаем страницы документации
    const documentationPages = [
      {
        title: "Начало работы с Umbra Platform",
        description: "Базовое руководство по началу работы с платформой",
        slug: "getting-started",
        content: JSON.stringify([
          {
            type: "heading",
            level: 1,
            content: "Добро пожаловать в Umbra Platform"
          },
          {
            type: "paragraph",
            content: "Umbra Platform - это современная платформа для управления документацией, курсами и образовательным контентом."
          }
        ]),
        sectionId: createdSections.get("getting-started")!,
        order: 1,
        isPublished: true,
      },
      {
        title: "Установка и настройка",
        description: "Пошаговая инструкция по установке платформы",
        slug: "installation", 
        content: JSON.stringify([
          {
            type: "heading",
            level: 1,
            content: "Установка Umbra Platform"
          },
          {
            type: "paragraph",
            content: "Следуйте этим шагам для установки платформы на вашем сервере."
          }
        ]),
        sectionId: createdSections.get("installation")!,
        order: 2,
        isPublished: true,
      },
      {
        title: "API справочник",
        description: "Полный справочник по API платформы",
        slug: "api-reference",
        content: JSON.stringify([
          {
            type: "heading",
            level: 1,
            content: "API Справочник"
          },
          {
            type: "paragraph",
            content: "Полная документация по API endpoints платформы."
          }
        ]),
        sectionId: createdSections.get("api-reference")!,
        order: 3,
        isPublished: false,
      },
    ];

    for (const page of documentationPages) {
      await prisma.documentation.upsert({
        where: { slug: page.slug },
        update: page,
        create: page,
      });
    }


    return NextResponse.json({ 
      success: true, 
      message: "База данных успешно заполнена документацией и пользователями!" 
    });

  } catch (error) {
    console.error("❌ Ошибка при заполнении БД:", error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
