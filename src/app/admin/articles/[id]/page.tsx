"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { use } from "react";
import ModernArticleEditor from "@/components/editor/ModernArticleEditor";

type ArticleData = {
  title: string;
  description: string;
  blocks: Array<{ id: string; type: string; content: string }>;
  category: string;
  tags: string[];
  status: "draft" | "published" | "archived";
};

export default function ArticleEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const isNew = resolvedParams.id === "new";

  const [initialData, setInitialData] = useState<ArticleData>({
    title: "",
    description: "",
    blocks: [{ id: "1", type: "paragraph", content: "" }],
    category: "getting-started",
    tags: [],
    status: "draft",
  });
  const [loading, setLoading] = useState(!isNew);

  useEffect(() => {
    if (isNew) return;
    (async () => {
      try {
        const response = await fetch(`/api/admin/articles/${resolvedParams.id}`);
        if (!response.ok) throw new Error("Failed to load article");
        const data = await response.json();
        setInitialData({
          title: data.title || "",
          description: data.excerpt || "",
          blocks: data.content
            ? [{ id: "1", type: "paragraph", content: data.content }]
            : [{ id: "1", type: "paragraph", content: "" }],
          category: data.category || "getting-started",
          tags: Array.isArray(data.tags) ? data.tags : data.tags ? JSON.parse(data.tags) : [],
          status: String(data.status || "DRAFT").toLowerCase(),
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [isNew, resolvedParams.id]);

  const handleSave = async (data: ArticleData) => {
    const payload = {
      title: data.title,
      content: Array.isArray(data.blocks)
        ? data.blocks.map((b) => b.content).join("\n\n")
        : "",
      excerpt: data.description || "",
      category: data.category || "getting-started",
      tags: data.tags || [],
      metaTitle: data.title || "",
      metaDescription: data.description || "",
      status: String(data.status || "draft").toUpperCase(),
    };

    const method = isNew ? "POST" : "PUT";
    const url = isNew ? "/api/admin/articles" : `/api/admin/articles/${resolvedParams.id}`;

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      try { console.error("Save failed", await response.json()); } catch {}
      throw new Error("Save failed");
    }

    const saved = await response.json();
    if (isNew) router.push(`/admin/articles/${saved.id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-[#171717]/60 dark:text-[#ededed]/60">Загрузка...</div>
      </div>
    );
  }

  return (
    <ModernArticleEditor
      initialData={initialData}
      onSave={handleSave}
      isNew={isNew}
    />
  );
}
