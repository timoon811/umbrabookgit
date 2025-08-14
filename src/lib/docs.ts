import { prisma } from "./prisma";

export type NavItem = { title: string; href: string; depth?: number };
export type NavSection = { title: string; items: NavItem[] };

// Новый источник навигации: строим дерево из статей/разделов (Article), а не из Category
export type NavTreeNode = {
  id: string;
  title: string;
  slug?: string;
  type: "PAGE" | "SECTION";
  children: NavTreeNode[];
};

export async function getDocsTree(workspaceKey?: string): Promise<NavTreeNode[]> {
  const where: any = { status: "PUBLISHED" };
  if (workspaceKey) where.categoryKey = workspaceKey;
  const articles = await prisma.article.findMany({
    where,
    select: { id: true, title: true, slug: true, type: true, parentId: true, orderIndex: true, createdAt: true },
    orderBy: [{ orderIndex: "asc" }, { createdAt: "asc" }],
  });

  const idToNode: Record<string, NavTreeNode> = {};
  for (const a of articles) {
    idToNode[a.id] = { id: a.id, title: a.title, slug: a.slug, type: a.type as any, children: [] };
  }
  const roots: NavTreeNode[] = [];
  for (const a of articles) {
    const node = idToNode[a.id];
    if (a.parentId && idToNode[a.parentId]) {
      idToNode[a.parentId].children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

// Вспомогательная функция: для прежнего интерфейса превращаем дерево в секции (верхний уровень — разделы)
export async function getDocsNav(workspaceKey?: string): Promise<NavSection[]> {
  try {
    const tree = await getDocsTree(workspaceKey);
    const sections: NavSection[] = [];

    // Страницы верхнего уровня без раздела соберём в секцию "Общее"
    const rootPages = tree.filter(n => n.type === "PAGE");
    if (rootPages.length > 0) {
      sections.push({
        title: "Общее",
        items: rootPages.map(n => ({ title: n.title, href: `/${n.slug}`, depth: 0 })),
      });
    }

    for (const n of tree) {
      if (n.type !== "SECTION") continue;
      const items: NavItem[] = [];
      const walk = (node: NavTreeNode, depth: number) => {
        for (const ch of node.children) {
          if (ch.type === "PAGE" && ch.slug) {
            items.push({ title: ch.title, href: `/${ch.slug}`, depth });
          } else if (ch.type === "SECTION") {
            // проходим внутрь, страницы ниже будут с большим depth
            walk(ch, depth + 1);
          }
        }
      };
      walk(n, 0);
      if (items.length > 0) {
        sections.push({ title: n.title, items });
      }
    }

    return sections;
  } catch (error) {
    console.error("Error loading navigation from articles:", error);
    return [];
  }
}

export type TocItem = { depth: number; text: string; id: string };

// Функция для генерации ID аналогично rehype-slug с сохранением кириллицы
function generateSlugId(text: string): string {
  return text
    .toLowerCase()
    .trim()
    // Заменяем пробелы на дефисы
    .replace(/\s+/g, '-')
    // Убираем знаки препинания, но оставляем кириллицу, латиницу, цифры и дефисы
    .replace(/[^\u0400-\u04FFa-z0-9\-]/gi, '')
    // Убираем множественные дефисы
    .replace(/\-\-+/g, '-')
    // Убираем дефисы в начале и конце
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

export function extractHeadingsForToc(content: string): TocItem[] {
  const lines = content.split(/\r?\n/);
  const items: TocItem[] = [];
  for (const line of lines) {
    const m = /^(#{2,3})\s+(.+)$/.exec(line);
    if (m) {
      const depth = m[1].length;
      const text = m[2].trim();
      const id = generateSlugId(text);
      items.push({ depth, text, id });
    }
  }
  return items;
}


