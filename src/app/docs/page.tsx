import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function DocsIndexPage() {
  try {
    // Ищем первую опубликованную страницу документации
    const firstPage = await prisma.documentation.findFirst({
      where: {
        isPublished: true,
      },
      select: {
        slug: true,
      },
      orderBy: [
        { order: 'asc' },
        { createdAt: 'asc' },
      ],
    });

    // Если есть первая страница - перенаправляем на неё
    if (firstPage) {
      redirect(`/docs/${firstPage.slug}`);
    }

    // Если нет страниц - показываем заглушку
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
          <svg className="w-12 h-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Документация пока недоступна
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
          Страницы документации еще не созданы. Обратитесь к администратору для добавления контента.
        </p>
      </div>
    );
  } catch (error) {
    console.error("Error redirecting to first docs page:", error);
    
    // В случае ошибки показываем сообщение об ошибке
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <div className="w-24 h-24 mx-auto mb-6 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
          <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Ошибка загрузки документации
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Произошла ошибка при загрузке страниц документации. Попробуйте обновить страницу.
        </p>
      </div>
    );
  }
}