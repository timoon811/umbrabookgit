"use client";

import { useState, useCallback, useEffect } from 'react';
import { 
  Eye, Save, Settings, MessageSquare, 
  Clock, X
} from 'lucide-react';
import BlockEditor, { Block } from './BlockEditor';
import ConfirmModal from '@/components/modals/ConfirmModal';


import { usePathname } from 'next/navigation';

interface ArticleData {
  id?: string;
  title: string;
  description: string;
  icon?: string;
  cover?: string;
  blocks: Block[];
  category: string;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
}

interface ModernArticleEditorProps {
  initialData?: ArticleData;
  onSave?: (data: ArticleData) => void;
  onPreview?: (data: ArticleData) => void;
  isNew?: boolean;
}

export default function ModernArticleEditor({
  initialData,
  onSave,
  onPreview,
  isNew = false
}: ModernArticleEditorProps) {
  const pathname = usePathname();
  const [article, setArticle] = useState<ArticleData>(initialData || {
    title: '',
    description: '',
    blocks: [{ id: '1', type: 'paragraph', content: '' }],
    category: 'getting-started',
    tags: [],
    status: 'draft'
  });
  interface UploadFile { id: string; name: string; url: string; type: string; }
  const [uploadedFiles, setUploadedFiles] = useState<UploadFile[]>([]);
  const initialSelectedId = useMemo(() => {
    const m = /\/admin\/articles\/(.+)$/.exec(pathname || '');
    const id = m ? m[1] : '';
    return id === 'new' ? '' : id;
  }, [pathname]);
  const [selectedId, setSelectedId] = useState<string>(initialSelectedId);
  const [selectedType, setSelectedType] = useState<'PAGE' | 'SECTION' | 'UNKNOWN'>('UNKNOWN');

  const [activeBlock, setActiveBlock] = useState<string | null>(null);

  const [mode, setMode] = useState<'editor' | 'preview'>('editor');
  const [saving, setSaving] = useState(false);
  const [activeLeftTab, setActiveLeftTab] = useState<'pages' | 'reusable' | 'files'>('pages');


  // Block operations
  const addBlock = useCallback((type: string, afterId: string) => {
    const afterIndex = article.blocks.findIndex(b => b.id === afterId);
    const newBlock: Block = {
      id: Date.now().toString(),
      type,
      content: '',
      metadata: {}
    };
    
    setArticle(prev => ({
      ...prev,
      blocks: [
        ...prev.blocks.slice(0, afterIndex + 1),
        newBlock,
        ...prev.blocks.slice(afterIndex + 1)
      ]
    }));
    
    setActiveBlock(newBlock.id);
  }, [article.blocks]);

  const updateBlock = useCallback((block: Block) => {
    setArticle(prev => ({
      ...prev,
      blocks: prev.blocks.map(b => 
        b.id === block.id ? block : b
      )
    }));
  }, []);

  const deleteBlock = useCallback((id: string) => {
    if (article.blocks.length === 1) return; // Keep at least one block
    
    setArticle(prev => ({
      ...prev,
      blocks: prev.blocks.filter(block => block.id !== id)
    }));
  }, [article.blocks.length]);

  const duplicateBlock = useCallback((id: string) => {
    const blockIndex = article.blocks.findIndex(b => b.id === id);
    if (blockIndex === -1) return;

    const originalBlock = article.blocks[blockIndex];
    const newBlock: Block = {
      ...originalBlock,
      id: Date.now().toString()
    };
    
    setArticle(prev => ({
      ...prev,
      blocks: [
        ...prev.blocks.slice(0, blockIndex + 1),
        newBlock,
        ...prev.blocks.slice(blockIndex + 1)
      ]
    }));
  }, [article.blocks]);

  const moveBlock = useCallback((id: string, direction: 'up' | 'down') => {
    const index = article.blocks.findIndex(b => b.id === id);
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === article.blocks.length - 1)
    ) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const newBlocks = [...article.blocks];
    [newBlocks[index], newBlocks[newIndex]] = [newBlocks[newIndex], newBlocks[index]];
    
    setArticle(prev => ({ ...prev, blocks: newBlocks }));
  }, [article.blocks]);

  // Handle save
  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave?.(article);
    } finally {
      setSaving(false);
    }
  };

  // Простая конвертация Markdown -> блоки редактора
  const parseMarkdownToBlocks = useCallback((md: string): Block[] => {
    const lines = md.replace(/\r\n?/g, "\n").split("\n");
    const blocks: Block[] = [];
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      // code fence
      const fence = /^```(\w+)?\s*$/.exec(line);
      if (fence) {
        const lang = fence[1] || 'text';
        const buf: string[] = [];
        i++;
        while (i < lines.length && !/^```\s*$/.test(lines[i])) {
          buf.push(lines[i]);
          i++;
        }
        // consume closing ```
        if (i < lines.length && /^```\s*$/.test(lines[i])) i++;
        blocks.push({ id: `${Date.now()}-${blocks.length}`, type: 'code', content: buf.join('\n'), metadata: { language: lang } });
        continue;
      }
      // headings
      if (/^###\s+/.test(line)) {
        blocks.push({ id: `${Date.now()}-${blocks.length}`, type: 'heading3', content: line.replace(/^###\s+/, '') });
        i++; continue;
      }
      if (/^##\s+/.test(line)) {
        blocks.push({ id: `${Date.now()}-${blocks.length}`, type: 'heading2', content: line.replace(/^##\s+/, '') });
        i++; continue;
      }
      if (/^#\s+/.test(line)) {
        blocks.push({ id: `${Date.now()}-${blocks.length}`, type: 'heading1', content: line.replace(/^#\s+/, '') });
        i++; continue;
      }
      // quote
      if (/^>\s?/.test(line)) {
        const buf: string[] = [line.replace(/^>\s?/, '')];
        i++;
        while (i < lines.length && /^>\s?/.test(lines[i])) { buf.push(lines[i].replace(/^>\s?/, '')); i++; }
        blocks.push({ id: `${Date.now()}-${blocks.length}`, type: 'quote', content: buf.join('\n') });
        continue;
      }
      // unordered list (consume consecutive list items as separate list blocks for простоты)
      const listMatch = /^[-*]\s+(.+)$/.exec(line);
      if (listMatch) {
        blocks.push({ id: `${Date.now()}-${blocks.length}`, type: 'list', content: listMatch[1] });
        i++;
        while (i < lines.length) {
          const m = /^[-*]\s+(.+)$/.exec(lines[i]);
          if (!m) break; blocks.push({ id: `${Date.now()}-${blocks.length}`, type: 'list', content: m[1] }); i++;
        }
        continue;
      }
      // divider
      if (/^---+$/.test(line.trim())) { blocks.push({ id: `${Date.now()}-${blocks.length}`, type: 'divider', content: '' }); i++; continue; }
      // empty: объединяем в абзацы по пустой строке
      const buf: string[] = [];
      while (i < lines.length && lines[i].trim() !== '') { buf.push(lines[i]); i++; }
      if (buf.length) {
        blocks.push({ id: `${Date.now()}-${blocks.length}`, type: 'paragraph', content: buf.join('\n') });
      } else {
        i++;
      }
    }
    return blocks.length ? blocks : [{ id: `${Date.now()}`, type: 'paragraph', content: '' }];
  }, []);

  const loadArticleById = useCallback(async (id: string) => {
    if (!id) return;
    try {
      const res = await fetch(`/api/admin/articles/${id}`);
      if (!res.ok) return;
      const data = await res.json();
      const contentText = typeof data?.content === 'string' ? data.content : '';
      setSelectedType(data?.type || 'UNKNOWN');
      setArticle({
        title: data?.title || '',
        description: data?.excerpt || '',
        icon: undefined,
        cover: undefined,
        blocks: parseMarkdownToBlocks(contentText),
        category: data?.categoryKey || 'getting-started',
        tags: data?.tags ? (Array.isArray(data.tags) ? data.tags : (() => { try { return JSON.parse(data.tags); } catch { return []; } })()) : [],
        status: (data?.status || 'DRAFT').toLowerCase(),
      } as any);
    } catch {}
  }, [parseMarkdownToBlocks]);

  const handleSelectArticle = useCallback(async (id: string) => {
    setSelectedId(id);
    if (typeof window !== 'undefined') {
      try { window.history.pushState({}, '', `/admin/articles/${id}`); } catch {}
    }
    await loadArticleById(id);
  }, [loadArticleById]);

  // При первом открытии страницы, если в URL уже есть id, сразу грузим контент без перезагрузки
  useEffect(() => {
    if (initialSelectedId) {
      setSelectedId(initialSelectedId);
      loadArticleById(initialSelectedId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSelectedId]);


  return (
    <div className="bg-gray-50 dark:bg-gray-900 h-[calc(100vh-56px)] overflow-hidden flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="px-6 py-3">
          {/* Action bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setMode('editor')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  mode === 'editor'
                    ? 'bg-black/5 text-black dark:bg-white/10 dark:text-white'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                Editor
              </button>
              <button
                onClick={() => setMode('preview')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  mode === 'preview'
                    ? 'bg-black/5 text-black dark:bg-white/10 dark:text-white'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                <Eye className="w-4 h-4 mr-1" />
                Preview
              </button>
            </div>

            <div className="flex items-center space-x-3">
              <button className="flex items-center space-x-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200">
                <MessageSquare className="w-4 h-4" />
                <span>Comments</span>
              </button>
              <button className="flex items-center space-x-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200">
                <Clock className="w-4 h-4" />
                <span>History</span>
              </button>
              <button className="flex items-center space-x-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200">
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center space-x-1 px-4 py-1.5 rounded-md text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 dark:bg-white/10 dark:hover:bg-white/20 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save'}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content: grid fills viewport height, only columns scroll */}
      <div className="mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-7 gap-6 flex-1 overflow-hidden">
        {/* Article tree sidebar */}
        <div className="lg:col-span-2 h-full overflow-hidden flex flex-col">
          <div className="mb-2 flex items-center gap-2 text-xs">
            <button
              onClick={() => setActiveLeftTab('pages')}
              className={`px-3 py-1 rounded ${activeLeftTab === 'pages' ? 'bg-black/5 dark:bg-white/10 text-black dark:text-white' : 'text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white'}`}
            >
              Страницы
            </button>
            <button
              onClick={() => setActiveLeftTab('reusable')}
              className={`px-3 py-1 rounded ${activeLeftTab === 'reusable' ? 'bg-black/5 dark:bg-white/10 text-black dark:text-white' : 'text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white'}`}
            >
              Повторно используемое
            </button>
            <button
              onClick={() => setActiveLeftTab('files')}
              className={`px-3 py-1 rounded ${activeLeftTab === 'files' ? 'bg-black/5 dark:bg-white/10 text-black dark:text-white' : 'text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white'}`}
            >
              Файлы
            </button>
          </div>
          {activeLeftTab === 'pages' && (
            <div className="h-full overflow-y-auto">
              <ArticleTreeSidebar currentId={selectedId} onOpenItem={handleSelectArticle} />
            </div>
          )}
          {activeLeftTab === 'reusable' && <ReusableSidebar />}
          {activeLeftTab === 'files' && (
            <FilesSidebar
              files={uploadedFiles}
              onUpload={(files) => {
                const mapped = files.map((file) => {
                  const url = URL.createObjectURL(file);
                  return { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, name: file.name, url, type: file.type };
                });
                setUploadedFiles(prev => [...mapped, ...prev]);
              }}
              onRemove={(id) => setUploadedFiles(prev => prev.filter(f => f.id !== id))}
            />
          )}
        </div>
        {/* Editor area */}
        <div className="lg:col-span-5 h-full overflow-hidden flex flex-col">
        {mode === 'editor' ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 h-full flex flex-col overflow-hidden">
            {/* Page header */}
            <div className="p-8 border-b border-gray-100 dark:border-gray-700">


              {/* Title */}
              <input
                type="text"
                value={article.title}
                onChange={(e) => setArticle(prev => ({ ...prev, title: e.target.value }))}
                placeholder={selectedType === 'SECTION' ? 'Untitled section' : 'Untitled page'}
                className="w-full text-4xl font-bold bg-transparent border-none outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400 mb-4"
              />

              {/* Description (для раздела скрываем) */}
              {selectedType !== 'SECTION' && (
                <input
                  type="text"
                  value={article.description}
                  onChange={(e) => setArticle(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Page description (optional)"
                  className="w-full text-lg bg-transparent border-none outline-none text-gray-600 dark:text-gray-400 placeholder-gray-400"
                />
              )}
            </div>

            {/* Content blocks (scrollable area) */}
            <div
              className="p-8 flex-1 overflow-y-auto"
              onDragOver={(e) => {
                if (e.dataTransfer?.types?.length) e.preventDefault();
              }}
              onDrop={(e) => {
                if (!e.dataTransfer) return;
                e.preventDefault();
                const files = e.dataTransfer.files;
                const uri = e.dataTransfer.getData('text/uri-list');
                const meta = e.dataTransfer.getData('application/x-file-meta');
                if (uri) {
                  const parsed = meta ? JSON.parse(meta) : undefined;
                  setArticle(prev => ({
                    ...prev,
                    blocks: [...prev.blocks, { id: Date.now().toString(), type: parsed?.type?.startsWith('image/') ? 'image' : 'paragraph', content: parsed?.type?.startsWith('image/') ? '' : uri, metadata: parsed?.type?.startsWith('image/') ? { url: uri, alt: parsed?.name || '' } : {} }]
                  }));
                  return;
                }
                if (files && files.length > 0) {
                  const file = files[0];
                  const url = URL.createObjectURL(file);
                  const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
                  setUploadedFiles(prev => ([...prev, { id, name: file.name, url, type: file.type }]));
                  setArticle(prev => ({
                    ...prev,
                    blocks: [...prev.blocks, { id: Date.now().toString(), type: file.type.startsWith('image/') ? 'image' : 'paragraph', content: file.type.startsWith('image/') ? '' : url, metadata: file.type.startsWith('image/') ? { url, alt: file.name } : {} }]
                  }));
                }
              }}
            >
              {selectedType === 'SECTION' ? (
                <div className="text-sm text-black/60 dark:text-white/60">
                  Это раздел. Контент не редактируется, введите только название в заголовке выше.
                </div>
              ) : (
                article.blocks.map((block, index) => (
                <BlockEditor
                  key={block.id}
                  block={block}
                  isActive={activeBlock === block.id}
                  onFocus={() => setActiveBlock(block.id)}
                  onBlur={() => setActiveBlock(null)}
                  onUpdate={updateBlock}
                  onDelete={() => deleteBlock(block.id)}
                  onAddBlock={addBlock}
                  onDuplicate={() => duplicateBlock(block.id)}
                  onMoveUp={() => moveBlock(block.id, 'up')}
                  onMoveDown={() => moveBlock(block.id, 'down')}
                  canMoveUp={index > 0}
                  canMoveDown={index < article.blocks.length - 1}
                />
                ))
              )}
              <BottomNav />
            </div>
          </div>
        ) : (
          <ArticlePreview article={article} />
        )}
        </div>
      </div>
    </div>
  );
}



// Article Preview Component
function ArticlePreview({ article }: { article: ArticleData }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
      <div className="prose prose-lg dark:prose-invert max-w-none">
        {article.title && (
          <h1 className="text-4xl font-bold mb-4">{article.title}</h1>
        )}
        {article.description && (
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">{article.description}</p>
        )}
        
        {article.blocks.map((block) => {
          switch (block.type) {
            case 'heading1':
              return <h1 key={block.id} className="text-3xl font-bold mt-8 mb-4">{block.content}</h1>;
            case 'heading2':
              return <h2 key={block.id} className="text-2xl font-semibold mt-6 mb-4">{block.content}</h2>;
            case 'heading3':
              return <h3 key={block.id} className="text-xl font-medium mt-4 mb-2">{block.content}</h3>;
            case 'quote':
              return (
                <blockquote key={block.id} className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic text-gray-700 dark:text-gray-300 my-4">
                  {block.content}
                </blockquote>
              );
            case 'code':
              return (
                <pre key={block.id} className="bg-gray-100 dark:bg-gray-800 rounded-md p-4 overflow-x-auto">
                  <code className="font-mono text-sm">{block.content}</code>
                </pre>
              );
            case 'list':
              return (
                <ul key={block.id} className="list-disc list-inside my-2">
                  <li>{block.content}</li>
                </ul>
              );
            default:
              return <p key={block.id} className="mb-4 leading-relaxed">{block.content}</p>;
          }
        })}
      </div>
    </div>
  );
}

function ArticleTreeSidebar({ currentId, onOpenItem }: { currentId?: string; onOpenItem?: (id: string) => void }) {
  type TreeItem = { id: string; title: string; slug: string; orderIndex: number; status: string; type: 'PAGE'|'SECTION'; parentId?: string|null; categoryKey?: string };
  const [items, setItems] = useState<TreeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [query, setQuery] = useState('');
  const pathname = usePathname();
  const router = useRouter();

  const [editingId, setEditingId] = useState<string>('');
  const [editingTitle, setEditingTitle] = useState<string>('');
  const [menuId, setMenuId] = useState<string>('');
  const [addMenuOpen, setAddMenuOpen] = useState<boolean>(false);
  const addMenuRef = useRef<HTMLDivElement | null>(null);
  const expandTimerRef = useRef<Record<string, number>>({});
  const [draggingId, setDraggingId] = useState<string>('');
  const [dragOverId, setDragOverId] = useState<string>('');
  const [dragPosition, setDragPosition] = useState<'before' | 'after' | 'inside' | ''>('');
  const [confirmOpen, setConfirmOpen] = useState<boolean>(false);
  const [toDelete, setToDelete] = useState<TreeItem | null>(null);
  const [deleteCount, setDeleteCount] = useState<number>(0);

  const activeId = useMemo(() => {
    if (currentId) return currentId;
    const m = /\/admin\/articles\/(.+)$/.exec(pathname || '');
    const id = m ? m[1] : '';
    return id === 'new' ? '' : id;
  }, [pathname, currentId]);

  const getWorkspaceKey = () => {
    // Пытаемся забрать ключ воркспейса из URL: /admin/workspaces/[key]
    const m = /\/admin\/workspaces\/([^\/]+)/.exec(pathname || '');
    return m ? m[1] : undefined;
  };

  const load = async () => {
    setLoading(true);
    try {
      const ws = getWorkspaceKey() || (pathname?.startsWith('/admin/workspaces/courses') ? 'courses' : undefined);
      const url = new URL('/api/admin/articles', typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
      url.searchParams.set('limit','1000');
      url.searchParams.set('sortBy','orderIndex');
      url.searchParams.set('sortOrder','asc');
      // Для курсов поддерживаем исторические categoryKey вида "course-*" — не фильтруем на API, а отфильтруем на клиенте
      if (ws && ws !== 'courses') url.searchParams.set('category', ws);
      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        const all: TreeItem[] = data.articles.map((a: any) => ({ id: a.id, title: a.title, slug: a.slug, orderIndex: a.orderIndex ?? 0, status: a.status, type: a.type, parentId: a.parentId, categoryKey: a.categoryKey }));
        const filtered = ws === 'courses'
          ? all.filter(a => {
              const k = String(a.categoryKey || '').toLowerCase();
              return (
                k === 'courses' ||
                k.startsWith('course') ||
                k === 'курсы' ||
                k.startsWith('курс')
              );
            })
          : all;
        setItems(filtered);
        // раскрываем все разделы по умолчанию
        const sect: Record<string, boolean> = {};
        for (const a of filtered) if (a.type === 'SECTION') sect[a.id] = true;
        setExpanded(sect);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { if (activeId) { /* авто‑подгрузка текущей страницы при первом открытии */ } }, [activeId]);

  // Генерация следующего стандартного названия: "Страница N" или "Раздел N"
  const getNextDefaultTitle = useCallback((type: 'PAGE'|'SECTION') => {
    const base = type === 'PAGE' ? 'Страница' : 'Раздел';
    let maxNum = 0;
    for (const it of items) {
      if (it.type !== type) continue;
      if (it.title === base) {
        maxNum = Math.max(maxNum, 1);
        continue;
      }
      if (it.title.startsWith(base)) {
        const suffix = it.title.slice(base.length).trim();
        const m = /^(\d+)/.exec(suffix);
        if (m) {
          const n = parseInt(m[1], 10);
          if (!Number.isNaN(n)) maxNum = Math.max(maxNum, n);
        }
      }
    }
    return `${base} ${maxNum + 1}`.trim();
  }, [items]);

  // Закрывать выпадающие меню при клике вне
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const onClick = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (addMenuOpen && addMenuRef.current && target && !addMenuRef.current.contains(target)) {
        setAddMenuOpen(false);
      }
      if (menuId) {
        // закрываем контекстное меню узла при клике вне
        const anyMenuOpen = document.querySelector('[data-article-node-menu="open"]');
        if (anyMenuOpen && !anyMenuOpen.contains(target as Node)) setMenuId('');
      }
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [addMenuOpen, menuId]);

  // Сохранение состояния раскрытия в localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try { localStorage.setItem('articles_tree_expanded', JSON.stringify(expanded)); } catch {}
  }, [expanded]);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem('articles_tree_expanded');
      if (raw) setExpanded(JSON.parse(raw));
    } catch {}
  }, []);

  // Горячие клавиши: N — новая страница, R — новый раздел, Del — удалить активную
  // Отключены все глобальные горячие клавиши

  const createSection = async () => {
    const defaultTitle = getNextDefaultTitle('SECTION');
    const wsMatch = /\/admin\/workspaces\/([^\/]+)/.exec(pathname || '');
    const category = wsMatch ? wsMatch[1] : (pathname?.startsWith('/admin/workspaces/courses') ? 'courses' : 'getting-started');
    const res = await fetch('/api/admin/articles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: defaultTitle, type: 'SECTION', category, status: 'DRAFT' })
    });
    if (res.ok) {
      await load();
      // включаем инлайн-редактирование на последнем созданном
      try {
        const data = await res.json();
        setEditingId(data.id);
        setEditingTitle(data.title || defaultTitle);
      } catch {}
    }
  };

  const createPageUnder = async (parentId?: string|null) => {
    const defaultTitle = getNextDefaultTitle('PAGE');
    const wsMatch = /\/admin\/workspaces\/([^\/]+)/.exec(pathname || '');
    const category = wsMatch ? wsMatch[1] : (pathname?.startsWith('/admin/workspaces/courses') ? 'courses' : 'getting-started');
    const res = await fetch('/api/admin/articles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: defaultTitle, type: 'PAGE', parentId: parentId ?? null, category, status: 'DRAFT' })
    });
    if (res.ok) {
      await load();
      try {
        const data = await res.json();
        setEditingId(data.id);
        setEditingTitle(data.title || defaultTitle);
      } catch {}
    }
  };

  const onDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    setDraggingId(id);
  };

  // Находим ближайший скроллируемый контейнер для автоскролла при DnD
  const getScrollParent = (el: HTMLElement | null): HTMLElement | null => {
    if (typeof window === 'undefined') return null;
    let node: HTMLElement | null = el;
    while (node) {
      const hasScrollableSpace = node.scrollHeight > node.clientHeight;
      const overflowY = window.getComputedStyle(node).overflowY;
      if (hasScrollableSpace && (overflowY === 'auto' || overflowY === 'scroll')) return node;
      node = node.parentElement;
    }
    return null;
  };

  const onDragOverItem = (e: React.DragEvent, targetId: string, targetType: 'PAGE'|'SECTION') => {
    e.preventDefault();
    // автоскролл списка
    const scrollParent = getScrollParent(e.currentTarget as HTMLElement);
    if (scrollParent) {
      const rect = scrollParent.getBoundingClientRect();
      const offset = e.clientY - rect.top;
      const threshold = 28; // px
      const step = 18; // px
      if (offset < threshold) scrollParent.scrollTop -= step;
      else if (rect.height - offset < threshold) scrollParent.scrollTop += step;
    }

    // определяем предполагаемое положение вставки
    const liRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const ratioY = (e.clientY - liRect.top) / liRect.height;
    const ratioX = (e.clientX - liRect.left) / liRect.width;
    let pos: 'before' | 'after' | 'inside' = 'after';
    if (targetType === 'SECTION') {
      if (ratioY < 0.33) pos = 'before';
      else if (ratioY > 0.66) pos = 'after';
      else pos = ratioX > 0.6 ? 'inside' : 'after';
    } else {
      // для страницы — правый край позволяет вложение внутрь
      if (ratioX > 0.7) pos = 'inside';
      else pos = ratioY < 0.5 ? 'before' : 'after';
    }
    setDragOverId(targetId);
    setDragPosition(pos);

    // отложенное раскрытие секции при наведении для вложения внутрь
    if (targetType === 'SECTION' && pos === 'inside' && expanded[targetId] === false) {
      if (!expandTimerRef.current[targetId] && typeof window !== 'undefined') {
        expandTimerRef.current[targetId] = window.setTimeout(() => {
          setExpanded(prev => ({ ...prev, [targetId]: true }));
          delete expandTimerRef.current[targetId];
        }, 350);
      }
    }
  };
  const onDrop = async (e: React.DragEvent, targetId: string) => {
    const sourceId = e.dataTransfer.getData('text/plain');
    if (!sourceId || sourceId === targetId) return;
    const arr = [...items];
    const sourceIdx = arr.findIndex(i => i.id === sourceId);
    const targetIdx = arr.findIndex(i => i.id === targetId);
    if (sourceIdx < 0 || targetIdx < 0) return;
    // Если переносим раздел — переносим блок его потомков одним куском
    const getDescendants = (id: string): string[] => {
      const children = arr.filter(n => n.parentId === id).map(n => n.id);
      const all: string[] = [];
      for (const cid of children) {
        all.push(cid, ...getDescendants(cid));
      }
      return all;
    };
    const moved = arr[sourceIdx];
    const movedIds = [moved.id, ...(moved.type === 'SECTION' ? getDescendants(moved.id) : [])];
    // Нельзя переносить в самого себя или в своего потомка
    if (movedIds.includes(targetId)) return;
    const block = arr.filter(n => movedIds.includes(n.id));
    // Удаляем весь блок из массива, сохраняя порядок остальных
    for (const id of movedIds) {
      const idx = arr.findIndex(n => n.id === id);
      if (idx >= 0) arr.splice(idx, 1);
    }
    let insertIndex = arr.findIndex(n => n.id === targetId);
    const target = arr[insertIndex];
    // Определяем сценарий: вложение в цель или перестановка на одном уровне
    let nestIntoTarget = false;
    if (target) {
      if (target.type === 'SECTION') {
        nestIntoTarget = true;
      } else if (target.type === 'PAGE') {
        // Если бросаем во вторую половину строки — считаем как вложение в страницу
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const ratio = (e.clientX - rect.left) / rect.width;
        if (ratio > 0.6) nestIntoTarget = true; // ближе к правой части — вложение
      }
    }
    if (nestIntoTarget && target) {
      // делаем целью родителя перемещаемого элемента (верхний moved)
      block[0].parentId = target.id;
      // вставляем блок сразу после цели
      insertIndex = insertIndex + 1;
    } else {
      // обычная перестановка в пределах одного уровня (родитель цели)
      block[0].parentId = target?.parentId ?? null;
      // вставка до/после в зависимости от вертикальной позиции
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const ratioY = (e.clientY - rect.top) / rect.height;
      if (ratioY > 0.5) insertIndex = insertIndex + 1; // нижняя половина — после цели
    }
    // вставка блока
    arr.splice(insertIndex, 0, ...block);
    // reindex
    const itemsWithOrder = arr.map((it, idx) => ({ ...it, orderIndex: idx }));
    setItems(itemsWithOrder);
    await fetch('/api/admin/articles/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reorder', items: itemsWithOrder.map(({ id, orderIndex, parentId }) => ({ id, orderIndex, parentId })) })
    });
    setDragOverId('');
    setDragPosition('');
    setDraggingId('');
  };
  const allowDrop = (e: React.DragEvent) => e.preventDefault();
  const onDragEnd = () => { setDragOverId(''); setDragPosition(''); setDraggingId(''); };

  const collectDescendants = useCallback((id: string): string[] => {
    const children = items.filter(n => n.parentId === id).map(n => n.id);
    const all: string[] = [];
    for (const cid of children) {
      all.push(cid, ...collectDescendants(cid));
    }
    return all;
  }, [items]);

  const idToItem = useMemo(() => {
    const map: Record<string, TreeItem> = {};
    items.forEach(i => { map[i.id] = i; });
    return map;
  }, [items]);

  const getDepth = (it: TreeItem): number => {
    let d = 0; let p = it.parentId ? idToItem[it.parentId] : undefined;
    while (p) { d++; p = p.parentId ? idToItem[p.parentId] : undefined; if (d > 10) break; }
    return d;
  };

  const isVisible = (it: TreeItem): boolean => {
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      if (!it.title.toLowerCase().includes(q)) return false;
    }
    let p = it.parentId ? idToItem[it.parentId] : undefined;
    while (p) {
      if (expanded[p.id] === false) return false;
      p = p.parentId ? idToItem[p.parentId] : undefined;
    }
    return true;
  };

  const parentsWithChildren = useMemo(() => {
    const set = new Set<string>();
    for (const it of items) if (it.parentId) set.add(it.parentId);
    return set;
  }, [items]);

  const isRoot = (it: TreeItem) => !it.parentId;
  const canMoveOutOfRoot = (it: TreeItem) => isRoot(it) && items.some(n => n.parentId === null && n.id !== it.id);

  const duplicateItem = async (it: TreeItem) => {
    const title = `${it.title} (copy)`;
    const res = await fetch('/api/admin/articles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        type: it.type,
        parentId: it.parentId ?? null,
        category: 'getting-started',
        status: 'DRAFT'
      })
    });
    if (res.ok) await load();
  };

  return (
    <div className="p-3 border rounded-lg bg-white dark:bg-gray-900 border-black/5 dark:border-white/10">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-semibold">Страницы</div>
      </div>
      <div className="mb-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск..."
          className="w-full px-2 py-1 text-sm border border-black/10 dark:border-white/10 rounded bg-transparent"
        />
      </div>
      {loading ? (
        <div className="text-sm text-black/60 dark:text-white/60">Загрузка...</div>
      ) : (
        <>
        <ul className="space-y-1">
          {items.map((it) => isVisible(it) && (
            <li key={it.id}
                draggable
                onDragStart={(e) => onDragStart(e, it.id)}
                onDragOver={(e) => onDragOverItem(e, it.id, it.type)}
                onDrop={(e) => onDrop(e, it.id)}
                onDragEnd={onDragEnd}
                className={`group relative flex items-center justify-between gap-2 px-2 py-1 rounded hover:bg-black/5 dark:hover:bg-white/10 ${activeId === it.id ? 'bg-black/5 dark:bg-white/10' : ''}`}
            >
              {dragOverId===it.id && dragPosition==='before' && (
                <div className="absolute -top-1 left-1 right-1 h-0.5 bg-black/40 dark:bg-white/40 rounded" />
              )}
              <div className="flex items-center gap-1 flex-1 min-w-0">
                {/* drag handle */}
                <span className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 cursor-grab select-none">⋮⋮</span>
                {it.type === 'SECTION' ? (
                  <button onClick={() => setExpanded(prev => ({ ...prev, [it.id]: !prev[it.id] }))} className="text-xs w-4 text-gray-600 flex-none">{expanded[it.id] === false ? '▸' : '▾'}</button>
                ) : (
                  <span className="w-1 flex-none"></span>
                )}
                {editingId === it.id ? (
                  <input
                    autoFocus
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onKeyDown={async (e) => {
                      if (e.key === 'Enter') {
                        const t = editingTitle.trim();
                        if (t && t !== it.title) await fetch(`/api/admin/articles/${it.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: t }) });
                        setEditingId('');
                        await load();
                      } else if (e.key === 'Escape') {
                        setEditingId('');
                      }
                    }}
                    onBlur={async () => {
                      const t = editingTitle.trim();
                      if (t && t !== it.title) await fetch(`/api/admin/articles/${it.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: t }) });
                      setEditingId('');
                      await load();
                    }}
                    className="flex-1 min-w-0 text-sm px-1 py-0.5 border border-black/10 dark:border-white/10 rounded bg-transparent truncate"
                    style={{ marginLeft: getDepth(it) * 8 }}
                  />
                ) : (
                  <button
                    onClick={() => onOpenItem ? onOpenItem(it.id) : undefined}
                    onDoubleClick={() => { setEditingId(it.id); setEditingTitle(it.title); }}
                    className={`text-left w-full text-sm truncate ${it.type === 'SECTION' ? 'font-semibold' : ''} min-w-0`}
                    style={{ marginLeft: getDepth(it) * 8, maxWidth: '100%' }}
                  >
                    {it.title}
                  </button>
                )}
              </div>
              <div className="relative flex items-center gap-1">
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">{it.status === 'PUBLISHED' ? 'PUB' : it.status === 'DRAFT' ? 'DRAFT' : 'ARCH'}</span>
                <button title="Меню" onClick={() => setMenuId(prev => prev === it.id ? '' : it.id)} className="text-[10px] px-1 text-gray-600">⋮</button>
                {menuId === it.id && (
                  <div className="absolute right-0 top-5 z-10 bg-white dark:bg-gray-900 border border-black/10 dark:border-white/10 rounded shadow p-1 text-xs" data-article-node-menu="open">
                    <button className="block w-full text-left px-2 py-1 hover:bg-black/5 dark:hover:bg-white/10" onClick={() => { setEditingId(it.id); setEditingTitle(it.title); setMenuId(''); }}>Переименовать</button>
                    <button className="block w-full text-left px-2 py-1 hover:bg-black/5 dark:hover:bg-white/10" onClick={async () => { setMenuId(''); const status = it.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED'; await fetch(`/api/admin/articles/${it.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) }); await load(); }}>{it.status === 'PUBLISHED' ? 'Сделать черновиком' : 'Опубликовать'}</button>
                    <button className="block w-full text-left px-2 py-1 hover:bg-black/5 dark:hover:bg-white/10" onClick={async () => { setMenuId(''); await duplicateItem(it); }}>Дублировать</button>
                    {it.type === 'SECTION' && (
                      <button className="block w-full text-left px-2 py-1 hover:bg-black/5 dark:hover:bg-white/10" onClick={async () => { setMenuId(''); await createPageUnder(it.id); }}>+ Страница</button>
                    )}
                    {(!it.parentId) ? (
                      <button className="block w-full text-left px-2 py-1 hover:bg-black/5 dark:hover:bg-white/10" onClick={async () => {
                        setMenuId('');
                        // Найдём ближайший раздел выше по списку
                        const idx = items.findIndex(a => a.id === it.id);
                        const parent = [...items.slice(0, idx)].reverse().find(a => a.type === 'SECTION');
                        const parentId = parent ? parent.id : null;
                        if (parentId) {
                          await fetch(`/api/admin/articles/${it.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ parentId }) });
                          await load();
                        }
                      }}>Убрать из корня</button>
                    ) : (
                      <button title="Переместить в корень (parentId=null)" className="block w-full text-left px-2 py-1 hover:bg-black/5 dark:hover:bg-white/10" onClick={async () => { setMenuId(''); await fetch(`/api/admin/articles/${it.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ parentId: null }) }); await load(); }}>Переместить в корень</button>
                    )}
                    <button className="block w-full text-left px-2 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => { setMenuId(''); setToDelete(it); const cnt = collectDescendants(it.id).length; setDeleteCount(cnt); setConfirmOpen(true); }}>Удалить</button>
                  </div>
                )}
              </div>
              {dragOverId===it.id && dragPosition==='after' && (
                <div className="absolute -bottom-1 left-1 right-1 h-0.5 bg-black/40 dark:bg-white/40 rounded" />
              )}
              {dragOverId===it.id && dragPosition==='inside' && (
                <div className="absolute inset-0 rounded ring-2 ring-black/20 dark:ring-white/20 pointer-events-none" />
              )}
            </li>
          ))}
        </ul>
        {/* Add new (отдельно от списка, чтобы всегда идти следом) */}
        <div className="mt-2 relative" ref={addMenuRef}>
          <button
            onClick={() => setAddMenuOpen(v => !v)}
            className="text-xs text-gray-700 dark:text-gray-300 hover:underline"
          >
            + Добавить…
          </button>
          {addMenuOpen && (
            <div className="absolute left-0 top-6 z-10 bg-white dark:bg-gray-900 border border-black/10 dark:border-white/10 rounded shadow p-1 text-xs w-44">
              <button className="block w-full text-left px-2 py-1 hover:bg-black/5 dark:hover:bg-white/10" onClick={async () => { setAddMenuOpen(false); await createPageUnder(null); }}>Страница</button>
              <button className="block w-full text-left px-2 py-1 hover:bg-black/5 dark:hover:bg-white/10" onClick={async () => { setAddMenuOpen(false); await createSection(); }}>Раздел</button>
            </div>
          )}
        </div>
        </>
      )}
      {/* Confirm deletion modal */}
      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => { setConfirmOpen(false); setToDelete(null); }}
        onConfirm={async () => {
          if (!toDelete) return;
          await fetch(`/api/admin/articles/${toDelete.id}`, { method: 'DELETE' });
          if (activeId === toDelete.id) router.push('/admin/articles');
          setConfirmOpen(false);
          setToDelete(null);
          await load();
        }}
        title={toDelete?.type === 'SECTION' ? 'Удалить раздел?' : 'Удалить страницу?'}
        message={toDelete?.type === 'SECTION' ? `Будут удалены все вложенные элементы: ${deleteCount}` : 'Это действие необратимо.'}
        type="danger"
        actionType="delete"
        confirmText="Удалить"
      />
    </div>
  );
}

