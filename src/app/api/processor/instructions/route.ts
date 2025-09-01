import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - получение инструкций и скриптов для процессора
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const type = searchParams.get('type');

    // Получаем инструкции
    const instructionsWhere: any = {
      isActive: true,
      isPublic: true
    };

    if (category && category !== 'all') {
      instructionsWhere.category = category;
    }

    const instructions = await prisma.processing_instructions.findMany({
      where: instructionsWhere,
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    // Получаем скрипты
    const scriptsWhere: any = {
      isActive: true,
      isPublic: true
    };

    if (type && type !== 'all') {
      scriptsWhere.category = type;
    }

    const scripts = await prisma.processing_scripts.findMany({
      where: scriptsWhere,
      orderBy: [
        { category: 'asc' },
        { title: 'asc' }
      ]
    });

    // Получаем ресурсы
    const resources = await prisma.processing_resources.findMany({
      where: {
        isActive: true,
        isPublic: true
      },
      orderBy: [
        { order: 'asc' },
        { title: 'asc' }
      ]
    });

    // Получаем шаблоны
    const templates = await prisma.processing_templates.findMany({
      where: {
        isActive: true,
        isPublic: true
      },
      orderBy: [
        { type: 'asc' },
        { name: 'asc' }
      ]
    });

    return NextResponse.json({
      instructions,
      scripts,
      resources,
      templates
    });
  } catch (error) {
    console.error('Ошибка получения материалов:', error);
    return NextResponse.json(
      { error: 'Ошибка получения материалов' },
      { status: 500 }
    );
  }
}
