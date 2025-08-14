import { prisma } from "@/lib/prisma";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolink from "rehype-autolink-headings";
import CopyButton from "@/components/CopyButton";
import { notFound } from "next/navigation";

export default async function CourseDocPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  try {
    const { slug: slugArray } = await params;
    const slug = slugArray.join("/");

    // Ищем статьи с пометкой categoryKey, начинающейся на "course-" или отдельной таблицей в будущем
    const article = await prisma.article.findFirst({
      where: {
        slug,
        status: "PUBLISHED",
        // Временно фильтруем по отдельной категории для курсов
        OR: [
          { categoryKey: { startsWith: "course-" } },
          { categoryKey: "courses" },
        ],
      },
      include: {
        category: { select: { key: true, name: true } },
      },
    });

    if (!article) {
      notFound();
    }

    return (
      <div>
        <div className="mb-8">
          <div className="text-xs uppercase tracking-wide text-blue-700 dark:text-blue-400 mb-2">
            {article.category?.name || "КУРСЫ"}
          </div>
          <h1 className="text-3xl font-bold mb-4">{article.title}</h1>
          {article.excerpt && (
            <p className="text-lg text-black/70 dark:text-white/70 mb-6">{article.excerpt}</p>
          )}
        </div>

        <MDXRemote
          source={article.content}
          components={{
            pre: ({ children }) => {
              const code = typeof children === "string" ? children : (children as React.ReactElement)?.props?.children ?? "";
              return (
                <div className="relative group">
                  <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <CopyButton text={String(code)} />
                  </div>
                  <pre>{children}</pre>
                </div>
              );
            },
          }}
          options={{
            mdxOptions: {
              remarkPlugins: [remarkGfm],
              rehypePlugins: [rehypeSlug, [rehypeAutolink, { behavior: "wrap" }]],
            },
          }}
        />
      </div>
    );
  } catch (error) {
    console.error("Error loading course page:", error);
    notFound();
  }
}

// Убираем generateStaticParams для динамической генерации


