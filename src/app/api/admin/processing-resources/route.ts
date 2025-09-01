import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - получение всех ресурсов
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const type = searchParams.get('type');
    const isActive = searchParams.get('isActive');
    const search = searchParams.get('search');

    const where: any = {};

    if (category && category !== 'all') {
      where.category = category;
    }

    if (type && type !== 'all') {
      where.type = type;
    }

    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const resources = await prisma.processing_resources.findMany({
      where,
      orderBy: [
        { order: 'asc' },
        { title: 'asc' }
      ]
    });

    return NextResponse.json({ resources });
  } catch (error) {
    console.error('Ошибка получения ресурсов:', error);
    return NextResponse.json(
      { error: 'Ошибка получения ресурсов' },
      { status: 500 }
    );
  }
}

// POST - создание нового ресурса
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      type,
      url,
      filePath,
      category,
      isActive,
      isPublic,
      targetRoles,
      order
    } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Заголовок обязателен' },
        { status: 400 }
      );
    }

    if (!url && !filePath) {
      return NextResponse.json(
        { error: 'URL или путь к файлу обязателен' },
        { status: 400 }
      );
    }

    const resource = await prisma.processing_resources.create({
      data: {
        title,
        description,
        type: type || 'link',
        url,
        filePath,
        category: category || 'general',
        isActive: isActive !== undefined ? isActive : true,
        isPublic: isPublic !== undefined ? isPublic : true,
        targetRoles: targetRoles ? JSON.stringify(targetRoles) : null,
        order: order || 0
      }
    });

    return NextResponse.json({ resource });
  } catch (error) {
    console.error('Ошибка создания ресурса:', error);
    return NextResponse.json(
      { error: 'Ошибка создания ресурса' },
      { status: 500 }
    );
  }
}

// PUT - обновление ресурса
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      title,
      description,
      type,
      url,
      filePath,
      category,
      isActive,
      isPublic,
      targetRoles,
      order
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID ресурса обязателен' },
        { status: 400 }
      );
    }

    const resource = await prisma.processing_resources.update({
      where: { id },
      data: {
        title,
        description,
        type,
        url,
        filePath,
        category,
        isActive,
        isPublic,
        targetRoles: targetRoles ? JSON.stringify(targetRoles) : null,
        order,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ resource });
  } catch (error) {
    console.error('Ошибка обновления ресурса:', error);
    return NextResponse.json(
      { error: 'Ошибка обновления ресурса' },
      { status: 500 }
    );
  }
}

// DELETE - удаление ресурса
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID ресурса обязателен' },
        { status: 400 }
      );
    }

    await prisma.processing_resources.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Ошибка удаления ресурса:', error);
    return NextResponse.json(
      { error: 'Ошибка удаления ресурса' },
      { status: 500 }
    );
  }
}
