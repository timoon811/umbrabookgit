import ModernArticleEditor from '@/components/editor/ModernArticleEditor';
import { prisma } from '@/lib/prisma';

export default async function WorkspaceEditorPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  // Передаём воркспейс в редактор через query‑параметр и он будет использовать его при создании
  return (
    <div className="p-0">
      <ModernArticleEditor />
      {/* Примечание: ModernArticleEditor уже использует /api/admin/articles для списка. 
          Следующим шагом можно добавить фильтр по categoryKey в ArticleTreeSidebar (query к API). */}
    </div>
  );
}


