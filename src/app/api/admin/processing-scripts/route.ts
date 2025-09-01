import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - получение всех скриптов
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const language = searchParams.get('language');
    const isActive = searchParams.get('isActive');
    const search = searchParams.get('search');

    const where: any = {};

    if (category && category !== 'all') {
      where.category = category;
    }

    if (language && language !== 'all') {
      where.language = language;
    }

    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const scripts = await prisma.processing_scripts.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { title: 'asc' }
      ]
    });

    return NextResponse.json({ scripts });
  } catch (error) {
    console.error('Ошибка получения скриптов:', error);
    return NextResponse.json(
      { error: 'Ошибка получения скриптов' },
      { status: 500 }
    );
  }
}

// POST - создание нового скрипта
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      content,
      description,
      category,
      language,
      isActive,
      isPublic,
      targetRoles
    } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Заголовок и содержание обязательны' },
        { status: 400 }
      );
    }

    const script = await prisma.processing_scripts.create({
      data: {
        title,
        content,
        description,
        category: category || 'general',
        language: language || 'ru',
        isActive: isActive !== undefined ? isActive : true,
        isPublic: isPublic !== undefined ? isPublic : true,
        targetRoles: targetRoles ? JSON.stringify(targetRoles) : null
      }
    });

    return NextResponse.json({ script });
  } catch (error) {
    console.error('Ошибка создания скрипта:', error);
    return NextResponse.json(
      { error: 'Ошибка создания скрипта' },
      { status: 500 }
    );
  }
}

// PUT - обновление скрипта
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      title,
      content,
      description,
      category,
      language,
      isActive,
      isPublic,
      targetRoles
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID скрипта обязателен' },
        { status: 400 }
      );
    }

    const script = await prisma.processing_scripts.update({
      where: { id },
      data: {
        title,
        content,
        description,
        category,
        language,
        isActive,
        isPublic,
        targetRoles: targetRoles ? JSON.stringify(targetRoles) : null,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ script });
  } catch (error) {
    console.error('Ошибка обновления скрипта:', error);
    return NextResponse.json(
      { error: 'Ошибка обновления скрипта' },
      { status: 500 }
    );
  }
}

// DELETE - удаление скрипта
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID скрипта обязателен' },
        { status: 400 }
      );
    }

    await prisma.processing_scripts.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Ошибка удаления скрипта:', error);
    return NextResponse.json(
      { error: 'Ошибка удаления скрипта' },
      { status: 500 }
    );
  }
}
