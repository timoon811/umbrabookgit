import React from "react";
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
    const article = await prisma.articles.findFirst({
      where: {
        slug,
        isPublished: true,
        // Временно фильтруем по отдельной категории для курсов
        OR: [
          { category: { startsWith: "course-" } },
          { category: "courses" },
        ],
      },

    });

    if (!article) {
      notFound();
    }

    return (
      <div id="article-content">
        <div className="mb-8">
          <div className="text-xs uppercase tracking-wide text-gray-700 dark:text-gray-400 mb-2">
            {article.category || "КУРСЫ"}
          </div>
          <h1 className="text-3xl font-bold mb-4">{article.title}</h1>
          {article.content && (
            <p className="text-lg text-black/70 dark:text-white/70 mb-6">{article.content.substring(0, 200)}...</p>
          )}
        </div>

        <MDXRemote
          source={article.content || ''}
          components={{
            pre: ({ children }: { children: React.ReactNode }) => {
              const code = typeof children === "string" ? children : "";
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


