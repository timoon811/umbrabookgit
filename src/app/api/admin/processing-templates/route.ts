import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - получение всех шаблонов
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const isActive = searchParams.get('isActive');
    const search = searchParams.get('search');

    const where: any = {};

    if (type && type !== 'all') {
      where.type = type;
    }

    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    const templates = await prisma.processing_templates.findMany({
      where,
      orderBy: [
        { type: 'asc' },
        { name: 'asc' }
      ]
    });

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Ошибка получения шаблонов:', error);
    return NextResponse.json(
      { error: 'Ошибка получения шаблонов' },
      { status: 500 }
    );
  }
}

// POST - создание нового шаблона
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      content,
      type,
      variables,
      isActive,
      isPublic,
      targetRoles
    } = body;

    if (!name || !content) {
      return NextResponse.json(
        { error: 'Название и содержание обязательны' },
        { status: 400 }
      );
    }

    const template = await prisma.processing_templates.create({
      data: {
        name,
        description,
        content,
        type: type || 'email',
        variables: variables ? JSON.stringify(variables) : null,
        isActive: isActive !== undefined ? isActive : true,
        isPublic: isPublic !== undefined ? isPublic : true,
        targetRoles: targetRoles ? JSON.stringify(targetRoles) : null
      }
    });

    return NextResponse.json({ template });
  } catch (error) {
    console.error('Ошибка создания шаблона:', error);
    return NextResponse.json(
      { error: 'Ошибка создания шаблона' },
      { status: 500 }
    );
  }
}

// PUT - обновление шаблона
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      name,
      description,
      content,
      type,
      variables,
      isActive,
      isPublic,
      targetRoles
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID шаблона обязателен' },
        { status: 400 }
      );
    }

    const template = await prisma.processing_templates.update({
      where: { id },
      data: {
        name,
        description,
        content,
        type,
        variables: variables ? JSON.stringify(variables) : null,
        isActive,
        isPublic,
        targetRoles: targetRoles ? JSON.stringify(targetRoles) : null,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ template });
  } catch (error) {
    console.error('Ошибка обновления шаблона:', error);
    return NextResponse.json(
      { error: 'Ошибка обновления шаблона' },
      { status: 500 }
    );
  }
}

// DELETE - удаление шаблона
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID шаблона обязателен' },
        { status: 400 }
      );
    }

    await prisma.processing_templates.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Ошибка удаления шаблона:', error);
    return NextResponse.json(
      { error: 'Ошибка удаления шаблона' },
      { status: 500 }
    );
  }
}
