import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

// Интерфейсы для типизации
interface DocumentationResult {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  sectionId: string | null;
  content: string | null;
}




// Функция для подсчета релевантности результата
function calculateRelevance(title: string, content: string | null, query: string): number {
  const queryLower = query.toLowerCase();
  const titleLower = title.toLowerCase();
  const contentLower = content?.toLowerCase() || '';
  
  let score = 0;
  
  // Поиск по заголовку (высший приоритет)
  if (titleLower.includes(queryLower)) {
    score += 100;
    
    // Бонус за точное совпадение в начале заголовка
    if (titleLower.startsWith(queryLower)) {
      score += 50;
    }
    
    // Бонус за совпадение слова целиком
    const titleWords = titleLower.split(/\s+/);
    const queryWords = queryLower.split(/\s+/);
    queryWords.forEach(word => {
      if (titleWords.includes(word)) {
        score += 30;
      }
    });
  }
  
  // Поиск по контенту
  if (contentLower.includes(queryLower)) {
    score += 20;
    
    // Бонус за частоту встречаемости
    const matches = (contentLower.match(new RegExp(queryLower, 'gi')) || []).length;
    score += Math.min(matches * 5, 30); // Максимум 30 баллов за частоту
  }
  
  // Бонус за длину совпадения (более длинные запросы = более точные)
  score += queryLower.length * 2;
  
  return score;
}

export async function GET(request: NextRequest) {
  // Проверяем авторизацию - поиск теперь требует авторизации
  const authResult = await requireAuth(request);
  if ('error' in authResult) {
    return authResult.error;
  }

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const type = searchParams.get('type'); // 'all', 'docs'
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!query || query.trim().length < 2) {
      return NextResponse.json([]);
    }

    const searchTerm = query.trim();

    const results: Array<{
      id: string;
      title: string;
      description?: string | null;
      slug: string;
      type: 'documentation' | 'course';
      url: string;
      displayTitle: string;
      section?: string;
      relevance: number;
    }> = [];

    // Поиск в документации
    if (type !== 'none') {
      const docsResults = await prisma.documentation.findMany({
        where: {
          OR: [
            { title: { contains: searchTerm } },
            { description: { contains: searchTerm } },
            { content: { contains: searchTerm } },
            { slug: { contains: searchTerm } },
          ],
          isPublished: true,
        },
        select: {
          id: true,
          title: true,
          description: true,
          slug: true,
          sectionId: true,
          content: true,
        },
        take: limit * 2, // Берем больше для сортировки по релевантности
      });

      // Вычисляем релевантность и сортируем
      const docsWithRelevance = docsResults.map((doc: DocumentationResult) => ({
        ...doc,
        relevance: calculateRelevance(doc.title, doc.content, searchTerm),
        type: 'documentation' as const,
        url: `/docs/${doc.slug}`,
        displayTitle: `📚 ${doc.title}`,
        section: doc.sectionId,
      }));

      results.push(...docsWithRelevance);
    }

    // Поиск в курсах удален - теперь все через проекты контента

    // Сортируем по релевантности и берем топ результаты
    const sortedResults = results
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, limit)
      .map(({ relevance, type, ...result }) => ({
        ...result,
        // Убираем служебные поля relevance и type из результата
      }));

    return NextResponse.json(sortedResults);
  } catch (error: unknown) {
    console.error("Ошибка поиска:", error);
    return NextResponse.json(
      { error: "Ошибка сервера" },
      { status: 500 }
    );
  }
}