function ReusableSidebar() {
  return (
    <div className="p-3 border rounded-lg bg-white dark:bg-gray-900 border-black/5 dark:border-white/10">
      <div className="mb-3 text-sm font-semibold">Повторно используемое</div>
      <div className="text-sm text-black/60 dark:text-white/60 mb-3">
        Создавайте и переиспользуйте блоки контента по всей документации.
      </div>
      <button className="px-3 py-2 text-xs rounded text-white bg-gray-900 hover:bg-gray-800 dark:bg-white/10 dark:hover:bg-white/20 transition-colors">Создать блок</button>
    </div>
  );
}

function FilesSidebar({ files, onUpload, onRemove }: { files: Array<{ id: string; name: string; url: string; type: string }>; onUpload: (files: File[]) => void; onRemove: (id: string) => void; }) {
  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = Array.from(e.target.files || []);
    if (f.length) onUpload(f);
  };
  return (
    <div className="p-3 border rounded-lg bg-white dark:bg-gray-900 border-black/5 dark:border-white/10">
      <div className="mb-3 text-sm font-semibold">Файлы</div>
      <div className="text-xs text-black/60 dark:text-white/60 mb-2">Перетащите файл в редактор или из списка ниже на страницу.</div>
      <label className="inline-flex items-center gap-2 px-3 py-2 text-xs rounded text-white bg-gray-900 hover:bg-gray-800 dark:bg-white/10 dark:hover:bg-white/20 transition-colors cursor-pointer">
        <input type="file" multiple className="hidden" onChange={handleInput} />
        Загрузить
      </label>
      <div className="mt-3 space-y-2 max-h-64 overflow-auto">
        {files.map(f => (
          <div key={f.id} className="flex items-center justify-between gap-2 px-2 py-1 rounded border border-black/5 dark:border-white/10">
            <div
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('text/uri-list', f.url);
                e.dataTransfer.setData('application/x-file-meta', JSON.stringify({ name: f.name, type: f.type }));
              }}
              className="flex items-center gap-2 cursor-grab">
              <span className="text-xs text-gray-500">⋮⋮</span>
              <span className="text-xs truncate max-w-[160px]">{f.name}</span>
            </div>
            <button onClick={() => onRemove(f.id)} className="text-[10px] px-2 py-0.5 rounded bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20">Удалить</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function BottomNav() {
  const pathname = usePathname();
  // В простом виде: подсказка навигации без реального расчета соседей
  return (
    <div className="mt-8 flex items-center justify-between border-t border-gray-100 dark:border-gray-700 pt-4">
      <button className="px-4 py-2 text-sm rounded border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800" disabled>
        ← Previous
      </button>
      <button className="px-4 py-2 text-sm rounded border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800" disabled>
        Next →
      </button>
    </div>
  );
}
