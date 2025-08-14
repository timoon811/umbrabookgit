import { prisma } from "@/lib/prisma";

async function getStats() {
  const [
    totalArticles,
    publishedArticles,
    totalUsers,
    totalFeedback,
    totalViews,
  ] = await Promise.all([
    prisma.article.count(),
    prisma.article.count({ where: { status: "PUBLISHED" } }),
    prisma.user.count(),
    prisma.feedback.count(),
    prisma.article.aggregate({
      _sum: { viewCount: true },
    }),
  ]);

  const recentArticles = await prisma.article.findMany({
    select: {
      title: true,
      slug: true,
      status: true,
      viewCount: true,
      createdAt: true,
      author: {
        select: {
          name: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const topSearches = await prisma.searchQuery.groupBy({
    by: ["query"],
    _count: { query: true },
    orderBy: { _count: { query: "desc" } },
    take: 5,
  });

  return {
    overview: {
      totalArticles,
      publishedArticles,
      totalUsers,
      totalFeedback,
      totalViews: totalViews._sum.viewCount || 0,
    },
    recentArticles,
    topSearches: topSearches.map(item => ({
      query: item.query,
      count: item._count.query,
    })),
  };
}

export default async function AdminPage() {
  const stats = await getStats();

  return (
    <div>
      <h1 className="text-3xl font-bold text-[#171717] dark:text-[#ededed] mb-8">Админ панель Umbra Platform Docs</h1>
      
      {/* Общая статистика */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <div className="bg-white dark:bg-[#0a0a0a] p-6 rounded-lg border border-[#171717]/5 dark:border-[#ededed]/10">
          <h3 className="text-sm font-medium text-[#171717]/60 dark:text-[#ededed]/60">Всего статей</h3>
          <p className="text-3xl font-bold text-[#171717] dark:text-[#ededed]">{stats.overview.totalArticles}</p>
        </div>
        
        <div className="bg-white dark:bg-[#0a0a0a] p-6 rounded-lg border border-[#171717]/5 dark:border-[#ededed]/10">
          <h3 className="text-sm font-medium text-[#171717]/60 dark:text-[#ededed]/60">Опубликовано</h3>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.overview.publishedArticles}</p>
        </div>
        
        <div className="bg-white dark:bg-[#0a0a0a] p-6 rounded-lg border border-[#171717]/5 dark:border-[#ededed]/10">
          <h3 className="text-sm font-medium text-[#171717]/60 dark:text-[#ededed]/60">Пользователи</h3>
          <p className="text-3xl font-bold text-[#171717] dark:text-[#ededed]">{stats.overview.totalUsers}</p>
        </div>
        
        <div className="bg-white dark:bg-[#0a0a0a] p-6 rounded-lg border border-[#171717]/5 dark:border-[#ededed]/10">
          <h3 className="text-sm font-medium text-[#171717]/60 dark:text-[#ededed]/60">Отзывы</h3>
          <p className="text-3xl font-bold text-[#171717] dark:text-[#ededed]">{stats.overview.totalFeedback}</p>
        </div>
        
        <div className="bg-white dark:bg-[#0a0a0a] p-6 rounded-lg border border-[#171717]/5 dark:border-[#ededed]/10">
          <h3 className="text-sm font-medium text-[#171717]/60 dark:text-[#ededed]/60">Просмотры</h3>
          <p className="text-3xl font-bold text-[#171717] dark:text-[#ededed]">{stats.overview.totalViews}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Последние статьи */}
        <div className="bg-white dark:bg-[#0a0a0a] p-6 rounded-lg border border-[#171717]/5 dark:border-[#ededed]/10">
          <h2 className="text-xl font-semibold text-[#171717] dark:text-[#ededed] mb-4">Последние статьи</h2>
          <div className="space-y-4">
            {stats.recentArticles.map((article, index) => (
              <div key={`recent-${article.slug}-${index}`} className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-medium text-[#171717] dark:text-[#ededed]">{article.title}</h3>
                  <p className="text-sm text-[#171717]/60 dark:text-[#ededed]/60">
                    {article.author.name} • {new Date(article.createdAt).toLocaleDateString('ru-RU')}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-2 py-1 text-xs rounded ${
                    article.status === 'PUBLISHED' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                  }`}>
                    {article.status === 'PUBLISHED' ? 'Опубликовано' : 'Черновик'}
                  </span>
                  <p className="text-sm text-[#171717]/60 dark:text-[#ededed]/60 mt-1">
                    {article.viewCount} просмотров
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Популярные поисковые запросы */}
        <div className="bg-white dark:bg-[#0a0a0a] p-6 rounded-lg border border-[#171717]/5 dark:border-[#ededed]/10">
          <h2 className="text-xl font-semibold text-[#171717] dark:text-[#ededed] mb-4">Популярные запросы</h2>
          <div className="space-y-3">
            {stats.topSearches.map((search, index) => (
              <div key={`search-${search.query}-${index}`} className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-[#171717]/60 dark:text-[#ededed]/60 w-6">
                    #{index + 1}
                  </span>
                  <span className="font-medium text-[#171717] dark:text-[#ededed]">{search.query}</span>
                </div>
                <span className="text-sm text-[#171717]/60 dark:text-[#ededed]/60">
                  {search.count} раз
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>


    </div>
  );
}
