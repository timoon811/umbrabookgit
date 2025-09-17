import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '@/lib/api-auth';

const prisma = new PrismaClient();

export async function GET() {
  try {
  

    const authResult = await requireAuth(request);
  
    if ('error' in authResult) {
    return authResult.error;
  }
  
  const { user } = authResult;



    // Очищаем существующую документацию
    await prisma.documentation.deleteMany({});
    await prisma.documentation_sections.deleteMany({});
    
    // Сначала создаем проект
    const project = await prisma.content_projects.upsert({
      where: { id: 'e0c3c4d9-01fa-48b3-bc2f-f2046e64085e' },
      update: {},
      create: {
        id: 'e0c3c4d9-01fa-48b3-bc2f-f2046e64085e',
        name: 'Umbra Platform Documentation',
        description: 'Основная документация платформы',
        type: 'DOCUMENTATION',
        isActive: true,
        createdAt: new Date('2025-08-30T08:21:56.716Z'),
        updatedAt: new Date('2025-08-30T08:21:56.716Z')
      }
    });

    // Создаем разделы документации
    const sections = [
      {
        id: '4e929b8b-912e-45f7-9af0-6a2d7070b875',
        name: 'Umbra platform',
        key: 'section-1',
        description: 'Автоматически созданный раздел section1',
        order: 0,
        isVisible: true,
        projectId: 'e0c3c4d9-01fa-48b3-bc2f-f2046e64085e',
        createdAt: new Date('2025-08-30T08:26:35.322Z'),
        updatedAt: new Date('2025-09-04T08:51:31.772Z')
      },
      {
        id: '9a0bbfe8-bcb0-4999-8d64-714a735952d9',
        name: 'Частые вопросы',
        key: 'section-8',
        description: 'Автоматически созданный раздел section1',
        order: 8,
        isVisible: true,
        projectId: 'e0c3c4d9-01fa-48b3-bc2f-f2046e64085e',
        createdAt: new Date('2025-09-03T15:50:00.944Z'),
        updatedAt: new Date('2025-09-04T08:51:31.772Z')
      },
      {
        id: '7a6b5b69-0794-4245-b7ec-6ff263aa5989',
        name: 'Работа',
        key: 'section-6',
        description: 'Автоматически созданный раздел section1',
        order: 1,
        isVisible: true,
        projectId: 'e0c3c4d9-01fa-48b3-bc2f-f2046e64085e',
        createdAt: new Date('2025-08-30T11:56:36.515Z'),
        updatedAt: new Date('2025-09-04T08:51:31.772Z')
      },
      {
        id: 'fbb49d88-165f-4bc9-812d-2ba63dca3ebc',
        name: 'Это база',
        key: 'section-9',
        description: 'Автоматически созданный раздел section1',
        order: 2,
        isVisible: true,
        projectId: 'e0c3c4d9-01fa-48b3-bc2f-f2046e64085e',
        createdAt: new Date('2025-09-04T08:50:31.340Z'),
        updatedAt: new Date('2025-09-04T08:51:31.772Z')
      },
      {
        id: 'd3bdc450-4af7-4441-bfaa-268375b7ad60',
        name: 'YouTube Shorts',
        key: 'section-2',
        description: 'Автоматически созданный раздел section1',
        order: 3,
        isVisible: true,
        projectId: 'e0c3c4d9-01fa-48b3-bc2f-f2046e64085e',
        createdAt: new Date('2025-08-30T11:00:33.707Z'),
        updatedAt: new Date('2025-09-04T08:51:31.773Z')
      },
      {
        id: '9481fea5-3613-4df7-96d3-32490d1d4d78',
        name: 'УБТ Tik-Tok',
        key: 'section-3',
        description: 'Автоматически созданный раздел section1',
        order: 4,
        isVisible: true,
        projectId: 'e0c3c4d9-01fa-48b3-bc2f-f2046e64085e',
        createdAt: new Date('2025-08-30T11:00:46.235Z'),
        updatedAt: new Date('2025-09-04T08:51:31.773Z')
      }
    ];

    for (const section of sections) {
      await prisma.documentation_sections.create({
        data: section
      });
    }

    // Создаем документы
    const docs = [
      {
        id: '8cf6b896-c79c-4a33-825f-15c6a9f103b6',
        title: 'Где взять домен?',
        description: 'page-18',
        slug: 'page-18',
        content: 'porkbun.com\nНадежный, проверенный, анонимный регистратор доменов. Возможна оплата с крипты или арендных карт. Быстрое обновление NS.\n\nЕсли вяжешь к какому-либо серверу - не забудь прокинуть его через cloudflare',
        sectionId: '9a0bbfe8-bcb0-4999-8d64-714a735952d9',
        order: 3,
        isPublished: true,
        createdAt: new Date('2025-09-03T15:50:14.565Z'),
        updatedAt: new Date('2025-09-04T13:02:17.589Z')
      },
      {
        id: 'e3dfbe29-b8a0-43ad-bebe-3ead3e213d99',
        title: 'Где купить прокси? Какие прокси покупать?',
        description: 'page-22',
        slug: 'page-22',
        content: 'proxyline.net\nmobileproxy.space\nproxyempire.io\n\nПодробнее о том какие именно прокси брать смотри в Facebook Ads -> Step-By-Step Guide: раздел Прокси',
        sectionId: '9a0bbfe8-bcb0-4999-8d64-714a735952d9',
        order: 2,
        isPublished: true,
        createdAt: new Date('2025-09-03T15:52:03.049Z'),
        updatedAt: new Date('2025-09-04T13:02:20.156Z')
      },
      {
        id: 'f40be597-ec98-431f-ad04-82585afc4d08',
        title: 'С какого сорса начать? Какие источники используете?',
        description: 'page-21',
        slug: 'page-21',
        content: 'Если ты задаешь такой вопрос, то в таком случае лучше точно не начинать с платных источников трафика. Стоит попробовать УБТ Шортс, Рилс или Тикток. Как начать лить убт с этих источников смотри в соответвующей вкладке.\n\n\nМы используем разные источники УБТ шортс, рилс, тикток, самые большие обьемы у нас из FB, но все мы начинали с УБТ',
        sectionId: '9a0bbfe8-bcb0-4999-8d64-714a735952d9',
        order: 0,
        isPublished: true,
        createdAt: new Date('2025-09-03T15:50:56.768Z'),
        updatedAt: new Date('2025-09-04T13:15:16.764Z')
      }
    ];

    for (const doc of docs) {
      await prisma.documentation.create({
        data: doc
      });
    }


    return NextResponse.json({ 
      success: true, 
      message: `Успешно мигрировано ${sections.length} разделов и ${docs.length} документов`,
      sections: sections.map(s => ({ name: s.name, key: s.key })),
      docs: docs.map(d => ({ title: d.title, slug: d.slug }))
    });

  } catch (error: any) {
    console.error("❌ Ошибка при миграции документации:", error);
    return NextResponse.json({ 
      error: 'Migration failed', 
      details: error.message 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
