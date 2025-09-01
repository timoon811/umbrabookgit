import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - получение всех инструкций
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const isActive = searchParams.get('isActive');
    const search = searchParams.get('search');

    const where: any = {};

    if (category && category !== 'all') {
      where.category = category;
    }

    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    const instructions = await prisma.processing_instructions.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json({ instructions });
  } catch (error) {
    console.error('Ошибка получения инструкций:', error);
    return NextResponse.json(
      { error: 'Ошибка получения инструкций' },
      { status: 500 }
    );
  }
}

// POST - создание новой инструкции
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      content,
      category,
      priority,
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

    const instruction = await prisma.processing_instructions.create({
      data: {
        title,
        content,
        category: category || 'general',
        priority: priority || 1,
        isActive: isActive !== undefined ? isActive : true,
        isPublic: isPublic !== undefined ? isPublic : true,
        targetRoles: targetRoles ? JSON.stringify(targetRoles) : null
      }
    });

    return NextResponse.json({ instruction });
  } catch (error) {
    console.error('Ошибка создания инструкции:', error);
    return NextResponse.json(
      { error: 'Ошибка создания инструкции' },
      { status: 500 }
    );
  }
}

// PUT - обновление инструкции
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      title,
      content,
      category,
      priority,
      isActive,
      isPublic,
      targetRoles
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID инструкции обязателен' },
        { status: 400 }
      );
    }

    const instruction = await prisma.processing_instructions.update({
      where: { id },
      data: {
        title,
        content,
        category,
        priority,
        isActive,
        isPublic,
        targetRoles: targetRoles ? JSON.stringify(targetRoles) : null,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ instruction });
  } catch (error) {
    console.error('Ошибка обновления инструкции:', error);
    return NextResponse.json(
      { error: 'Ошибка обновления инструкции' },
      { status: 500 }
    );
  }
}

// DELETE - удаление инструкции
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID инструкции обязателен' },
        { status: 400 }
      );
    }

    await prisma.processing_instructions.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Ошибка удаления инструкции:', error);
    return NextResponse.json(
      { error: 'Ошибка удаления инструкции' },
      { status: 500 }
    );
  }
}
